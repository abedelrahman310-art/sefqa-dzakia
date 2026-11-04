import { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  User,
  BookOpen,
} from 'lucide-react';
import { useChat } from '../hooks/useAI';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ChatMessage } from '../types';
import { useI18n } from '@/i18n';

export interface AIChatAssistantProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export function AIChatAssistant({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  showTrigger = true,
}: AIChatAssistantProps = {}) {
  const { t, dir } = useI18n();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOpen !== undefined && setControlledOpen ? setControlledOpen : setInternalOpen;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: t('ai.chat_welcome_msg'),
      is_advisory: true,
      sources: [t('ai.source_deals_db'), t('ai.source_law_23_12'), t('ai.source_decree_15_247')],
    },
  ]);

  const quickSuggestions = [
    t('ai.prompt_late_deals'),
    t('ai.prompt_top_risks'),
    t('ai.prompt_oran_report'),
    t('ai.prompt_collusion_suspicions'),
  ];
  const [inputValue, setInputValue] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);

  const chatMutation = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || chatMutation.isPending) return;

    // Add user message to UI
    const newMsg: ChatMessage = {
      role: 'user',
      content: query,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputValue('');

    chatMutation.mutate(
      { conversationId, message: query },
      {
        onSuccess: (data) => {
          if (data.conversation_id) {
            setConversationId(data.conversation_id);
          }
          const botMsg: ChatMessage = {
            role: 'assistant',
            content: data.answer,
            sources: data.sources,
            is_advisory: data.is_advisory,
          };
          setMessages((prev) => [...prev, botMsg]);
        },
        onError: () => {
          const errMsg: ChatMessage = {
            role: 'assistant',
            content: t('ai.chat_error_response'),
            is_advisory: true,
          };
          setMessages((prev) => [...prev, errMsg]);
        },
      }
    );
  };

  const handleResetConversation = () => {
    setConversationId(null);
    setMessages([
      {
        role: 'assistant',
        content: t('ai.chat_new_conv_msg'),
        is_advisory: true,
      },
    ]);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {/* TopBar Action Button */}
      {showTrigger && (
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-9 px-3 text-sm border-border hover:bg-muted hover:border-primary transition-colors"
          >
            <Bot className="size-4 text-primary" />
            <span className="hidden md:inline">{t('ai.chat_btn')}</span>
            {/* Connection indicator */}
            <span className="size-1.5 rounded-full bg-emerald-500 hidden md:inline-block" />
          </Button>
        </SheetTrigger>
      )}

      {/* Chat Drawer Content */}
      <SheetContent
        side="end"
        className="w-full md:w-[500px] p-0 flex flex-col h-full bg-background border-s shadow-2xl"
        dir={dir}
      >
          {/* Header */}
          <SheetHeader className="p-4 border-b border-border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-navy-900 text-gold-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <SheetTitle className="text-sm font-extrabold text-navy-900">
                    {t('ai.chat_supervisory_title')}
                  </SheetTitle>
                  <span className="text-[11px] text-muted-foreground">
                    {t('ai.chat_supervisory_subtitle')}
                  </span>
                </div>
              </div>

              <Button
                size="icon"
                variant="ghost"
                onClick={handleResetConversation}
                className="h-8 w-8 text-muted-foreground hover:text-navy-900"
                title={t('ai.chat_new_conv')}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Advisory Notice */}
            <div className="mt-2.5 p-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-[10px] flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>
                {t('ai.chat_disclaimer')}
              </span>
            </div>
          </SheetHeader>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${
                  msg.role === 'user' ? 'justify-start flex-row-reverse' : 'justify-start'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.role === 'user'
                      ? 'bg-navy-800 text-white'
                      : 'bg-gold-50 text-navy-900 border border-gold-300'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="w-3.5 h-3.5" />
                  ) : (
                    <Bot className="w-4 h-4 text-navy-900" />
                  )}
                </div>

                <div
                  className={`max-w-[82%] rounded-2xl p-3 space-y-1.5 ${
                    msg.role === 'user'
                      ? 'bg-navy-900 text-white rounded-tr-xs'
                      : 'bg-muted/50 border border-border text-navy-950 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap text-start">
                    {msg.content}
                  </p>

                  {/* Sources tag if any */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2 mt-1 border-t border-border/60 text-[10px] space-y-1 text-muted-foreground">
                      <div className="flex items-center gap-1 font-bold text-navy-800">
                        <BookOpen className="w-3 h-3" />
                        <span>{t('ai.chat_sources_label')}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {msg.sources.map((src, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-background border text-navy-900"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Thinking Skeleton */}
            {chatMutation.isPending && (
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-full bg-gold-50 text-navy-900 border border-gold-300 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 rounded-2xl rounded-tl-xs bg-muted/50 border border-border space-y-1.5 text-xs text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-gold-500 animate-spin" />
                  <span>{t('ai.chat_analyzing')}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="p-2 border-t border-border bg-muted/20">
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {quickSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(sug)}
                  disabled={chatMutation.isPending}
                  className="px-2.5 py-1 rounded-full border border-border bg-background hover:bg-muted text-navy-900 whitespace-nowrap shrink-0 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Input Footer */}
          <div className="p-3 border-t border-border bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('ai.chat_input_placeholder')}
                disabled={chatMutation.isPending}
                className="text-xs h-9"
              />
              <Button
                type="submit"
                size="sm"
                disabled={chatMutation.isPending || !inputValue.trim()}
                className="h-9 px-3 bg-navy-900 text-white hover:bg-navy-800"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
  );
}
