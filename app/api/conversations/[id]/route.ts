import { NextRequest, NextResponse } from 'next/server';
import { getConversation } from '@/lib/conversation-service';

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
    
    console.log('会话API: 获取对话详情', { id });
    
    // 调用服务获取对话详情
    const conversation = await getConversation(id);
    
    return NextResponse.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('会话API: 获取对话详情失败', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '获取对话详情失败'
      },
      { status: 500 }
    );
  }
} 