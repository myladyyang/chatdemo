下面是我推荐的UI的参考，请根据这个参考来设计UI，并实现出来。

``` 主页
    // 主内容区域
    <div className="flex-1 flex flex-col h-full">
      {/* 对话区域 */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: isRedirecting ? 0.5 : 1,
            y: isRedirecting ? -20 : 0,
          }}
          className="text-center max-w-3xl mx-auto w-full"
        >
          {/* 主标题 */}
          <div className="mb-16">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-light text-foreground mb-6">
              您好，我是 ClimateAI
            </h1>
            <p className="text-xl text-muted-foreground">
              您的气候风险分析和报告助手
            </p>
          </div>
        </motion.div>
      </div>
      {/* 输入框 */}
      <div className="shrink-0">
        <ChatInput
          input={input}
          onChange={(e) => setInput(e.target.value)}
          handleSubmit={handleSendMessage}
          isLoading={isCreating || isRedirecting}
          disabled={isRedirecting}
          onReportMode={handleReportMode}
          reportMode={reportMode}
        />
      </div>
    </div>
```


```聊天
 // 普通聊天模式：传统的消息列表 + 输入框
      return (
        <div className="flex flex-col flex-1 h-full bg-white">
          {/* 聊天消息区域 */}
          <div className="flex-1 overflow-auto p-6 custom-scrollbar">
            <div className="max-w-3xl mx-auto">
              {showInitialLoading ? (
                /* 加载状态 */
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent mb-4"></div>
                  <p className="text-gray-500">加载对话中...</p>
                </div>
              ) : (
                /* 消息列表 */
                renderedMessages
              )}

              {chatError && (
                <div className="text-center py-4">
                  <p className="text-red-500 text-sm">
                      {typeof chatError === 'string' ? chatError : chatError.message}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 输入框 */}
          <div className="shrink-0 border-t border-gray-100">
            <ChatInput
              input={input}
              onChange={handleInputChange}
              handleSubmit={handleSubmit}
              isLoading={status === 'streaming'}
              disabled={status === 'streaming'}
            />
          </div>
        </div>
      );
```



```chatInput
    <div className={`bg-white ${compact ? 'p-2' : 'p-4'}`}>
      <div className={`${compact ? 'max-w-full' : 'max-w-3xl'} mx-auto`}>
        {/* 输入框 */}
        <form onSubmit={handleSubmit} className={`border border-gray-200 rounded-lg ${compact ? 'p-2' : 'p-3'} bg-white`}>
          <Textarea
            ref={textareaRef}
            value={input || ''}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`min-h-[28px] max-h-[${compact ? '100' : '200'}px] resize-none border-0 bg-transparent p-0 ${compact ? 'text-sm' : 'text-base'} leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400`}
            disabled={disabled || isLoading}
          />
          
          {/* 内部按钮区域 */}
          <div className={`flex items-center justify-between ${compact ? 'mt-1' : 'mt-2'}`}>
            <div className="flex items-center gap-2">
              <Button 
                type="button"
                variant="ghost"
                size="sm"
                className={`${compact ? 'h-6 w-6' : 'h-8 w-8'} p-0 rounded-full hover:bg-gray-50`}
              >
                <Plus className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-gray-500`} />
              </Button>
              
              {/* 报告按钮 - 可切换状态 */}
              {onReportMode && (
                <Button 
                  type="button"
                  onClick={onReportMode}
                  variant="ghost"
                  size="sm"
                  className={`${compact ? 'h-6 px-2 text-xs' : 'h-8 px-3 text-sm'} rounded-full transition-colors ${
                    reportMode 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  报告
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                type="button"
                variant="ghost"
                size="sm"
                className={`${compact ? 'h-6 w-6' : 'h-8 w-8'} p-0 rounded-full hover:bg-gray-50`}
              >
                <Mic className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-gray-500`} />
              </Button>
              
              {input?.trim() && (
                <Button 
                  type="submit"
                  size="sm"
                  className={`${compact ? 'h-6 px-3 text-xs' : 'h-8 px-4'} bg-blue-500 hover:bg-blue-600 text-white rounded-full`}
                  disabled={disabled || isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span>发送</span>
                      <Send className="h-3 w-3" />
                    </div>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
        
        {/* 底部提示文字 */}
        {!compact && (
          <div className="text-center mt-3">
            <p className="text-xs text-gray-400">
              ClimateAI 可能会犯错，因此请仔细检查
            </p>
          </div>
        )}
      </div>
    </div>
    ```


```
  const renderedMessages = useMemo(() => {
    let displayMessages = messages;
    // 对于新聊天，立即显示初始消息以避免界面闪烁
    if (isNewChat && messages.length === 0 && initialMessage) {
      displayMessages = [{
        id: 'temp-initial-msg',
        role: 'user',
        content: initialMessage,
      }];
    }

    // 根据用户要求，移除空状态。如果没有任何消息，则不渲染任何内容。
    if (displayMessages.length === 0) {
      return null;
    }
    

    
    // 处理消息显示逻辑
    const messageElements = displayMessages.map((msg, index) => {
      if (msg.role === 'system') return null;
      
      return (
        <MessageBubble
          key={msg.id || index}
          message={msg}
          status={status}           
        />
      );
    });

```




```Bubble
'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer';
import { Message } from 'ai';
import { Loader2, Brain, Check, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  status: string;
}

export function MessageBubble({ message, status }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [expandedParts, setExpandedParts] = useState<Record<number, boolean>>({});

  // 如果没有 parts 或者是用户消息，则按原来的方式处理
  if (!message.parts || message.parts.length === 0 || isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2 px-0 py-0`}
      >
        <div className={`
          max-w-[85%] px-4 py-2 rounded-2xl text-sm shadow-sm
          ${isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-50 text-gray-800 border border-gray-100'
          }
        `}>
          {message.content}
          
          {/* 显示annotations */}
          {message.annotations && message.annotations.length > 0 && (
            <div className="mt-2 pl-2 flex flex-col items-start gap-2 w-full">
              {message.annotations.map((annotation, index) => {
                const annotationInfo = annotation && typeof annotation === 'object' && 'info' in annotation ? annotation.info : null;
                const annotationToolCall = annotation && typeof annotation === 'object' && 'tool_call' in annotation ? annotation.tool_call : null;
                const annotationToolResult = annotation && typeof annotation === 'object' && 'tool_result' in annotation ? annotation.tool_result : null;
                
                if (annotationToolCall) {
                  const toolName = typeof annotationToolCall === 'object' ? (annotationToolCall as any).toolName : annotationToolCall;
                  const args = typeof annotationToolCall === 'object' ? (annotationToolCall as any).args : {};

                  return (
                    <details key={`annotation-call-${index}`} className={`text-xs ${isUser ? 'text-white bg-blue-600/50' : 'text-gray-800 bg-gray-100/80'} border border-gray-200/30 rounded-lg px-3 py-1.5 w-auto max-w-md shadow-sm`}>
                      <summary className="font-semibold cursor-pointer list-outside">
                        调用: {toolName}
                      </summary>
                      <pre className={`mt-2 p-2 ${isUser ? 'bg-blue-700/50' : 'bg-gray-200/50'} rounded text-xs whitespace-pre-wrap break-all`}>
                        {JSON.stringify(args, null, 2)}
                      </pre>
                    </details>
                  );
                }
                if (annotationToolResult && typeof annotationToolResult === 'object') {
                  return (
                    <details key={`annotation-result-${index}`} className={`text-xs ${isUser ? 'text-white bg-blue-600/50' : 'text-gray-800 bg-gray-100/80'} border border-gray-200/30 rounded-lg px-3 py-1.5 w-auto max-w-md shadow-sm`}>
                      <summary className="font-semibold cursor-pointer list-outside">
                        结果: {(annotationToolResult as any).toolName}
                      </summary>
                      <pre className={`mt-2 p-2 ${isUser ? 'bg-blue-700/50' : 'bg-gray-200/50'} rounded text-xs whitespace-pre-wrap break-all`}>
                        {JSON.stringify((annotationToolResult as any).result || {}, null, 2)}
                      </pre>
                    </details>  
                  );
                }
                if (!annotationInfo) return null;

                return (
               
                 <>{annotationInfo as string}</>
                    
             

                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // 如果是助手消息且有多个部分，则渲染所有部分
  return (
    <div className="space-y-2">
      {message.parts.map((part, index) => {
        if (part.type === 'reasoning') {
          const isExpanded = expandedParts[index] ?? false;
          return (
            <div key={`reasoning-${index}`} className="my-2">
              <button 
                onClick={() => setExpandedParts(prev => ({ ...prev, [index]: !isExpanded }))}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Sparkles className="h-3 w-3 text-blue-500" />
                <span className="text-xs">{isExpanded ? "Hide thinking" : "Show thinking"}</span>
                {isExpanded ? <ChevronUp className="h-3 w-3 text-gray-500" /> : <ChevronDown className="h-3 w-3 text-gray-500" />}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: '0.75rem' }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-4 border-l-2 border-gray-200 ml-3">
                      <div className="prose prose-sm max-w-none text-gray-600 text-xs font-sans">
                        {part.reasoning}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>    
          );
        } 
        if (part.type === 'tool-invocation') {
          const toolState = part.toolInvocation.state;
          const isToolRunning = toolState === 'call';
          const toolName = part.toolInvocation.toolName;
          
          if (isToolRunning) {
            return (
              <motion.div
                key={`tool-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start mb-2 px-0 py-0"
              >
                <div className="max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm bg-gray-50 text-gray-800 mr-12 border border-gray-100">
                  <div className="flex flex-col items-start gap-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                      <span>正在使用 <strong>{toolName}</strong> 工具...</span>
                    </div>
                    
                  </div>
                </div>
              </motion.div>
            );
          } else if (toolState === 'result') {
            return (
              <motion.div
                key={`tool-result-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start mb-2 px-0 py-0"
              >
                <div className="max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm bg-gray-100 text-gray-600 mr-12 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>工具 <strong>{toolName}</strong> 调用完成。</span>
                  </div>
                </div>
              </motion.div>
            );
          }
        } 
        if (part.type === 'text') {
          return (
            <motion.div
              key={`text-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start mb-2 px-0 py-0"
            >
              <div className="max-w-[85%] px-4 py-2 rounded-2xl text-sm shadow-sm bg-gray-50 text-gray-800 mr-12 border border-gray-100">
                <div className="prose-sm prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5">
                  <MarkdownRenderer markdownContent={part.text} />
                </div>
                
                {/* 显示annotations */}
                {message.annotations && message.annotations.length > 0 && (
                  <div className="mt-2 pl-2 flex flex-col items-start gap-2 w-full">
                    {message.annotations.map((annotation, index) => {
                      const annotationInfo = annotation && typeof annotation === 'object' && 'info' in annotation ? annotation.info : null;
                      const annotationToolCall = annotation && typeof annotation === 'object' && 'tool_call' in annotation ? annotation.tool_call : null;
                      const annotationToolResult = annotation && typeof annotation === 'object' && 'tool_result' in annotation ? annotation.tool_result : null;
                      
                      if (annotationToolCall) {
                        const toolName = typeof annotationToolCall === 'object' ? (annotationToolCall as any).toolName : annotationToolCall;
                        const args = typeof annotationToolCall === 'object' ? (annotationToolCall as any).args : {};

                        return (
                          <details key={`annotation-call-${index}`} className="text-xs text-gray-800 bg-gray-100/80 border border-gray-200/80 rounded-lg px-3 py-1.5 w-auto max-w-md shadow-sm">
                            <summary className="font-semibold cursor-pointer list-outside">
                              调用: {toolName}
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-200/50 rounded text-xs whitespace-pre-wrap break-all">
                              {JSON.stringify(args, null, 2)}
                            </pre>
                          </details>
                        );
                      }
                      if (annotationToolResult && typeof annotationToolResult === 'object') {
                        return (
                          <details key={`annotation-result-${index}`} className="text-xs text-gray-800 bg-gray-100/80 border border-gray-200/80 rounded-lg px-3 py-1.5 w-auto max-w-md shadow-sm">
                            <summary className="font-semibold cursor-pointer list-outside">
                              结果: {(annotationToolResult as any).toolName}
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-200/50 rounded text-xs whitespace-pre-wrap break-all">
                              {JSON.stringify((annotationToolResult as any).result || {}, null, 2)}
                            </pre>
                          </details>  
                        );
                      }
                      if (!annotationInfo) return null;

                      return (
                        <div key={`annotation-${index}`} className="text-xs text-gray-800 bg-gray-100/80 border border-gray-200/80 rounded-lg px-3 py-1.5 w-auto max-w-md shadow-sm">
                          {annotationInfo as string}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          );
        }
        return null;
      })}
      {status === 'streaming' && (
        <div className="flex items-center gap-2 py-1">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs">正在思考...</span>
        </div>
      )}
    </div>
  );
} 
```