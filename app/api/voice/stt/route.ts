import { NextRequest, NextResponse } from 'next/server';
import { cozeClient } from '@/lib/coze-client';
import * as fs from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  // 创建临时文件路径
  const tempDir = '/tmp';
  let tempFilePath = '';
  
  try {
    // 获取上传的音频文件
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: '未提供音频文件' },
        { status: 400 }
      );
    }

    console.log('STT API: 收到音频文件', { 
      type: audioFile.type,
      size: audioFile.size,
      name: audioFile.name
    });

    // 检查环境变量配置
    if (!process.env.COZE_API_KEY) {
      return NextResponse.json(
        { error: 'AI语音服务配置不完整' },
        { status: 500 }
      );
    }

    // 确定文件扩展名
    let fileExtension = 'wav'; // 默认使用wav
    if (audioFile.type) {
      if (audioFile.type.includes('mp3')) {
        fileExtension = 'mp3';
      } else if (audioFile.type.includes('ogg')) {
        fileExtension = 'ogg';
      } else if (audioFile.type.includes('wav')) {
        fileExtension = 'wav';
      }
    }
    
    // 创建临时文件路径
    tempFilePath = join(tempDir, `voice-${randomUUID()}.${fileExtension}`);

    // 将File对象转换为Buffer并写入临时文件
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 确保临时目录存在
    try {
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
    } catch (dirError) {
      console.error('STT API: 创建临时目录失败', dirError);
    }
    
    // 写入临时文件
    fs.writeFileSync(tempFilePath, buffer);
    console.log('STT API: 已写入临时文件', { path: tempFilePath, extension: fileExtension });
    
    // 创建文件流
    const fileStream = fs.createReadStream(tempFilePath);
    
    try {
      // 按照官方示例调用API
      const transcription = await cozeClient.audio.transcriptions.create({
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        file: fileStream as any,
      });

      console.log('STT API: 语音识别成功', { 
        text: transcription.text 
      });

      // 返回识别结果
      return NextResponse.json({
        text: transcription.text,
        success: true
      });
    } catch (apiError) {
      console.error('STT API: Coze API调用错误', apiError);
      return NextResponse.json(
        { error: `语音识别API错误: ${apiError instanceof Error ? apiError.message : '未知API错误'}` },
        { status: 500 }
      );
    } finally {
      // 清理临时文件
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
          console.log('STT API: 已删除临时文件');
        }
      } catch (cleanupError) {
        console.error('STT API: 清理临时文件失败', cleanupError);
      }
    }

  } catch (error) {
    // 确保在出错时也清理临时文件
    try {
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (cleanupError) {
      console.error('STT API: 清理临时文件失败', cleanupError);
      // 忽略清理错误
    }
    
    console.error('STT API error:', error);
    return NextResponse.json(
      { error: `语音识别错误: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
} 