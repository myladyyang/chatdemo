import { NextRequest, NextResponse } from 'next/server';
import { getConversationsList } from '@/lib/conversation-service';

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const pageNum = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    console.log('会话API: 获取对话列表', { pageNum, pageSize });
    
    // 调用服务获取对话列表
    const conversationsData = await getConversationsList(pageNum, pageSize);
    
    return NextResponse.json({
      success: true,
      data: conversationsData
    });
  } catch (error) {
    console.error('会话API: 获取对话列表失败', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '获取对话列表失败'
      },
      { status: 500 }
    );
  }
} 