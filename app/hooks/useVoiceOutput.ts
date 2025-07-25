import { useState, useCallback } from 'react';
import { audioService, AudioService } from '@/lib/audio-service';

export function useVoiceOutput() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const playText = useCallback(async (text: string, voiceId?: string) => {
    if (!text.trim()) {
      setError('文本内容不能为空');
      return false;
    }

    if (!AudioService.isSupported()) {
      setError('您的浏览器不支持音频播放功能');
      return false;
    }

    try {
      setError(null);
      setCurrentText(text);
      setIsPlaying(true);

      await audioService.playText(text, voiceId);
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '语音播放失败';
      setError(errorMessage);
      setIsPlaying(false);
      setCurrentText(null);
      return false;
    }
  }, []);

  const stopPlaying = useCallback(() => {
    audioService.stop();
    setIsPlaying(false);
    setCurrentText(null);
    setError(null);
  }, []);

  const pausePlaying = useCallback(() => {
    if (isPlaying) {
      audioService.pause();
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const resumePlaying = useCallback(() => {
    if (!isPlaying && currentText) {
      audioService.resume();
      setIsPlaying(true);
    }
  }, [isPlaying, currentText]);

  const togglePlaying = useCallback(() => {
    if (isPlaying) {
      pausePlaying();
    } else if (currentText) {
      resumePlaying();
    }
  }, [isPlaying, currentText, pausePlaying, resumePlaying]);

  // 监听音频播放结束
  const checkPlayingStatus = useCallback(() => {
    const actualIsPlaying = audioService.getIsPlaying();
    if (isPlaying !== actualIsPlaying) {
      setIsPlaying(actualIsPlaying);
      if (!actualIsPlaying) {
        setCurrentText(null);
      }
    }
  }, [isPlaying]);

  return {
    isPlaying,
    currentText,
    error,
    playText,
    stopPlaying,
    pausePlaying,
    resumePlaying,
    togglePlaying,
    checkPlayingStatus,
    isSupported: AudioService.isSupported(),
  };
} 