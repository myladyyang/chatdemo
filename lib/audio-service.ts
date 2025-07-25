export class AudioService {
  private audio: HTMLAudioElement | null = null;
  private isPlaying = false;

  // 文本转语音并播放
  async playText(text: string, voiceId?: string): Promise<void> {
    if (!text.trim()) {
      throw new Error('文本内容不能为空');
    }

    try {
      // 停止当前播放
      this.stop();

      // 调用TTS API
      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          voiceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '语音合成失败');
      }

      // 创建音频对象
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      this.audio = new Audio(audioUrl);
      this.isPlaying = true;

      // 设置音频事件监听器
      this.audio.onended = () => {
        this.isPlaying = false;
        this.cleanup();
      };

      this.audio.onerror = () => {
        this.isPlaying = false;
        this.cleanup();
        throw new Error('音频播放失败');
      };

      // 播放音频
      await this.audio.play();

    } catch (error) {
      this.isPlaying = false;
      this.cleanup();
      throw error;
    }
  }

  // 停止播放
  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.isPlaying = false;
    this.cleanup();
  }

  // 暂停播放
  pause(): void {
    if (this.audio && this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
    }
  }

  // 恢复播放
  resume(): void {
    if (this.audio && !this.isPlaying) {
      this.audio.play();
      this.isPlaying = true;
    }
  }

  // 获取播放状态
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // 清理资源
  private cleanup(): void {
    if (this.audio) {
      const audioUrl = this.audio.src;
      if (audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
      this.audio = null;
    }
  }

  // 检查浏览器是否支持音频播放
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.Audio);
  }
}

// 创建单例实例
export const audioService = new AudioService(); 