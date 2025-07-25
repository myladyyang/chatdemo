/**
 * 前端API客户端
 * 用于调用后端API，处理对话相关操作
 */

// API响应类型
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 对话相关类型
export interface Conversation {
  id: string;
  title?: string;
  created_at: string;
  updated_at?: string;
  bot_id?: string;
  user?: string;
  meta_data?: Record<string, unknown>;
  last_section_id?: string;
}

export interface ConversationsListResponse {
  conversations: Conversation[];
  total?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string | Record<string, unknown>;
  content_type: string;
  created_at: string;
  updated_at: string;
  meta_data?: Record<string, unknown>;
}

export interface MessagesListResponse {
  data: Message[];
  total?: number;
}

export interface ConversationSession {
  id: string;
  conversation_id: string;
}

// 对话列表API
export async function fetchConversations(page = 1, pageSize = 20): Promise<ApiResponse<ConversationsListResponse>> {
  try {
    const response = await fetch(`/api/conversations?page=${page}&pageSize=${pageSize}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API客户端: 获取对话列表失败', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取对话列表失败'
    };
  }
}

// 获取单个对话详情
export async function fetchConversation(id: string): Promise<ApiResponse<Conversation>> {
  try {
    const response = await fetch(`/api/conversations/${id}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API客户端: 获取对话详情失败', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取对话详情失败'
    };
  }
}

// 获取对话消息列表
export async function fetchConversationMessages(id: string): Promise<ApiResponse<MessagesListResponse>> {
  try {
    const response = await fetch(`/api/conversations/${id}/messages`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API客户端: 获取对话消息列表失败', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取对话消息列表失败'
    };
  }
}

// 清空对话
export async function clearConversation(id: string): Promise<ApiResponse<ConversationSession>> {
  try {
    const response = await fetch(`/api/conversations/${id}/clear`, {
      method: 'POST',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API客户端: 清空对话失败', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '清空对话失败'
    };
  }
}

// 创建新对话
export async function createConversation(initialMessage?: string): Promise<ApiResponse<Conversation>> {
  try {
    const response = await fetch('/api/conversations/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initialMessage }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API客户端: 创建新对话失败', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '创建新对话失败'
    };
  }
} 