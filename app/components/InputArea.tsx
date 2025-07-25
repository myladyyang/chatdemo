'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  onImageUpload: (file: File) => void;
  isLoading: boolean;
}

export default function InputArea({ 
  onSendMessage, 
  onImageUpload, 
  isLoading
}: InputAreaProps) {
  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  const { 
    isRecording,
    recordingDuration,
    maxRecordingTime,
    error: voiceError,
    status,
    startRecording,
    stopRecording,
    cancelRecording,
    sendAudioForTranscription,
    isSupported: isVoiceSupported 
  } = useVoiceInput();

  // 检测是否为触摸设备
  useEffect(() => {
    // 在客户端运行时检测触摸设备
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleSubmit = () => {
    const messageText = inputValue.trim();
    if (messageText && !isLoading) {
      console.log('InputArea: 发送消息', { messageText });
      onSendMessage(messageText);
      setInputValue('');
    }
  };

  // 处理按下语音按钮
  const handleVoiceButtonDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isLoading || isRecording) return;
    
    console.log('InputArea: 按下语音按钮');
    startRecording();
  };

  // 处理松开语音按钮
  const handleVoiceButtonUp = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isRecording) return;
    
    console.log('InputArea: 松开语音按钮');
    const audioBlob = await stopRecording();
    
    if (audioBlob) {
      // 发送音频到服务器进行识别
      const text = await sendAudioForTranscription(audioBlob);
      if (text) {
        onSendMessage(text);
      }
    }
  };

  // 处理移出按钮区域（取消录音）
  const handleVoiceButtonLeave = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isRecording) {
      console.log('InputArea: 移出语音按钮区域，取消录音');
      cancelRecording();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  return (
    <div className="input-area" style={{
      padding: "20px 40px 40px",
      borderTop: "1px solid #e8eaed",
      backgroundColor: "#ffffff",
      position: "relative"
    }}>
      {/* 语音录入状态提示 */}
      {isRecording && (
        <div style={{
          position: "absolute",
          top: "-60px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#ea4335",
          color: "white",
          padding: "16px",
          borderRadius: "12px",
          fontSize: "14px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          zIndex: 10,
          minWidth: "200px"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "white",
              animation: "pulse 1.5s infinite"
            }}></div>
            <span>正在录音... {recordingDuration}s/{maxRecordingTime}s</span>
          </div>
          <div style={{
            fontSize: "12px",
            opacity: 0.8
          }}>
            松开发送，上滑取消
          </div>
        </div>
      )}

      {/* 语音处理状态提示 */}
      {!isRecording && status === 'processing' && (
        <div style={{
          position: "absolute",
          top: "-40px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#4285f4",
          color: "white",
          padding: "8px 16px",
          borderRadius: "20px",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          zIndex: 10
        }}>
          <div style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "white",
            animation: "bounce 0.6s infinite"
          }}></div>
          正在处理语音...
        </div>
      )}

      {/* 语音错误提示 */}
      {voiceError && (
        <div style={{
          position: "absolute",
          top: "-40px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#ea4335",
          color: "white",
          padding: "8px 16px",
          borderRadius: "20px",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          zIndex: 10
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {voiceError}
        </div>
      )}

      <div className="input-wrapper" style={{
        position: "relative",
        maxWidth: "800px",
        margin: "0 auto",
        backgroundColor: "#f8f9fa",
        borderRadius: "24px",
        border: "1px solid #e8eaed",
        padding: "4px",
        display: "flex",
        alignItems: "flex-end",
        gap: "8px"
      }}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          style={{ display: 'none' }}
        />
        
        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={inputValue || ''}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入消息..."
          disabled={isLoading || isRecording}
          style={{
            flex: "1",
            border: "none",
            outline: "none",
            backgroundColor: "transparent",
            padding: "16px 20px",
            fontSize: "16px",
            color: "#202124",
            resize: "none",
            minHeight: "24px",
            maxHeight: "200px",
            fontFamily: "inherit"
          }}
          rows={1}
        />

        {/* Action Buttons */}
        <div className="action-buttons" style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px"
        }}>
          {/* Voice Button - 按住说话 use a micphone icon*/}

            <button
              onMouseDown={handleVoiceButtonDown}
              onMouseUp={handleVoiceButtonUp}
              onMouseLeave={handleVoiceButtonLeave}
              disabled={isLoading}
              style={{
                width: "80px",
                height: "36px",
                border: "none",
                borderRadius: "18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isRecording ? "#ea4335" : "#f0f0f0",
                color: isRecording ? "white" : "#5f6368",
                opacity: isLoading ? 0.5 : 1,
                transition: "background-color 0.2s ease",
                fontSize: "14px",
                fontWeight: "500",
                userSelect: "none",
                WebkitUserSelect: "none"
              }}
          
            > 
              <Mic className="w-4 h-4" />
            </button>
    

          {/* Send Button - only show when there's text */}
          {inputValue && inputValue.trim() && (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              style={{
                width: "32px",
                height: "32px",
                border: "none",
                backgroundColor: "#4285f4",
                color: "white",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: isLoading ? 0.5 : 1
              }}
              title="发送消息"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          )}
        </div>
      </div>
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
} 