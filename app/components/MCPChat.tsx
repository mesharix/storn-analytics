'use client';

/**
 * MCP-Powered AI Chat Component
 * Uses Elite Agent with MCP tools for real-time data analysis
 * Author: Msh (hi@msh.sa)
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Database } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  usedTools?: string[];
}

export default function MCPChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك الذكي لتحليل البيانات. يمكنني مساعدتك في:\n\n• تحليل بيانات المبيعات\n• تحليل سلوك العملاء\n• ملخص الفواتير المحاسبية\n\nاسألني أي سؤال عن بيانات متجرك!',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat-mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          sessionId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        usedTools: data.usedTools,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `عذراً، حدث خطأ: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto border rounded-lg shadow-lg bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6" />
          <div>
            <h2 className="text-lg font-semibold">محلل البيانات الذكي - Elite Agent</h2>
            <p className="text-sm text-blue-100">مدعوم بـ MCP و z.ai GLM-4.6</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}

            <div
              className={`max-w-[70%] rounded-lg px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {msg.content}
              </div>

              {msg.usedTools && msg.usedTools.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    استخدم الأدوات: {msg.usedTools.join(', ')}
                  </p>
                </div>
              )}

              <div className="mt-1 text-xs opacity-60">
                {msg.timestamp.toLocaleTimeString('ar-SA', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">جاري التحليل...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="اسأل عن المبيعات، العملاء، أو الفواتير..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-right"
            disabled={loading}
            dir="rtl"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>إرسال</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setInput('أعطني ملخص المبيعات للشهر الحالي')}
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            disabled={loading}
          >
            ملخص المبيعات الشهرية
          </button>
          <button
            onClick={() => setInput('حلل سلوك العميل CUST-001')}
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            disabled={loading}
          >
            تحليل عميل
          </button>
          <button
            onClick={() => setInput('أعطني ملخص الفواتير للمحاسبة')}
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            disabled={loading}
          >
            ملخص الفواتير
          </button>
        </div>
      </div>
    </div>
  );
}
