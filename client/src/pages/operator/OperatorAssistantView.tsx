import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Bot,
  FileCheck2,
  Loader2,
  RotateCcw,
  Scale,
  Send,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { operatorLegalChat } from '@/features/ai/api/ai';
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

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    'مرحباً بك في المساعد القانوني للمتعامل الاقتصادي. يمكنك سؤالي عن آجال إيداع العروض، وثائق ملف الترشح، الضمانات، معايير التقييم، العقود، أو الطعون. إجاباتي استشارية، والقرار النهائي يبقى للجهة المختصة.',
  sources: ['القانون 23-12', 'المرسوم 15-247', 'القانون 18-07'],
  is_advisory: true,
};

const NO_LEGAL_ANSWER_MESSAGE =
  'عذراً، لا توجد مادة صريحة في القانون 23-12 تجيب على هذا التساؤل. يرجى استشارة المصلحة المتعاقدة';

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

const buildLegalArticleLabel = (
  label: string | undefined,
  articleNumber: string | undefined,
  law: string | undefined,
): string => {
  if (label) {
    if (/^\d+$/.test(label) && !articleNumber) {
      return law ? `المادة ${label} من ${law}` : `المادة ${label}`;
    }
    if (law && !label.includes(law) && !/من\s+(?:القانون|المرسوم|الأمر|القرار)/.test(label)) {
      return `${label} من ${law}`;
    }
    return label;
  }
  if (articleNumber && law) return `المادة ${articleNumber} من ${law}`;
  if (articleNumber) return `المادة ${articleNumber}`;
  return law ? `مادة من ${law}` : '';
};

const normalizeLegalArticle = (
  raw: LegalArticleSource,
  index: number,
): LegalArticle | null => {
  if (typeof raw === 'string') {
    const label = raw.trim();
    if (!label) return null;
    return { id: `legal-article-${index}`, label: buildLegalArticleLabel(label, undefined, undefined) };
  }

  if (!isRecord(raw)) return null;

  // Some RAG implementations nest the article fields under an `article` key.
  const nestedArticle = isRecord(raw.article) ? raw.article : undefined;
  const source = nestedArticle ? { ...nestedArticle, ...raw } : raw;

  const label = firstNonEmptyString(source, [
    'label',
    'title',
    'reference',
    'citation',
    'display',
    'article_label',
    'articleLabel',
    'legal_article',
    'legalArticle',
    'name',
    'article',
  ]);
  const articleNumber = firstNonEmptyString(source, [
    'article_number',
    'articleNumber',
    'article_no',
    'articleNo',
    'number',
    'num',
    'article_id',
  ]);
  const law = firstNonEmptyString(source, [
    'law',
    'law_name',
    'lawName',
    'statute',
    'legal_instrument',
    'legalInstrument',
    'code',
    'decree',
    'source_law',
    'sourceLaw',
  ]);
  const legalText = firstNonEmptyString(source, [
    'legal_text',
    'legalText',
    'text',
    'content',
    'article_text',
    'articleText',
    'legal_article_text',
    'body',
    'full_text',
    'fullText',
  ]);

  const computedLabel = buildLegalArticleLabel(label, articleNumber, law);
  if (!computedLabel && !legalText) return null;

  return {
    id: firstNonEmptyString(source, ['id', 'slug', 'key']) ?? `legal-article-${index}`,
    label: computedLabel || 'مادة قانونية',
    article_number: articleNumber,
    law,
    legal_text: legalText,
  };
};

const normalizeLegalArticles = (raw: unknown): LegalArticle[] => {
  const entries = Array.isArray(raw) ? raw : raw === undefined || raw === null ? [] : [raw];
  return entries
    .map((entry, index) => normalizeLegalArticle(entry as LegalArticleSource, index))
    .filter((article): article is LegalArticle => article !== null);
};

const QUICK_PROMPTS = [
  'ما هي آجال الطعن على قرار الإسناد؟',
  'ما الوثائق المطلوبة في ملف الترشح؟',
  'كيف تُقيّم العروض التقنية والمالية؟',
  'ما هي ضمانات حسن التنفيذ؟',
];

const TOPICS = [
  {
    icon: Scale,
    title: 'الآجال والطعون',
    text: 'افهم مهلة الطعن، الجهة المختصة، والفرق بين الطعن الإداري والقضائي.',
  },
  {
    icon: FileCheck2,
    title: 'ملف الترشح',
    text: 'راجع الوثائق الإدارية والتقنية والمالية والضمانات المطلوبة.',
  },
  {
    icon: BookOpen,
    title: 'دفتر الشروط',
    text: 'حلّل المواصفات ومعايير التقييم ونقاط الغموض قبل الإيداع.',
  },
];

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (typeof err === 'object' && err !== null) {
    const response = (err as { response?: { data?: Record<string, unknown> } }).response;
    const data = response?.data;
    const detail = data?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (Array.isArray(detail) && detail.length > 0) return String(detail[0]);
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

export function OperatorAssistantView() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
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
      const data = await operatorLegalChat(conversationId, query);
      if (data.conversation_id) setConversationId(data.conversation_id);

      const hasLegalArticlesField =
        data.legal_articles !== undefined && data.legal_articles !== null;
      const normalizedLegalArticles = hasLegalArticlesField
        ? normalizeLegalArticles(data.legal_articles)
        : [];
      const topLevelLegalText =
        typeof data.legal_text === 'string' ? data.legal_text.trim() : '';
      const legalArticles =
        topLevelLegalText &&
        normalizedLegalArticles.length === 1 &&
        !normalizedLegalArticles[0].legal_text
          ? [{ ...normalizedLegalArticles[0], legal_text: topLevelLegalText }]
          : normalizedLegalArticles;
      const noLegalAnswer =
        data.found_in_law === false ||
        data.no_answer === true ||
        (hasLegalArticlesField && legalArticles.length === 0);

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources ?? [],
          legal_articles: legalArticles,
          no_legal_answer: noLegalAnswer,
          is_advisory: data.is_advisory,
        },
      ]);
    } catch (err) {
      const message = getErrorMessage(
        err,
        'تعذر إتمام المحادثة في الوقت الحالي. يرجى إعادة المحاولة.',
      );
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
    setSelectedArticle(null);
    setMessages([WELCOME_MESSAGE]);
    setInputValue('');
  };

  return (
    <div className="op-page">
      <div className="op-page-head">
        <div>
          <span className="op-chip gold mb-2">
            <Sparkles aria-hidden="true" />
            <span>مساعد قانوني استشاري</span>
          </span>
          <h1>المساعد القانوني الذكي</h1>
          <p>
            اسأل عن قواعد الصفقات العمومية، دفتر الشروط، الآجال، الضمانات، التقييم، العقود
            والطعون. الإجابات استشارية وليست قراراً إدارياً.
          </p>
        </div>
        <div className="op-page-actions">
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={handleReset}
            disabled={sending}
          >
            <RotateCcw aria-hidden="true" />
            <span>محادثة جديدة</span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="op-card flex min-h-[620px] flex-col overflow-hidden" aria-label="محادثة المساعد القانوني">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--op-line-2)] px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#1B4332] text-[#F6E7B4]">
                <Bot className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-[var(--op-ink)]">مساعد صفقات ذكية</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--op-muted)]">
                  <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  متصل — إرشاد قانوني مؤتمت
                </p>
              </div>
            </div>
            <span className="op-chip green">
              <ShieldCheck aria-hidden="true" />
              <span>استشاري فقط</span>
            </span>
          </div>

          <div
            className="flex-1 space-y-4 overflow-y-auto bg-[var(--op-surface-2)] p-4 sm:p-5"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full border ${
                      isUser
                        ? 'border-[#1B4332] bg-[#1B4332] text-white'
                        : 'border-[var(--op-line)] bg-white text-[#1B4332]'
                    }`}
                    aria-hidden="true"
                  >
                    {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
                  </span>

                  <div
                    className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'rounded-tl-sm bg-[#1B4332] text-white'
                        : 'rounded-tr-sm border border-[var(--op-line)] bg-white text-[var(--op-text)]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>

                    {!isUser && message.no_legal_answer ? (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900">
                        <AlertTriangle
                          className="mt-0.5 size-3.5 shrink-0 text-amber-700"
                          aria-hidden="true"
                        />
                        <p>{NO_LEGAL_ANSWER_MESSAGE}</p>
                      </div>
                    ) : null}

                    {!isUser && message.legal_articles && message.legal_articles.length > 0 ? (
                      <div className="mt-3 border-t border-[var(--op-line-2)] pt-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--op-muted)]">
                          <Scale className="size-3" aria-hidden="true" />
                          السند القانوني
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {message.legal_articles.map((article, articleIndex) => (
                            <button
                              key={`${article.id ?? article.label}-${articleIndex}`}
                              type="button"
                              onClick={() => setSelectedArticle(article)}
                              className="inline-flex items-center gap-1 rounded-full border border-[var(--op-gold-line)] bg-[var(--op-gold-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--op-gold-dark)] transition-colors hover:border-[var(--op-gold)] hover:bg-[var(--op-gold-line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--op-gold)] focus-visible:ring-offset-1"
                              aria-label={`عرض النص الكامل: ${article.label}`}
                            >
                              <BookOpen className="size-3" aria-hidden="true" />
                              <span>{article.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {!isUser && message.sources && message.sources.length > 0 ? (
                      <div className="mt-3 border-t border-[var(--op-line-2)] pt-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--op-muted)]">
                          <BookOpen className="size-3" aria-hidden="true" />
                          مراجع للاستئناس
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {message.sources.map((source) => (
                            <span
                              key={source}
                              className="rounded-full border border-[var(--op-line)] bg-[var(--op-surface-2)] px-2 py-0.5 text-[10px] text-[var(--op-muted)]"
                            >
                              {source}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {sending ? (
              <div className="flex items-start gap-2.5">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--op-line)] bg-white text-[#1B4332]"
                  aria-hidden="true"
                >
                  <Bot className="size-4" />
                </span>
                <div className="flex items-center gap-2 rounded-2xl rounded-tr-sm border border-[var(--op-line)] bg-white px-4 py-3 text-xs text-[var(--op-muted)]">
                  <Loader2 className="size-3.5 animate-spin text-[var(--op-gold)]" aria-hidden="true" />
                  <span>جارٍ تحليل السؤال وصياغة الإجابة...</span>
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-[var(--op-line-2)] bg-white px-4 py-3">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void handleSend(prompt)}
                  disabled={sending}
                  className="shrink-0 rounded-full border border-[var(--op-line)] bg-[var(--op-surface-2)] px-3 py-1.5 text-[11px] font-semibold text-[var(--op-text)] transition-colors hover:border-[var(--op-gold)] hover:text-[var(--op-ink)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <label htmlFor="legal-assistant-input" className="sr-only">
                اكتب سؤالك القانوني
              </label>
              <textarea
                id="legal-assistant-input"
                rows={2}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب سؤالك هنا... (Enter للإرسال، Shift+Enter لسطر جديد)"
                disabled={sending}
                className="min-h-[52px] flex-1 resize-none rounded-xl border border-[var(--op-line)] bg-[var(--op-surface-2)] px-4 py-3 text-sm text-[var(--op-text)] outline-none transition focus:border-[var(--op-gold)] focus:ring-2 focus:ring-[var(--op-gold)] disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={sending || !inputValue.trim()}
                className="op-btn op-btn-gold h-[52px] shrink-0 px-5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">إرسال</span>
              </button>
            </form>
            <p className="mt-2 text-[10px] text-[var(--op-muted)]">
              لا تُدخل بيانات شخصية حساسة. الإجابات لا تُعد فتوى قانونية ملزمة ولا قراراً إدارياً.
            </p>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="op-card">
            <div className="op-card-head">
              <h2 className="flex items-center gap-2">
                <Sparkles className="size-4 text-[var(--op-gold)]" aria-hidden="true" />
                <span>كيف يساعدك؟</span>
              </h2>
            </div>
            <div className="op-card-body space-y-3">
              {TOPICS.map((topic) => {
                const Icon = topic.icon;
                return (
                  <div key={topic.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--op-surface-2)] text-[#1B4332]">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-[var(--op-ink)]">{topic.title}</h3>
                      <p className="mt-1 text-[11px] leading-relaxed text-[var(--op-muted)]">{topic.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="op-card">
            <div className="op-card-head">
              <h2 className="flex items-center gap-2">
                <BookOpen className="size-4 text-[var(--op-gold)]" aria-hidden="true" />
                <span>المراجع الأساسية</span>
              </h2>
            </div>
            <div className="op-card-body space-y-2 text-[11px] leading-relaxed text-[var(--op-muted)]">
              <p>القانون رقم 23-12 المتعلق بالمشتريات العمومية.</p>
              <p>المرسوم الرئاسي رقم 15-247 المتعلق بتنظيم الصفقات العمومية.</p>
              <p>القانون رقم 18-07 المتعلق بحماية المعطيات الشخصية.</p>
            </div>
          </section>

          <div className="op-alert warning">
            <AlertTriangle aria-hidden="true" />
            <div>
              <strong className="mb-1 block text-xs font-bold">تنبيه قانوني</strong>
              <p className="text-[11px] leading-relaxed">
                هذا المساعد أداة إرشادية مؤتمتة. لا يُغني عن قراءة دفتر الشروط أو استشارة
                المختص القانوني أو الجهة الإدارية المختصة.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <Dialog
        open={selectedArticle !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedArticle(null);
        }}
      >
        <DialogContent
          dir="rtl"
          className="max-w-2xl border-slate-200 bg-white text-slate-900"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pe-6 text-right text-base font-extrabold text-slate-900">
              <Scale className="size-4 shrink-0 text-sky-600" aria-hidden="true" />
              <span>{selectedArticle?.label ?? 'السند القانوني'}</span>
            </DialogTitle>
            <DialogDescription className="text-right text-[11px] leading-relaxed text-slate-500">
              النص الكامل للمادة القانونية كما أعاده الخادم.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-loose text-slate-800">
            {selectedArticle?.legal_text?.trim() ? (
              <p className="whitespace-pre-wrap">{selectedArticle.legal_text}</p>
            ) : (
              <p className="text-slate-500">
                النص الكامل لهذه المادة غير متوفر حالياً. يرجى الرجوع إلى النص الرسمي للقانون.
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-sky-600 px-4 text-xs font-bold text-white transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              >
                إغلاق
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default OperatorAssistantView;
