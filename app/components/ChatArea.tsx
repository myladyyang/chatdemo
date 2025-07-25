'use client';

import React from 'react';
import { useVoiceOutput } from '../hooks/useVoiceOutput';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  autoPlayVoice?: boolean;
  onToggleAutoPlayVoice?: () => void;
}

export default function ChatArea({ 
  messages, 
  isLoading, 
  autoPlayVoice = false,
  onToggleAutoPlayVoice
}: ChatAreaProps) {
  const { isPlaying, currentText, playText, stopPlaying, isSupported } = useVoiceOutput();

  const handlePlayText = async (text: string) => {
    if (currentText === text && isPlaying) {
      stopPlaying();
    } else {
      await playText(text);
    }
  };

  if (messages.length === 0) {
    return (
      <div style={{
        flex: "1",
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff"
      }}>
        <h1 style={{
          fontSize: "32px",
          fontWeight: "400",
          color: "#4285f4",
          textAlign: "center",
          marginBottom: "40px",
          fontFamily: "Google Sans, sans-serif"
        }}>
          欢迎，准备好了开始测试了吗
        </h1>
      </div>
    );
  }

  return (
    <div style={{
      flex: "1",
      padding: "40px",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#ffffff",
      overflowY: "auto"
    }}>


      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        width: "100%"
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: "flex",
              justifyContent: message.role === 'user' ? "flex-end" : "flex-start",
              marginBottom: "16px"
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                borderRadius: "16px",
                padding: "16px",
                position: "relative",
                backgroundColor: message.role === 'user' ? "#4285f4" : "#f8f9fa",
                color: message.role === 'user' ? "#ffffff" : "#202124",
                border: message.role === 'user' ? "none" : "1px solid #e8eaed"
              }}
            >
              <div style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: "14px",
                lineHeight: "1.4"
              }}>
                {message.content}
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "8px",
                color: message.role === 'user' ? "rgba(255, 255, 255, 0.7)" : "#5f6368",
                fontSize: "12px"
              }}>
                <span>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                
                {/* 语音播放按钮 - 只在AI消息上显示 */}
                {message.role === 'assistant' && isSupported && (
                  <button
                    onClick={() => handlePlayText(message.content)}
                    style={{
                      marginLeft: "8px",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: currentText === message.content && isPlaying ? "#4285f4" : "transparent",
                      color: currentText === message.content && isPlaying ? "#ffffff" : "#5f6368",
                      opacity: 0.7,
                      transition: "opacity 0.2s ease"
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseOut={(e) => (e.currentTarget.style.opacity = "0.7")}
                    title={currentText === message.content && isPlaying ? "停止播放" : "播放语音"}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      {currentText === message.content && isPlaying ? (
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/> // 停止图标
                      ) : (
                        <path d="M8 5v14l11-7z"/> // 播放图标
                      )}
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{
            display: "flex",
            justifyContent: "flex-start",
            marginBottom: "16px"
          }}>
            <div style={{
              backgroundColor: "#f8f9fa",
              color: "#202124",
              border: "1px solid #e8eaed",
              borderRadius: "16px",
              padding: "16px"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <div style={{
                  display: "flex",
                  gap: "4px"
                }}>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#5f6368",
                    borderRadius: "50%",
                    animation: "bounce 0.6s infinite"
                  }}></div>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#5f6368",
                    borderRadius: "50%",
                    animation: "bounce 0.6s infinite 0.1s"
                  }}></div>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#5f6368",
                    borderRadius: "50%",
                    animation: "bounce 0.6s infinite 0.2s"
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
} 