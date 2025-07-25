import { NextRequest, NextResponse } from 'next/server';
import { getConversationMessages } from '@/lib/conversation-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '会话ID不能为空' },
        { status: 400 }
      );
    }
    
    console.log('会话API: 获取对话消息列表', { id });
    
    // 调用服务获取对话消息列表
    const messages = await getConversationMessages(id);
    
    return NextResponse.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('会话API: 获取对话消息列表失败', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '获取对话消息列表失败'
      },
      { status: 500 }
    );
  }
} 