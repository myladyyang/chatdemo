import { ContentType, StreamChatReq } from '@coze/api';
import { createConversation } from './conversation-service';
import { cozeClient, ChatEventType, RoleType, config } from './coze-client';


export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  content_type?: ContentType;
}

export interface ChatOptions {
  userId: string;
  chatHistory?: ChatMessage[];
  conversationId?: string; // 添加会话ID
}

// 发送聊天消息到Coze API
export async function sendChatMessage(
  message: string,
  options: ChatOptions
): Promise<AsyncGenerator<string, void, unknown>> {
  if (!config.apiKey || !config.botId) {
    console.error("聊天服务: Coze API配置不完整");
    throw new Error('Coze API配置不完整，请检查环境变量');
  }

  try {
    console.log("聊天服务: 开始处理消息", { 
      message, 
      userId: options.userId,
      conversationId: options.conversationId
    });
    
    // 如果没有conversationId，先创建一个新的对话
    let conversationId = options.conversationId;
    if (!conversationId) {
      try {
        console.log("聊天服务: 没有会话ID，创建新会话");
        const newConversation = await createConversation();
        conversationId = newConversation.id;
        console.log("聊天服务: 成功创建新会话", { conversationId });
      } catch (createError) {
        console.error("聊天服务: 创建新会话失败", createError);
        // 如果创建失败，继续尝试发送消息，让API自动创建
      }
    }
    
    // 准备请求参数
    const requestParams: StreamChatReq = {
      bot_id: config.botId!,
      auto_save_history: true,
      additional_messages: [
        {
          role: RoleType.User,
          content: message,
          content_type: "text" as ContentType,
        },
      ],
      conversation_id: conversationId
    };



    console.log("聊天服务: 准备调用Coze API", { 
      botId: config.botId, 
      userId: options.userId,
      conversationId: conversationId
    });

    // 创建流式聊天
    const stream = await cozeClient.chat.stream(requestParams);

    console.log("聊天服务: 成功创建流");

    // 返回异步生成器来处理流式响应
    return async function* () {
      console.log("聊天服务: 开始处理流式响应");
      let hasError = false;
      let errorMessage = '';
      let newConversationId = conversationId;
      
      try {
        for await (const part of stream) {
          console.log("聊天服务: 收到事件", { event: part.event });
          
          // 保存新创建的会话ID
          if (part.event === 'conversation.chat.created' && part.data?.conversation_id) {
            newConversationId = part.data.conversation_id;
            console.log("聊天服务: 获取到会话ID", { conversationId: newConversationId });
            // 这里可以将conversationId保存到某个地方，例如返回给客户端
            yield JSON.stringify({ type: 'conversation_id', conversation_id: newConversationId });
          }
          
          if (part.event === ChatEventType.CONVERSATION_MESSAGE_DELTA) {
            if (part.data?.content) {
              console.log("聊天服务: 收到内容块", { content: part.data.content });
              yield part.data.content;
            }
          } else if (part.event === ChatEventType.ERROR) {
            console.error("聊天服务: 流处理错误", part.data);
            hasError = true;
            errorMessage = part.data?.msg || '未知错误';
          } else if (part.event === 'conversation.chat.failed') {
            console.error("聊天服务: 聊天失败", part.data);
            hasError = true;
            errorMessage = '聊天请求失败，请稍后重试';
          }
        }
        
        if (hasError) {
          throw new Error(errorMessage);
        }
        
        console.log("聊天服务: 流处理完成");
      } catch (error) {
        console.error("聊天服务: 流处理异常", error);
        throw error;
      }
    }();
  } catch (error) {
    console.error('Coze API error:', error);
    throw new Error(`聊天服务错误: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 获取聊天历史（如果需要从服务器获取）
export async function getChatHistory(userId: string): Promise<ChatMessage[]> {
  // 这里可以实现从数据库或其他存储获取聊天历史
  // 暂时返回空数组，使用本地存储
  return [];
}

// 保存聊天消息（如果需要持久化存储）
export async function saveChatMessage(message: ChatMessage, userId: string): Promise<void> {
  // 这里可以实现保存到数据库或其他存储
  // 暂时不实现，使用本地状态管理
  console.log('保存消息:', message);
} 
