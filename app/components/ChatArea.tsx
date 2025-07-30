'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useVoiceOutput } from '../hooks/useVoiceOutput';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  audioDuration?: number; // 音频时长（秒）
  isPlayed?: boolean; // 是否已播放
  audioBlob?: Blob; // 用户原始音频
  showText?: boolean; // 是否显示文字内容
}

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatArea({ 
  messages, 
  isLoading
}: ChatAreaProps) {
  const { isPlaying, currentText, playText, playAudio, stopPlaying, isSupported, audioDuration, playProgress, remainingTime } = useVoiceOutput();
  const [messagesWithState, setMessagesWithState] = useState<Message[]>([]);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 更新消息状态
  useEffect(() => {
    setMessagesWithState(messages.map(msg => ({
      ...msg,
      audioDuration: msg.audioDuration || estimateAudioDuration(msg.content),
      isPlayed: msg.isPlayed || false,
      showText: msg.showText || false
    })));
  }, [messages]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesWithState, isLoading]);

  // 监听播放状态，当播放停止时重置播放索引
  useEffect(() => {
    if (!isPlaying && playingIndex !== null) {
      setPlayingIndex(null);
    }
  }, [isPlaying]);

  // 估算音频时长（基于文本长度）
  const estimateAudioDuration = (text: string): number => {
    // 中文和英文的发音速度不同，分别计算
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length || 0;
    const otherChars = text.length - chineseChars;
    
    // 中文每字约0.3秒，其他字符约0.1秒
    const duration = (chineseChars * 0.3) + (otherChars * 0.1);
    return Math.max(2, Math.min(120, duration));
  };

  // 格式化时间（秒 -> MM:SS）
  const formatTime = (seconds: number): string => {
    // 处理无效值
    if (seconds === undefined || seconds === null || isNaN(seconds) || !isFinite(seconds)) {
      return "0:00";
    }
    
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.floor(Math.max(0, seconds) % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 切换显示文字
  const toggleShowText = (index: number) => {
    setMessagesWithState(prev => 
      prev.map((msg, i) => 
        i === index ? { ...msg, showText: !msg.showText } : msg
      )
    );
  };

  // 播放消息（根据角色决定播放方式）
  const handlePlayMessage = async (message: Message, index: number) => {
    // 如果正在播放当前消息，则停止播放
    if (currentText === message.content && isPlaying) {
      stopPlaying();
      setPlayingIndex(null);
      return;
    }
    
    // 设置当前播放索引
    setPlayingIndex(index);
    
    // 根据消息类型选择播放方式
    let success = false;
    
    // 如果是用户消息且有原始音频，则播放原始音频
    if (message.role === 'user' && message.audioBlob) {
      success = await playAudio(message.audioBlob);
    } else {
      // 否则使用TTS播放文本
      success = await playText(message.content);
    }
    
    // 如果播放成功，更新消息状态
    if (success) {
      // 更新消息的音频时长和播放状态
      setMessagesWithState(prev => 
        prev.map((msg, i) => 
          i === index ? { 
            ...msg, 
            audioDuration: audioDuration > 0 ? audioDuration : msg.audioDuration, 
            isPlayed: true 
          } : msg
        )
      );
    } else {
      // 如果播放失败，重置播放索引
      setPlayingIndex(null);
    }
  };

  if (messagesWithState.length === 0) {
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
          欢迎，准备好了开始语音对话了吗
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
        {messagesWithState.map((message, index) => (
          <div
            key={message.id}
            style={{
              display: "flex",
              justifyContent: message.role === 'user' ? "flex-end" : "flex-start",
              marginBottom: "16px",
              alignItems: "flex-start",
              gap: "12px"
            }}
          >
            {/* 头像 - 助手消息在左侧显示 */}
            {message.role === 'assistant' && (
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#4285f4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#ffffff",
                fontWeight: "bold",
                fontSize: "16px"
              }}>
                AI
              </div>
            )}
            
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
              {/* 语音消息显示 */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                minWidth: "200px"
              }}>
                {/* 播放/暂停按钮 */}
                <button
                  onClick={() => handlePlayMessage(message, index)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: playingIndex === index ? 
                      (message.role === 'user' ? "#ffffff" : "#4285f4") : 
                      (message.role === 'user' ? "rgba(255,255,255,0.2)" : "#e8eaed"),
                    color: playingIndex === index ? 
                      (message.role === 'user' ? "#4285f4" : "#ffffff") : 
                      (message.role === 'user' ? "#ffffff" : "#5f6368"),
                    flexShrink: 0,
                    transition: "all 0.2s ease"
                  }}
                  title={playingIndex === index ? "停止播放" : "播放语音"}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    {playingIndex === index ? (
                      <path d="M6 6h12v12H6z"/> // 方形停止图标
                    ) : (
                      <path d="M8 5v14l11-7z"/> // 播放图标
                    )}
                  </svg>
                </button>
                
                {/* 语音条 */}
                <div style={{
                  flex: "1",
                  position: "relative",
                  height: "24px",
                  backgroundColor: message.role === 'user' ? 
                    "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.05)",
                  borderRadius: "12px",
                  overflow: "hidden"
                }}>
                  {/* 播放进度条 */}
                  {playingIndex === index && (
                    <div 
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        height: "100%",
                        backgroundColor: message.role === 'user' ? 
                          "rgba(255,255,255,0.5)" : "rgba(66,133,244,0.3)",
                        width: `${playProgress}%`,
                        transition: "width 0.1s linear"
                      }}
                    />
                  )}
                  
                  {/* 音频时长/剩余时间 */}
                  <div style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "12px",
                    color: message.role === 'user' ? 
                      "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)",
                    fontWeight: "500",
                    zIndex: 2
                  }}>
                    {playingIndex === index 
                      ? formatTime(remainingTime) // 播放时显示剩余时间
                      : formatTime(message.audioDuration || 0) // 未播放时显示总时长
                    }
                  </div>
                </div>
                
                {/* 已播放标记 */}
                {message.isPlayed && message.role === 'assistant' && (
                  <div style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: "#34a853",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#ffffff">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                )}
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
                
                {/* 查看文字按钮 */}
                <button
                  onClick={() => toggleShowText(index)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: message.role === 'user' ? "rgba(255, 255, 255, 0.7)" : "#5f6368",
                    fontSize: "12px",
                    padding: "0",
                    textDecoration: "underline",
                    opacity: 0.7
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = "0.7")}
                >
                  {message.showText ? "隐藏文字" : "查看文字"}
                </button>
              </div>
              
              {/* 文字内容（可切换显示） */}
              {message.showText && (
                <div style={{
                  marginTop: "12px",
                  padding: "8px",
                  borderRadius: "8px",
                  backgroundColor: message.role === 'user' ? 
                    "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.03)",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word"
                }}>
                  {message.content}
                </div>
              )}
            </div>
            
            {/* 头像 - 用户消息在右侧显示 */}
            {message.role === 'user' && (
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#34a853",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#ffffff",
                fontWeight: "bold",
                fontSize: "16px"
              }}>
                我
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div style={{
            display: "flex",
            justifyContent: "flex-start",
            marginBottom: "16px",
            alignItems: "flex-start",
            gap: "12px"
          }}>
            {/* AI头像 */}
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#4285f4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "#ffffff",
              fontWeight: "bold",
              fontSize: "16px"
            }}>
              AI
            </div>
            
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
                <span style={{ fontSize: "14px" }}>正在生成语音回复...</span>
              </div>
            </div>
          </div>
        )}
        
        {/* 用于自动滚动的引用元素 */}
        <div ref={messagesEndRef} />
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