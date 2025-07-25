import { NextRequest, NextResponse } from 'next/server';
import { cozeClient } from '@/lib/coze-client';

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: '文本内容是必需的' },
        { status: 400 }
      );
    }

    // 检查环境变量配置
    if (!process.env.COZE_API_KEY) {
      return NextResponse.json(
        { error: 'AI语音服务配置不完整' },
        { status: 500 }
      );
    }

    // 获取默认语音ID
    const defaultVoiceId = process.env.COZE_VOICE_ID || '742894224871836***';

    console.log('TTS API: 开始生成语音', { 
      textLength: text.length,
      voiceId: voiceId || defaultVoiceId
    });

    // 调用Coze语音合成API
    const speechBuffer = await cozeClient.audio.speech.create({
      input: text,
      voice_id: voiceId || defaultVoiceId,
      response_format: 'mp3',
    });

    console.log('TTS API: 语音生成成功');

    // 返回音频流
    return new Response(speechBuffer as unknown as ArrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="speech.mp3"',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: `语音合成错误: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
} 