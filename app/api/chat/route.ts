import { NextRequest, NextResponse } from 'next/server';
import { sendChatMessage, ChatMessage } from '@/lib/chat-service';
import { createConversation } from '@/lib/conversation-service';

export async function POST(request: NextRequest) {
  try {
    console.log("API路由: 收到请求");
    const { message, userId, chatHistory, conversationId } = await request.json();
    console.log("API路由: 请求参数", { 
      message, 
      userId, 
      chatHistoryLength: chatHistory?.length,
      conversationId
    });

    if (!message || !userId) {
      console.log("API路由: 缺少必要参数");
      return NextResponse.json(
        { error: '消息内容和用户ID是必需的' },
        { status: 400 }
      );
    }

    // 检查环境变量配置
    if (!process.env.COZE_API_KEY || !process.env.COZE_BOT_ID) {
      console.log("API路由: 环境变量配置不完整", {
        apiKey: !!process.env.COZE_API_KEY,
        botId: !!process.env.COZE_BOT_ID
      });
      return NextResponse.json(
        { error: 'AI服务配置不完整' },
        { status: 500 }
      );
    }

    let currentConversationId = conversationId;
    if (!currentConversationId) {
      const conversation = await createConversation(message);
      currentConversationId = conversation.id;
    }

    console.log("API路由: 创建流式响应");
    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log("API路由: 调用聊天服务");
          const chatStream = await sendChatMessage(message, {
            userId,
            chatHistory: chatHistory as ChatMessage[] || [],
            conversationId: currentConversationId  
          });

          let fullResponse = '';
          console.log("API路由: 开始处理流式响应");

          try {
            for await (const chunk of chatStream) {
              // 检查是否是JSON格式的特殊消息
              if (chunk.startsWith('{') && chunk.endsWith('}')) {
                try {
                  const jsonData = JSON.parse(chunk);
                  if (jsonData.type === 'conversation_id') {
                    currentConversationId = jsonData.conversation_id;
                    console.log("API路由: 收到会话ID", { conversationId: currentConversationId });
                    
                    // 发送会话ID到客户端
                    const metaData = JSON.stringify({ 
                      type: 'meta', 
                      conversation_id: currentConversationId
                    });
                    controller.enqueue(encoder.encode(`data: ${metaData}\n\n`));
                    continue; // 跳过普通文本处理
                  }
                } catch (e) {
                  // 不是有效的JSON，当作普通文本处理
                }
              }
              
              fullResponse += chunk;
              console.log("API路由: 收到数据块", { chunk });
              
              // 发送流式数据
              const data = JSON.stringify({ 
                type: 'delta', 
                content: chunk,
                fullContent: fullResponse 
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            // 发送完成信号
            console.log("API路由: 发送完成信号");
            const endData = JSON.stringify({ 
              type: 'done', 
              fullContent: fullResponse,
              conversation_id: currentConversationId
            });
            controller.enqueue(encoder.encode(`data: ${endData}\n\n`));
          } catch (streamError) {
            console.error("API路由: 流处理中出错", streamError);
            const errorData = JSON.stringify({ 
              type: 'error', 
              error: streamError instanceof Error ? streamError.message : '聊天处理失败'
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          }
          
        } catch (error) {
          console.error("API路由: 处理流式响应时出错", error);
          const errorData = JSON.stringify({ 
            type: 'error', 
            error: error instanceof Error ? error.message : '未知错误' 
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          console.log("API路由: 关闭流");
          controller.close();
        }
      },
    });

    console.log("API路由: 返回流式响应");
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 