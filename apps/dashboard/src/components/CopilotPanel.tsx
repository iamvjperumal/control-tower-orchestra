import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../api/client';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  signals?: any[];
  confidence?: number;
  timestamp: Date;
  isStreaming?: boolean;
}

export function CopilotPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      api.fetchCopilotSuggestions().then(data => setSuggestions(data.suggestions || [])).catch(() => {});
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const assistantId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }]);

    try {
      const response = await api.sendCopilotMessage(text.trim());

      // Simulate streaming by revealing characters
      const fullText = response.answer;
      let charIndex = 0;
      const interval = setInterval(() => {
        charIndex += 3;
        if (charIndex >= fullText.length) {
          charIndex = fullText.length;
          clearInterval(interval);
          setMessages(prev => prev.map(m =>
            m.id === assistantId
              ? { ...m, content: fullText, sources: response.sources, signals: response.signals, confidence: response.confidence, isStreaming: false }
              : m
          ));
          setIsLoading(false);
        } else {
          setMessages(prev => prev.map(m =>
            m.id === assistantId ? { ...m, content: fullText.slice(0, charIndex) } : m
          ));
        }
      }, 12);
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: 'Sorry, I encountered an error. Please try again.', isStreaming: false }
          : m
      ));
      setIsLoading(false);
    }
  }, [isLoading]);

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
          boxShadow: '0 4px 24px rgba(124, 58, 237, 0.4)',
        }}
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        )}
      </button>

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full z-40 transition-transform duration-300 ease-out flex flex-col"
        style={{
          width: '420px',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          background: 'var(--bg-sidebar)',
          borderLeft: '1px solid var(--border-card)',
        }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-card)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white">CTO Copilot</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>AI-powered platform intelligence</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Live</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-white mb-1">Ask me anything</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>about customers, risk signals, and AI decisions</p>

              {suggestions.length > 0 && (
                <div className="mt-6 space-y-2">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s)}
                      className="w-full text-left text-xs px-3 py-2.5 rounded-xl transition-colors"
                      style={{ background: 'rgba(139, 92, 246, 0.08)', color: 'var(--text-secondary)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%]">
                <div
                  className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                  style={msg.role === 'user' ? {
                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    color: 'white',
                  } : {
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                  {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-0.5 animate-pulse" style={{ background: 'var(--purple-light)' }} />}
                </div>
                {msg.role === 'assistant' && !msg.isStreaming && msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 px-1">
                    {msg.sources.map((s, i) => (
                      <span key={i} className="text-[9px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--purple-light)' }}>
                        {s}
                      </span>
                    ))}
                    {msg.confidence && (
                      <span className="text-[9px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }}>
                        {Math.round(msg.confidence * 100)}% confidence
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-card)' }}>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask about customers, risks, decisions..."
              className="flex-1 text-sm px-4 py-2.5 rounded-xl outline-none"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-primary)',
              }}
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2.5 rounded-xl transition-all disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-30" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}
