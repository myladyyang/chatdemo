// 定义Web Speech API类型
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      isFinal: boolean;
      transcript: string;
      [key: string]: unknown;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

export class VoiceService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private recordingTimeout: NodeJS.Timeout | null = null;
  private maxRecordingTime = 10000; // 最长录音10秒
  private onDataAvailableCallback?: (audioBlob: Blob) => void;
  private onRecordingEndCallback?: () => void;
  private onErrorCallback?: (error: string) => void;

  constructor() {
    console.log('语音服务: 初始化');
  }

  // 开始录音
  public async startRecording(
    onDataAvailable?: (audioBlob: Blob) => void,
    onRecordingEnd?: () => void,
    onError?: (error: string) => void
  ): Promise<boolean> {
    console.log('语音服务: 尝试开始录音');
    
    if (!VoiceService.isSupported()) {
      const errorMsg = '您的浏览器不支持语音录制功能';
      console.error('语音服务:', errorMsg);
      onError?.(errorMsg);
      return false;
    }

    if (this.isRecording) {
      console.log('语音服务: 已经在录音中，忽略请求');
      return false;
    }

    this.onDataAvailableCallback = onDataAvailable;
    this.onRecordingEndCallback = onRecordingEnd;
    this.onErrorCallback = onError;
    this.audioChunks = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 尝试使用Coze API支持的格式
      let options;
      
      // 按优先级尝试不同的音频格式
      try {
        options = { mimeType: 'audio/mp3' };
        this.mediaRecorder = new MediaRecorder(stream, options);
        console.log('语音服务: 使用audio/mp3格式');
      } catch (e1) {
        try {
          options = { mimeType: 'audio/wav' };
          this.mediaRecorder = new MediaRecorder(stream, options);
          console.log('语音服务: 使用audio/wav格式');
        } catch (e2) {
          try {
            options = { mimeType: 'audio/ogg' };
            this.mediaRecorder = new MediaRecorder(stream, options);
            console.log('语音服务: 使用audio/ogg格式');
          } catch (e3) {
            // 如果上述格式都不支持，使用默认格式
            this.mediaRecorder = new MediaRecorder(stream);
            console.log('语音服务: 使用默认格式', { mimeType: this.mediaRecorder.mimeType });
          }
        }
      }
      
      // 配置录音参数
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log('语音服务: 录音结束');
        
        // 停止所有音轨
        stream.getTracks().forEach(track => track.stop());
        
        // 生成音频Blob
        const mimeType = this.mediaRecorder?.mimeType || 'audio/wav';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        console.log('语音服务: 生成音频Blob', { 
          size: audioBlob.size, 
          type: mimeType 
        });
        
        this.isRecording = false;
        this.clearRecordingTimer();
        
        // 回调返回音频数据
        if (audioBlob.size > 0 && this.onDataAvailableCallback) {
          this.onDataAvailableCallback(audioBlob);
        }
        
        if (this.onRecordingEndCallback) {
          this.onRecordingEndCallback();
        }
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('语音服务: 录音错误', event);
        this.isRecording = false;
        this.clearRecordingTimer();
        
        if (this.onErrorCallback) {
          this.onErrorCallback('录音过程中发生错误');
        }
      };

      // 开始录音
      this.mediaRecorder.start(100); // 每100ms触发一次ondataavailable事件
      this.isRecording = true;
      this.startRecordingTimer();
      console.log('语音服务: 开始录音成功');
      return true;
    } catch (error) {
      const errorMsg = '启动录音失败，请确保已授权麦克风权限';
      console.error('语音服务:', errorMsg, error);
      onError?.(errorMsg);
      return false;
    }
  }

  // 停止录音
  public stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      console.log('语音服务: 停止录音');
      this.mediaRecorder.stop();
      this.clearRecordingTimer();
    } else {
      console.log('语音服务: 停止录音请求被忽略，当前未在录音');
    }
  }

  // 取消录音
  public cancelRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      console.log('语音服务: 取消录音');
      
      // 停止录音但不触发数据回调
      this.onDataAvailableCallback = undefined;
      this.mediaRecorder.stop();
      this.clearRecordingTimer();
    }
  }

  private startRecordingTimer() {
    this.clearRecordingTimer();
    this.recordingTimeout = setTimeout(() => {
      console.log(`语音服务: 录音达到最大时长 ${this.maxRecordingTime/1000} 秒，自动停止`);
      this.stopRecording();
    }, this.maxRecordingTime);
  }

  private clearRecordingTimer() {
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }
  }

  // 检查是否正在录音
  public getIsRecording(): boolean {
    return this.isRecording;
  }

  // 获取最大录音时长（秒）
  public getMaxRecordingTime(): number {
    return this.maxRecordingTime / 1000;
  }

  // 检查是否支持语音录制
  public static isSupported(): boolean {
    // if (typeof window === 'undefined') return false;
    // const isSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    // console.log('语音服务: 浏览器支持检查', { isSupported });
    // return isSupported;
    return true
  }
}

// 创建单例实例
export const voiceService = new VoiceService(); 