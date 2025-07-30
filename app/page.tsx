'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import { useChat } from './hooks/useChat';
import { fetchConversations, fetchConversationMessages, Conversation, Message } from '@/lib/api-client';
import { ChatMessage } from '@/lib/chat-service';
import { ContentType } from '@coze/api';

export default function Home() {
  const { 
    messages, 
    isLoading, 
    conversationId,
    sendMessage, 
    clearMessages, 
    setIsLoading,
    setCozeMessages,
    setActiveConversation
  } = useChat();
  
  // Coze对话列表状态
  const [cozeConversations, setCozeConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  // 获取Coze对话列表
  const fetchCozeConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await fetchConversations();
      
      if (response.success && response.data) {
        setCozeConversations(response.data.conversations || []);
      } else {
        console.error('获取Coze对话列表失败', response.error);
      }
    } catch (error) {
      console.error('获取Coze对话列表失败', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // 加载Coze对话
  const handleLoadCozeConversation = async (conversationId: string) => {
    try {
      // 清空当前会话
      clearMessages();
      
      // 显示加载状态
      setIsLoading(true);
      
      // 设置当前会话ID
      setActiveConversation(conversationId);
      
      // 获取对话消息
      const response = await fetchConversationMessages(conversationId);
      
      console.log('加载Coze对话', response);

      if (response.success && response.data) {
        const messagesData = response.data.data || [];
        
        if (messagesData.length > 0) {
          // 转换消息格式
          const formattedMessages: ChatMessage[] = messagesData.map((msg: Message) => ({
            id: msg.id,
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            timestamp: new Date(msg.created_at),
            content_type: msg.content_type as ContentType
          }));

          setCozeMessages(formattedMessages.reverse());
        }
      } else {
        console.error('加载Coze对话失败', response.error);
      }
    } catch (error) {
      console.error('加载Coze对话失败', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 组件加载时获取Coze对话列表
  useEffect(() => {
    fetchCozeConversations();
  }, []);

  return (
    <main style={{
      display: "flex",
      height: "100vh",
      width: "100vw",
      overflow: "hidden"
    }}>
      <Sidebar 
        cozeConversations={cozeConversations}
        currentConversationId={conversationId}
        onNewChat={clearMessages}
        onLoadCozeConversation={handleLoadCozeConversation}
        isLoadingConversations={isLoadingConversations}
      />
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden"
      }}>
        <ChatArea 
          messages={messages} 
          isLoading={isLoading} 
        />
        <InputArea 
          onSendMessage={(text, audioBlob) => {
            // 将文本和音频Blob一起传递给sendMessage
            sendMessage(text, audioBlob);
          }} 
          onImageUpload={(file) => console.log('Image upload:', file)} 
          isLoading={isLoading} 
        />
      </div>
    </main>
  );
}
