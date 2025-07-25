export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export class StorageService {
  private readonly STORAGE_KEY = 'gemini_chat_sessions';
  private readonly MAX_SESSIONS = 50; // 最多保存50个会话

  // 获取所有会话
  getSessions(): ChatSession[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const sessions = JSON.parse(stored);
      return sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  // 保存会话
  saveSession(session: ChatSession): void {
    if (typeof window === 'undefined') return;
    
    try {
      const sessions = this.getSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      if (existingIndex >= 0) {
        // 更新现有会话
        sessions[existingIndex] = { ...session, updatedAt: new Date() };
      } else {
        // 添加新会话
        sessions.unshift({ ...session, updatedAt: new Date() });
        
        // 限制会话数量
        if (sessions.length > this.MAX_SESSIONS) {
          sessions.splice(this.MAX_SESSIONS);
        }
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  // 获取单个会话
  getSession(sessionId: string): ChatSession | null {
    const sessions = this.getSessions();
    return sessions.find(s => s.id === sessionId) || null;
  }

  // 删除会话
  deleteSession(sessionId: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const sessions = this.getSessions();
      const filteredSessions = sessions.filter(s => s.id !== sessionId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredSessions));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  // 创建新会话
  createSession(firstMessage?: ChatMessage): ChatSession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const title = firstMessage 
      ? this.generateTitle(firstMessage.content)
      : '新对话';
    
    const session: ChatSession = {
      id: sessionId,
      title,
      messages: firstMessage ? [firstMessage] : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return session;
  }

  // 生成会话标题
  private generateTitle(firstMessage: string): string {
    // 取前20个字符作为标题
    const title = firstMessage.trim().substring(0, 20);
    return title.length < firstMessage.trim().length ? title + '...' : title;
  }

  // 更新会话消息
  updateSessionMessages(sessionId: string, messages: ChatMessage[]): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.messages = messages;
      session.updatedAt = new Date();
      
      // 如果是第一条消息，更新标题
      if (messages.length === 1 && session.title === '新对话') {
        session.title = this.generateTitle(messages[0].content);
      }
      
      this.saveSession(session);
    }
  }

  // 清空所有会话
  clearAllSessions(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// 创建单例实例
export const storageService = new StorageService(); 