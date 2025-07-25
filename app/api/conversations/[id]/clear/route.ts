import { NextRequest, NextResponse } from 'next/server';
import { clearConversation } from '@/lib/conversation-service';

export async function POST(
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
    
    console.log('会话API: 清空对话', { id });
    
    // 调用服务清空对话
    const result = await clearConversation(id);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('会话API: 清空对话失败', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '清空对话失败'
      },
      { status: 500 }
    );
  }
} 