import { useState, useCallback, useEffect, useRef } from 'react';
import { audioService, AudioService } from '@/lib/audio-service';

export function useVoiceOutput() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [playProgress, setPlayProgress] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioLoadingRef = useRef<boolean>(false);

  // 监听音频播放状态和进度
  useEffect(() => {
    const checkStatus = () => {
      const actualIsPlaying = audioService.getIsPlaying();
      
      // 更新播放状态
      if (isPlaying !== actualIsPlaying && !audioLoadingRef.current) {
        setIsPlaying(actualIsPlaying);
        if (!actualIsPlaying) {
          setCurrentText(null);
          setPlayProgress(0);
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
        }
      }
      
      // 如果正在播放，更新时长和进度
      if (actualIsPlaying) {
        const duration = audioService.getAudioDuration();
        if (duration > 0 && isFinite(duration) && !isNaN(duration) && duration !== audioDuration) {
          setAudioDuration(duration);
        }
        
        const progress = audioService.getPlayProgress();
        if (isFinite(progress) && !isNaN(progress)) {
          setPlayProgress(progress);
          
          // 计算剩余时间
          const currentTime = audioService.getCurrentTime();
          const remaining = duration - currentTime;
          if (remaining >= 0 && isFinite(remaining) && !isNaN(remaining)) {
            setRemainingTime(remaining);
          }
        }
      }
    };
    
    // 每100ms检查一次状态
    const interval = setInterval(checkStatus, 100);
    
    return () => {
      clearInterval(interval);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, audioDuration]);

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
      
      // 设置加载状态，防止按钮闪烁
      audioLoadingRef.current = true;
      setIsPlaying(true);
      setPlayProgress(0);
      
      // 估算音频时长（基于文本长度）
      // 中文和英文的发音速度不同，分别计算
      const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length || 0;
      const otherChars = text.length - chineseChars;
      
      // 中文每字约0.3秒，其他字符约0.1秒
      const estimatedDuration = Math.max(2, Math.min(120, (chineseChars * 0.3) + (otherChars * 0.1)));
      setAudioDuration(estimatedDuration);
      setRemainingTime(estimatedDuration);

      await audioService.playText(text, voiceId);
      
      // 获取实际音频时长
      const actualDuration = audioService.getAudioDuration();
      if (actualDuration > 0 && isFinite(actualDuration) && !isNaN(actualDuration)) {
        setAudioDuration(actualDuration);
        setRemainingTime(actualDuration);
        console.log('获取到实际音频时长:', actualDuration);
      } else {
        console.log('使用估算音频时长:', estimatedDuration);
      }
      
      // 音频加载完成，重置加载状态
      audioLoadingRef.current = false;
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '语音播放失败';
      setError(errorMessage);
      setIsPlaying(false);
      setCurrentText(null);
      setPlayProgress(0);
      audioLoadingRef.current = false;
      return false;
    }
  }, []);

  const stopPlaying = useCallback(() => {
    audioService.stop();
    setIsPlaying(false);
    setCurrentText(null);
    setPlayProgress(0);
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

  // 播放原始音频Blob
  const playAudio = useCallback(async (audioBlob: Blob): Promise<boolean> => {
    try {
      setError(null);
      
      // 设置加载状态，防止按钮闪烁
      audioLoadingRef.current = true;
      setIsPlaying(true);
      setPlayProgress(0);
      
      // 创建音频URL
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // 等待加载以获取时长
      await new Promise<void>((resolve) => {
        audio.onloadedmetadata = () => {
          const duration = audio.duration || 0;
          setAudioDuration(duration);
          setRemainingTime(duration);
          resolve();
        };
        
        // 如果加载超时，使用默认时长
        setTimeout(() => {
          if (!audio.duration || audio.duration === 0) {
            const defaultDuration = 10;
            setAudioDuration(defaultDuration);
            setRemainingTime(defaultDuration);
          }
          resolve();
        }, 1000);
      });
      
      // 播放结束时清理
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentText(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      // 错误处理
      audio.onerror = () => {
        setError('音频播放失败');
        setIsPlaying(false);
        setCurrentText(null);
        URL.revokeObjectURL(audioUrl);
        audioLoadingRef.current = false;
      };
      
      // 开始播放
      await audio.play();
      
      // 音频加载完成，重置加载状态
      audioLoadingRef.current = false;
      
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : '音频播放失败');
      setIsPlaying(false);
      audioLoadingRef.current = false;
      return false;
    }
  }, []);

  return {
    isPlaying,
    currentText,
    error,
    audioDuration,
    playProgress,
    remainingTime,
    playText,
    playAudio,
    stopPlaying,
    pausePlaying,
    resumePlaying,
    togglePlaying,
    isSupported: AudioService.isSupported(),
  };
} 