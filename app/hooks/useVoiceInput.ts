import { useState, useCallback, useRef } from 'react';
import { voiceService, VoiceService } from '@/lib/voice-service';

export function useVoiceInput() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing'>('idle');
  const audioRef = useRef<Blob | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<string>('');

  // 开始录音（按下按钮时调用）
  const startRecording = useCallback(() => {
    console.log('语音输入钩子: 开始录音');
    
    if (isRecording) {
      console.log('语音输入钩子: 已经在录音中');
      return;
    }

    setError(null);
    setStatus('recording');
    audioRef.current = null;
    transcriptRef.current = '';
    setRecordingDuration(0);

    // 开始计时
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      setRecordingDuration(duration);
    }, 1000);

    // 开始录音
    voiceService.startRecording(
      (audioBlob) => {
        console.log('语音输入钩子: 获取到音频数据', { size: audioBlob.size });
        audioRef.current = audioBlob;
      },
      () => {
        console.log('语音输入钩子: 录音结束');
        setIsRecording(false);
        setStatus('idle');
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      },
      (errorMessage) => {
        console.error('语音输入钩子: 录音错误', { errorMessage });
        setError(errorMessage);
        setIsRecording(false);
        setStatus('idle');
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    ).then(success => {
      if (success) {
        setIsRecording(true);
      }
    });
  }, [isRecording]);

  // 停止录音（松开按钮时调用）
  const stopRecording = useCallback(async () => {
    console.log('语音输入钩子: 停止录音');
    
    if (!isRecording) {
      console.log('语音输入钩子: 未在录音中');
      return null;
    }

    setStatus('processing');
    voiceService.stopRecording();
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 等待音频数据准备完成
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!audioRef.current && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    const audioBlob = audioRef.current;
    if (!audioBlob) {
      console.error('语音输入钩子: 未能获取到音频数据');
      // setError('未能获取到录音数据');
      setStatus('idle');
      return null;
    }

    // 返回音频Blob
    return audioBlob;
  }, [isRecording]);

  // 取消录音
  const cancelRecording = useCallback(() => {
    console.log('语音输入钩子: 取消录音');
    
    if (isRecording) {
      voiceService.cancelRecording();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
    setStatus('idle');
    setRecordingDuration(0);
    audioRef.current = null;
  }, [isRecording]);

  // 将录音发送到服务器进行语音识别
  const sendAudioForTranscription = useCallback(async (audioBlob: Blob): Promise<string | null> => {
    console.log('语音输入钩子: 发送音频进行转写', { 
      size: audioBlob.size,
      type: audioBlob.type
    });
    setStatus('processing');
    
    try {
      // 确定文件扩展名
      let fileExtension = 'wav'; // 默认使用wav
      if (audioBlob.type) {
        if (audioBlob.type.includes('mp3')) {
          fileExtension = 'mp3';
        } else if (audioBlob.type.includes('ogg')) {
          fileExtension = 'ogg';
        } else if (audioBlob.type.includes('wav')) {
          fileExtension = 'wav';
        }
      }
      
      // 创建FormData对象
      const formData = new FormData();
      formData.append('audio', audioBlob, `recording.${fileExtension}`);
      
      // 发送到服务器
      const response = await fetch('/api/voice/stt', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('语音输入钩子: API返回错误', data);
        throw new Error(data.error || '语音识别服务错误');
      }
      
      console.log('语音输入钩子: 语音识别成功', { text: data.text });
      
      if (!data.text || data.text.trim() === '') {
        setError('未能识别出语音内容，请重试');
        setStatus('idle');
        return null;
      }
      
      transcriptRef.current = data.text;
      setStatus('idle');
      return data.text;
    } catch (error) {
      console.error('语音输入钩子: 语音识别错误', error);
      setError(error instanceof Error ? error.message : '语音识别失败，请重试');
      setStatus('idle');
      return null;
    }
  }, []);

  // 获取最大录音时长
  const getMaxRecordingTime = useCallback(() => {
    return voiceService.getMaxRecordingTime();
  }, []);

  return {
    isRecording,
    recordingDuration,
    maxRecordingTime: getMaxRecordingTime(),
    error,
    status,
    startRecording,
    stopRecording,
    cancelRecording,
    sendAudioForTranscription,
    isSupported: VoiceService.isSupported(),
  };
} 