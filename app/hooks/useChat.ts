import { useState, useCallback, useRef } from 'react';
import { useVoiceOutput } from './useVoiceOutput';
import { ContentType } from '@coze/api';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  content_type?: ContentType;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { playText, stopPlaying } = useVoiceOutput();
  const [autoPlayVoice, setAutoPlayVoice] = useState(false);

  const sendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      role: 'user',
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // 创建中断控制器
    abortControllerRef.current = new AbortController();

    try {
      console.log("开始发送消息到API...", { conversationId });
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          userId: 'user_' + Math.random().toString(36).substr(2, 9),
          chatHistory: messages,
          conversationId: conversationId
        }),
        signal: abortControllerRef.current.signal,
      });

      console.log("API响应状态:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: 'assistant',
        timestamp: new Date(),
      };

      // 添加空的助手消息
      setMessages(prev => [...prev, assistantMessage]);

      console.log("开始读取流式响应...");
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value);
          console.log("收到数据块:", chunk);
          
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                console.log("解析的数据:", data);
                
                if (data.type === 'delta') {
                  assistantMessage.content = data.fullContent;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { ...assistantMessage };
                    return newMessages;
                  });
                } else if (data.type === 'done') {
                  assistantMessage.content = data.fullContent;
                  const finalMessages = [...newMessages, assistantMessage];
                  setMessages(finalMessages);
                  
                  // 保存会话ID
                  if (data.conversation_id) {
                    console.log("保存会话ID:", data.conversation_id);
                    setConversationId(data.conversation_id);
                  }
                  
                  // 如果启用了自动语音播放，播放最新的回复
                  if (autoPlayVoice && assistantMessage.content) {
                    playText(assistantMessage.content);
                  }
                } else if (data.type === 'meta' && data.conversation_id) {
                  console.log("收到元数据 - 会话ID:", data.conversation_id);
                  setConversationId(data.conversation_id);
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (e) {
                // 忽略JSON解析错误，可能是不完整的数据
                console.error("解析数据时出错:", e);
                if (e instanceof Error && !e.message.includes('JSON')) {
                  throw e;
                }
              }
            }
          }
        }
      }
      console.log("流式响应结束");
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return; // 用户取消了请求
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `抱歉，发生了错误：${error instanceof Error ? error.message : '未知错误'}`,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => {
        // 如果最后一条消息是空的助手消息，替换它；否则添加新的错误消息
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.role === 'assistant' && 
            newMessages[newMessages.length - 1]?.content === '') {
          newMessages[newMessages.length - 1] = errorMessage;
        } else {
          newMessages.push(errorMessage);
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading, conversationId, autoPlayVoice, playText]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null); // 清除会话ID
    stopPlaying(); // 停止当前语音播放
  }, [stopPlaying]);

  const setCozeMessages = useCallback((messages: Message[]) => {
    setMessages(messages);
  }, []);

  const setActiveConversation = useCallback((id: string) => {
    setConversationId(id);
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    stopPlaying(); // 停止当前语音播放
  }, [stopPlaying]);

  const toggleAutoPlayVoice = useCallback(() => {
    setAutoPlayVoice(prev => !prev);
  }, []);

  // 导出setIsLoading函数
  const updateIsLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return {
    messages,
    isLoading,
    conversationId,
    autoPlayVoice,
    sendMessage,
    clearMessages,
    stopGeneration,
    toggleAutoPlayVoice,
    setIsLoading: updateIsLoading,
    setCozeMessages,
    setActiveConversation,
  };
} 