import { RoleType, Conversation, Messages, ListConversationsData,ConversationSession, ListMessageData } from '@coze/api';
import { cozeClient, config } from './coze-client';



/**
 * 获取对话列表
 */
export async function getConversationsList(pageNum = 1, pageSize = 20): Promise<ListConversationsData> {
  console.log('对话服务: 获取对话列表', { botId: config.botId, pageNum, pageSize });
  if (!config.botId) {
    throw new Error('Bot ID 未配置');
  }

  try {
    console.log('对话服务: 获取对话列表', { botId: config.botId, pageNum, pageSize });
    
    const response = await cozeClient.conversations.list({
      bot_id: config.botId,
      page_num: pageNum,
      page_size: pageSize,
    });
    
    return response;

  } catch (error) {
    console.error('对话服务: 获取对话列表失败', error);
    throw new Error(`获取对话列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 获取单个对话详情
 */
export async function getConversation(conversationId: string): Promise<Conversation> {
  try {
    console.log('对话服务: 获取对话详情', { conversationId });
    
    const conversation = await cozeClient.conversations.retrieve(conversationId);
    
    console.log('对话服务: 成功获取对话详情', { conversation });
    
    // 确保返回类型符合接口定义
    const result: Conversation = {
      id: conversation.id,
      created_at: conversation.created_at,
      meta_data: conversation.meta_data,
      last_section_id: conversation.last_section_id,
    };
    
    return result;
  } catch (error) {
    console.error('对话服务: 获取对话详情失败', error);
    throw new Error(`获取对话详情失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 获取对话的消息列表
 */
export async function getConversationMessages(conversationId: string): Promise<ListMessageData> {
  try {
    console.log('对话服务: 获取对话消息列表', { conversationId });
    
    const response = await cozeClient.conversations.messages.list(conversationId);
    
    console.log('对话服务: 成功获取对话消息列表', { 
      count: response.data?.length || 0 
    });
    
    return response;
  } catch (error) {
    console.error('对话服务: 获取对话消息列表失败', error);
    throw new Error(`获取对话消息列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 清空对话
 */
export async function clearConversation(conversationId: string): Promise<ConversationSession> {
  try {
    console.log('对话服务: 清空对话', { conversationId });
    
    const result = await cozeClient.conversations.clear(conversationId);
    
    console.log('对话服务: 成功清空对话', { result });
    
    // 确保返回类型符合接口定义
    const conversation: ConversationSession = {
      id: result.id,
      conversation_id: result.conversation_id,
    };
    
    return conversation;
  } catch (error) {
    console.error('对话服务: 清空对话失败', error);
    throw new Error(`清空对话失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 创建新对话
 */
export async function createConversation(initialMessage?: string): Promise<Conversation> {
  if (!config.botId) {
    throw new Error('Bot ID 未配置');
  }

  try {
    console.log('对话服务: 创建新对话');
    
    const conversation = await cozeClient.conversations.create({
      bot_id: config.botId,
      // 如果有初始消息，则添加
      ...(initialMessage ? {
        messages: [
          {
            role: RoleType.User,
            content_type: 'text',
            content: initialMessage,
          }
        ]
      } : {})
    });
    
    console.log('对话服务: 成功创建新对话', { conversationId: conversation.id });
    
    // 确保返回类型符合接口定义
    const result: Conversation = {
      id: conversation.id,
      created_at: conversation.created_at,
      meta_data: conversation.meta_data,
      last_section_id: conversation.last_section_id,
    };
    
    return result;
  } catch (error) {
    console.error('对话服务: 创建新对话失败', error);
    throw new Error(`创建新对话失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
} 