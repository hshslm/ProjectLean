import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import projectLeanLogo from '@/assets/project-lean-logo.png';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface MacroContext {
  remaining_calories: number;
  remaining_protein: number;
  remaining_carbs: number;
  remaining_fats: number;
}

interface LeanBrainChatProps {
  dailyCalorieGoal: number | null;
  dailyProteinGoal: number | null;
  dailyTotals: {
    caloriesLow: number;
    caloriesHigh: number;
    proteinLow: number;
    proteinHigh: number;
    carbsLow: number;
    carbsHigh: number;
    fatLow: number;
    fatHigh: number;
  };
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lean-brain-chat`;
const DAILY_MESSAGE_LIMIT = 50;

export const LeanBrainChat: React.FC<LeanBrainChatProps> = ({
  dailyCalorieGoal,
  dailyProteinGoal,
  dailyTotals,
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [messagesToday, setMessagesToday] = useState(0);
  const [sessionId] = useState(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Count today's messages
  useEffect(() => {
    if (!user) return;
    const countMessages = async () => {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('role', 'user')
        .gte('created_at', startOfDay);
      setMessagesToday(count ?? 0);
    };
    countMessages();
  }, [user, isOpen]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const getMacroContext = useCallback((): MacroContext => {
    const avgCalories = Math.round((dailyTotals.caloriesLow + dailyTotals.caloriesHigh) / 2);
    const avgProtein = Math.round((dailyTotals.proteinLow + dailyTotals.proteinHigh) / 2);
    const avgCarbs = Math.round((dailyTotals.carbsLow + dailyTotals.carbsHigh) / 2);
    const avgFat = Math.round((dailyTotals.fatLow + dailyTotals.fatHigh) / 2);

    return {
      remaining_calories: Math.max(0, (dailyCalorieGoal ?? 2000) - avgCalories),
      remaining_protein: Math.max(0, (dailyProteinGoal ?? 150) - avgProtein),
      remaining_carbs: Math.max(0, Math.round(((dailyCalorieGoal ?? 2000) * 0.4) / 4) - avgCarbs),
      remaining_fats: Math.max(0, Math.round(((dailyCalorieGoal ?? 2000) * 0.3) / 9) - avgFat),
    };
  }, [dailyCalorieGoal, dailyProteinGoal, dailyTotals]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !user) return;

    if (messagesToday >= DAILY_MESSAGE_LIMIT) {
      toast.error(`You've reached your ${DAILY_MESSAGE_LIMIT} message limit for today.`);
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsStreaming(true);
    setMessagesToday(prev => prev + 1);

    // Persist user message
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      role: 'user',
      content: userMsg.content,
      session_id: sessionId,
    });

    let assistantContent = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          macroContext: getMacroContext(),
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        if (resp.status === 429) {
          toast.error('Rate limited. Try again in a moment.');
        } else if (resp.status === 402) {
          toast.error('AI credits exhausted.');
        } else {
          toast.error(errorData.error || 'Something went wrong.');
        }
        setIsStreaming(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No reader');
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Final flush
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch { /* ignore */ }
        }
      }

      // Persist assistant message
      if (assistantContent) {
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          role: 'assistant',
          content: assistantContent,
          session_id: sessionId,
        });
      }
    } catch (e) {
      console.error('Chat error:', e);
      toast.error('Something went wrong. Try again.');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const remainingMessages = Math.max(0, DAILY_MESSAGE_LIMIT - messagesToday);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-foreground text-background shadow-lg flex items-center justify-center hover:opacity-90 transition-all active:scale-95"
        aria-label="Open Lean Brain Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <img src={projectLeanLogo} alt="Lean Brain" className="h-8" />
          <div>
            <p className="font-display font-semibold text-sm text-foreground">Lean Brain</p>
            <p className="text-xs text-muted-foreground">{remainingMessages} message{remainingMessages !== 1 ? 's' : ''} left today</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Ask anything about your patterns, nutrition, or mindset.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <img src={projectLeanLogo} alt="" className="w-6 h-6 mt-1 mr-2 flex-shrink-0" />
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-foreground text-background rounded-br-md'
                  : 'bg-muted text-foreground rounded-bl-md'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card px-4 py-3 safe-area-bottom">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={remainingMessages > 0 ? "Ask Lean Brain..." : "Daily limit reached"}
            disabled={isStreaming || remainingMessages <= 0}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            style={{ maxHeight: '120px', fontSize: '16px' }}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming || remainingMessages <= 0}
            size="icon"
            className="h-11 w-11 rounded-xl bg-foreground text-background hover:bg-foreground/90 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
