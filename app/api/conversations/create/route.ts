import { NextRequest, NextResponse } from 'next/server';
import { createConversation } from '@/lib/conversation-service';

export async function POST(request: NextRequest) {
  try {
    // 获取请求体
    const body = await request.json();
    const { initialMessage } = body;
    
    console.log('会话API: 创建新对话', { initialMessage });
    
    // 调用服务创建新对话
    const conversation = await createConversation(initialMessage);
    
    return NextResponse.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('会话API: 创建新对话失败', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '创建新对话失败'
      },
      { status: 500 }
    );
  }
} 