'use client';

import React from 'react';
import { Conversation } from '@/lib/api-client';

interface SidebarProps {
  cozeConversations?: Conversation[];
  currentConversationId?: string | null;
  onNewChat: () => void;
  onLoadCozeConversation?: (conversationId: string) => void;
  isLoadingConversations?: boolean;
}

export default function Sidebar({ 
  cozeConversations = [],
  currentConversationId, 
  onNewChat, 
  onLoadCozeConversation,
  isLoadingConversations = false
}: SidebarProps) {
  return (
    <div style={{
      width: "260px",
      height: "100vh",
      backgroundColor: "#f8f9fa",
      borderRight: "1px solid #e3e3e3",
      display: "flex",
      flexDirection: "column",
      padding: "16px 0"
    }}>
      {/* Top Section */}
      <div style={{ padding: "0 16px" }}>
        {/* Logo and Version */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          marginBottom: "8px" 
        }}>
          <h1 style={{ 
            fontSize: "20px", 
            fontWeight: "500", 
            color: "#202124", 
            padding: "16px 4px 16px 0" 
          }}>
            AI 对练
          </h1>
          <span style={{ 
            fontSize: "12px", 
            backgroundColor: "#e8f0fe", 
            color: "#1a73e8", 
            padding: "4px 8px", 
            borderRadius: "12px", 
            marginLeft: "8px" 
          }}>
            测试版本
          </span>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 20px",
            margin: "8px 0",
            backgroundColor: "transparent",
            border: "none",
            borderRadius: "8px",
            color: "#5f6368",
            fontSize: "14px",
            cursor: "pointer",
            textAlign: "left"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f1f3f4"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          新对话
        </button>

      </div>

      {/* Chat History */}
      <div style={{ 
        flex: "1", 
        borderTop: "1px solid #e8eaed", 
        paddingTop: "16px",
        overflowY: "auto"
      }}>


        {/* Coze 对话列表 */}
        {cozeConversations.length > 0 && (
          <>
            <div style={{ 
              fontSize: "14px", 
              color: "#5f6368", 
              padding: "16px 20px 8px", 
              fontWeight: "500",
              borderTop: "1px solid #e8eaed",
              marginTop: "16px"
            }}>
              Coze 对话
            </div>
            <div>
              {cozeConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  style={{
                    position: "relative",
                    margin: "2px 16px",
                    borderRadius: "8px",
                    backgroundColor: currentConversationId === conversation.id ? "#e8f0fe" : "transparent"
                  }}
                >
                  <button
                    onClick={() => onLoadCozeConversation?.(conversation.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 20px",
                      fontSize: "14px",
                      color: currentConversationId === conversation.id ? "#1a73e8" : "#202124",
                      cursor: "pointer",
                      border: "none",
                      borderRadius: "8px",
                      backgroundColor: "transparent",
                      fontWeight: currentConversationId === conversation.id ? "500" : "normal"
                    }}
                    onMouseOver={(e) => {
                      if (currentConversationId !== conversation.id) {
                        e.currentTarget.style.backgroundColor = "#f1f3f4";
                      }
                    }}
                    onMouseOut={(e) => {
                      if (currentConversationId !== conversation.id) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <div style={{ 
                      paddingRight: "24px", 
                      whiteSpace: "nowrap", 
                      overflow: "hidden", 
                      textOverflow: "ellipsis" 
                    }}>
                      {conversation.title || `对话 ${conversation.id.slice(-6)}`}
                    </div>
                    <div style={{ 
                      fontSize: "12px", 
                      color: "#5f6368", 
                      marginTop: "4px" 
                    }}>
                      {new Date(conversation.created_at).toLocaleDateString()}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 加载中状态 */}
        {isLoadingConversations && (
          <div style={{ 
            textAlign: "center", 
            color: "#5f6368", 
            fontSize: "12px", 
            padding: "16px 0" 
          }}>
            正在加载对话...
          </div>
        )}
      </div>

      {/* Settings Button */}
      <div style={{ padding: "16px" }}>
        <button
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 20px",
            backgroundColor: "transparent",
            border: "none",
            borderRadius: "8px",
            color: "#5f6368",
            fontSize: "14px",
            cursor: "pointer",
            position: "relative"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f1f3f4"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
          </svg>
          Settings and help
        </button>
      </div>
    </div>
  );
} 