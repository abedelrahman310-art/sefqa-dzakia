import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  AlertCircle,
  BookOpen,
  Bot,
  Loader2,
  RotateCcw,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  Gavel,
} from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';
import { operatorLegalChat } from '@/features/ai/api/ai';
import { AIChatAssistant } from '@/features/ai/components/AIChatAssistant';
import type { ChatMessage, LegalArticle, LegalArticleSource } from '@/features/ai/types';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Sentinel strings from backend RAG engine when no explicit answer is found
const NO_LEGAL_ANSWER_MARKERS = [
  '\u0644\u0627 \u062a\u0648\u062c\u062f \u0625\u062c\u0627\u0628\u0629 \u0635\u0631\u064a\u062d\u0629 \u0641\u064a \u0627\u0644\u0646\u0635\u0648\u0635 \u0627\u0644\u0645\u062a\u0627\u062d\u0629',
  'Aucune réponse explicite',
];

const containsNoLegalAnswer = (content: string): boolean =>
  NO_LEGAL_ANSWER_MARKERS.some((marker) => content.includes(marker));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const firstNonEmptyString = (
  record: Record<string, unknown>,
  keys: string[],
): string | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
};

const normalizeLegalArticle = (
  raw: LegalArticleSource,
  index: number,
  fallbackText: string,
): LegalArticle | null => {
  if (typeof raw === 'string') {
    const label = raw.trim();
    if (!label) return null;
    return {
      id: `legal-article-${index}`,
      label,
      content: fallbackText,
      text: fallbackText,
      legal_text: fallbackText,
    };
  }

  if (!isRecord(raw)) return null;

  const nestedArticle = isRecord(raw.article) ? raw.article : undefined;
  const source = nestedArticle ? { ...nestedArticle, ...raw } : raw;

  const articleNumber = firstNonEmptyString(source, [
    'article_number',
    'articleNumber',
    'article_no',
    'number',
  ]);
  const law = firstNonEmptyString(source, [
    'law_source',
    'lawSource',
    'law',
    'law_name',
    'statute',
  ]);
  const title = firstNonEmptyString(source, ['title', 'chapter', 'topic']);
  const content = firstNonEmptyString(source, [
    'content',
    'text',
    'legal_text',
    'legalText',
    'body',
  ]);

  let label = firstNonEmptyString(source, ['label', 'display', 'name']);
  if (!label) {
    if (articleNumber && law) {
      label = `${articleNumber} - ${law}`;
    } else if (articleNumber) {
      label = `Art. ${articleNumber}`;
    } else {
      label = title || `Ref (${index + 1})`;
    }
  }

  const textBody = content || title || fallbackText;

  return {
    id: firstNonEmptyString(source, ['id']) || `legal-article-${index}`,
    label,
    article_number: articleNumber,
    law_source: law,
    title,
    content: textBody,
    text: textBody,
    legal_text: textBody,
  };
};

const normalizeLegalArticles = (rawList: unknown, fallbackText: string): LegalArticle[] => {
  if (!Array.isArray(rawList)) return [];
  const normalized: LegalArticle[] = [];
  rawList.forEach((item, index) => {
    const parsed = normalizeLegalArticle(item as LegalArticleSource, index, fallbackText);
    if (parsed) normalized.push(parsed);
  });
  return normalized;
};

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (typeof err === 'object' && err !== null) {
    const response = (err as { response?: { data?: Record<string, unknown> } }).response;
    const data = response?.data;
    const detail = data?.detail || data?.error;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (Array.isArray(detail) && detail.length > 0) return String(detail[0]);
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

export function AuthorityAssistantView() {
  const { t, dir, lang } = useI18n();

  const welcomeMessage: ChatMessage = useMemo(
    () => ({
      role: 'assistant',
      content: t('authority.assistant.welcome_msg'),
      sources: [
        t('authority.assistant.source_law_23_12'),
        t('authority.assistant.source_decree_15_247'),
      ],
      is_advisory: true,
    }),
    [t]
  );

  const quickPrompts = useMemo(
    () => [
      t('authority.assistant.prompt_1'),
      t('authority.assistant.prompt_2'),
      t('authority.assistant.prompt_3'),
      t('authority.assistant.prompt_4'),
    ],
    [t]
  );

  const topics = useMemo(
    () => [
      {
        icon: Gavel,
        title: t('authority.assistant.topic_committees_title'),
        text: t('authority.assistant.topic_committees_desc'),
      },
      {
        icon: Scale,
        title: t('authority.assistant.topic_awards_title'),
        text: t('authority.assistant.topic_awards_desc'),
      },
      {
        icon: BookOpen,
        title: t('authority.assistant.topic_contracts_title'),
        text: t('authority.assistant.topic_contracts_desc'),
      },
    ],
    [t]
  );

  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [inputValue, setInputValue] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<LegalArticle | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend ?? inputValue).trim();
    if (!query || sending) return;

    setMessages((previous) => [...previous, { role: 'user', content: query }]);
    setInputValue('');
    setSending(true);

    try {
      const data = await operatorLegalChat(conversationId, query, lang);
      if (data.conversation_id) setConversationId(data.conversation_id);

      const rawArticles = data.legal_articles ?? data.retrieved_articles ?? [];
      const normalizedLegalArticles = normalizeLegalArticles(
        rawArticles,
        t('authority.assistant.article_full_text')
      );

      const contentText = data.reply || data.answer || '';
      const noLegalAnswer =
        containsNoLegalAnswer(contentText) ||
        data.found_in_law === false ||
        data.no_answer === true;

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: contentText,
          sources: data.sources ?? [],
          legal_articles: normalizedLegalArticles,
          no_legal_answer: noLegalAnswer,
          is_advisory: data.is_advisory ?? true,
        },
      ]);
    } catch (err) {
      const message = getErrorMessage(err, t('authority.assistant.error'));
      toast.error(message);
      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: message,
          is_advisory: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSend();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleReset = () => {
    setConversationId(null);
    setMessages([welcomeMessage]);
    toast.info(t('authority.assistant.new_session_toast'));
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-emerald-900/10 via-teal-900/5 to-slate-900/5 rounded-2xl border border-emerald-700/20 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/10 text-emerald-800 text-xs font-semibold">
            <Sparkles className="size-3.5" />
            <span>{t('authority.assistant.tagline')}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {t('authority.assistant.title')}
          </h1>
          <p className="text-sm text-gray-600 max-w-2xl">
            {t('authority.assistant.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <AIChatAssistant />
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-xs"
            title={t('authority.assistant.new_session_title')}
          >
            <RotateCcw className="size-3.5" />
            <span>{t('authority.assistant.new_session')}</span>
          </button>
        </div>
      </div>

      {/* Topics Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topics.map((topic, i) => {
          const Icon = topic.icon;
          return (
            <div
              key={i}
              className="p-4 bg-white rounded-xl border border-gray-200/80 shadow-xs space-y-1.5"
            >
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                <Icon className="size-4 shrink-0" />
                <span>{topic.title}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{topic.text}</p>
            </div>
          );
        })}
      </div>

      {/* Chat Area */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs flex flex-col h-[600px] overflow-hidden">
        {/* Chat Toolbar Header */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>{t('authority.assistant.chat_header')}</span>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
            {t('authority.assistant.law_decree_badge')}
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-slate-50/30 to-white">
          {messages.map((message, index) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={`${message.role}-${index}`}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-navy-900 text-white'
                      : 'bg-emerald-600 text-white shadow-xs'
                  }`}
                >
                  {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed space-y-2.5 ${
                    isUser
                      ? 'bg-navy-900 text-white rounded-tr-none'
                      : 'bg-white border border-gray-200 text-gray-800 shadow-xs rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {/* Cited Articles */}
                  {!isUser && message.legal_articles && message.legal_articles.length > 0 && (
                    <div className="pt-2 border-t border-gray-100 space-y-1.5">
                      <div className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                        <BookOpen className="size-3 text-emerald-600" />
                        <span>{t('authority.assistant.articles_adopted')}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {message.legal_articles.map((art) => (
                          <button
                            key={art.id}
                            type="button"
                            onClick={() => setSelectedArticle(art)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60 text-xs transition-colors"
                          >
                            <Scale className="size-3" />
                            <span>{art.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Advisory Notice */}
                  {!isUser && (
                    <div className="text-xs text-gray-600 pt-1 flex items-center gap-1">
                      <AlertCircle className="size-3 shrink-0 text-amber-500" />
                      <span>{t('authority.assistant.disclaimer')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Bot className="size-4" />
              </div>
              <div className="p-3 rounded-2xl bg-white border border-gray-200 text-xs text-gray-500 flex items-center gap-2 shadow-xs">
                <Loader2 className="size-4 animate-spin text-emerald-600" />
                <span>{t('authority.assistant.retrieving')}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Carousel */}
        <div className="px-5 py-2.5 bg-slate-50/80 border-t border-gray-100 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-gray-600 font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="size-3 text-emerald-600" />
            <span>{t('authority.assistant.suggestions_label')}</span>
          </span>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              type="button"
              disabled={sending}
              onClick={() => void handleSend(prompt)}
              className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-emerald-600 hover:text-emerald-800 whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200 flex items-end gap-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            placeholder={t('authority.assistant.input_placeholder')}
            rows={2}
            className="flex-1 p-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 resize-none bg-slate-50/30"
          />
          <button
            type="submit"
            disabled={sending || !inputValue.trim()}
            className="px-4 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs shrink-0"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 rtl:rotate-180" />}
            <span>{t('authority.assistant.send')}</span>
          </button>
        </form>
      </div>

      {/* Article Detail Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="max-w-xl text-start" dir={dir}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-800 text-lg">
              <Scale className="size-5" />
              <span>{selectedArticle?.label}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {selectedArticle?.law_source || t('authority.assistant.dialog_default_source')}
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-slate-50 rounded-xl border border-gray-200 text-sm leading-relaxed whitespace-pre-wrap text-gray-800 max-h-[350px] overflow-y-auto">
            {selectedArticle?.content || selectedArticle?.text}
          </div>

          <DialogFooter className="flex justify-start">
            <DialogClose asChild>
              <button
                type="button"
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('authority.assistant.dialog_close')}
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
