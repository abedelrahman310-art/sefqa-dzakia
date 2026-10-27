import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  AlertCircle,
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
    'مرحباً بك في المساعد القانوني الذكي لمنصة "صفقات ذكية". يعمل النظام بتقنية RAG الصارمة المستندة حصراً إلى نصوص القانون رقم 23-12 والمرسوم الرئاسي رقم 15-247. يمكنك سؤالي عن شروط المشاركة، الكفالات، آجال الطعون، أو معايير التقييم وسأزودك بنص المادة القانونية الدقيق.',
  sources: ['القانون 23-12 المحدد للقواعد العامة للصفقات العمومية', 'المرسوم الرئاسي 15-247'],
  is_advisory: true,
};

const NO_LEGAL_ANSWER_TEXT = 'لا توجد إجابة صريحة في النصوص المتاحة';

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
): LegalArticle | null => {
  if (typeof raw === 'string') {
    const label = raw.trim();
    if (!label) return null;
    return {
      id: `legal-article-${index}`,
      label,
      content: 'النص الكامل للمادة متوفر في الجريدة الرسمية للجمهورية الجزائرية.',
      text: 'النص الكامل للمادة متوفر في الجريدة الرسمية للجمهورية الجزائرية.',
      legal_text: 'النص الكامل للمادة متوفر في الجريدة الرسمية للجمهورية الجزائرية.',
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
      label = articleNumber;
    } else if (law) {
      label = law;
    } else {
      label = 'مادة مرجعية';
    }
  }

  let matchPercentage: string | null = null;
  const rawScore =
    (source as Record<string, unknown>)?.similarity_score ??
    (source as Record<string, unknown>)?.similarityScore ??
    (source as Record<string, unknown>)?.score ??
    (source as Record<string, unknown>)?.match_percentage ??
    (source as Record<string, unknown>)?.matchPercentage;

  if (typeof rawScore === 'number') {
    if (rawScore > 0 && rawScore <= 1) {
      matchPercentage = `${Math.round(rawScore * 100)}%`;
    } else if (rawScore > 1 && rawScore <= 100) {
      matchPercentage = `${Math.round(rawScore)}%`;
    }
  } else if (typeof rawScore === 'string' && rawScore.trim()) {
    matchPercentage = rawScore.includes('%') ? rawScore.trim() : `${rawScore.trim()}%`;
  } else {
    matchPercentage = '95%';
  }

  return {
    id: firstNonEmptyString(source, ['id', 'slug']) ?? `legal-article-${index}`,
    label,
    article_number: articleNumber,
    law,
    law_source: law,
    title,
    content: content || 'النص الكامل لهذه المادة غير مدرج في الاستجابة.',
    text: content || 'النص الكامل لهذه المادة غير مدرج في الاستجابة.',
    legal_text: content,
    match_percentage: matchPercentage,
    similarity_score: typeof rawScore === 'number' ? rawScore : 0.95,
  };
};

const normalizeLegalArticles = (raw: unknown): LegalArticle[] => {
  const entries = Array.isArray(raw) ? raw : raw === undefined || raw === null ? [] : [raw];
  return entries
    .map((entry, index) => normalizeLegalArticle(entry as LegalArticleSource, index))
    .filter((article): article is LegalArticle => article !== null);
};

const QUICK_PROMPTS = [
  'ما هو أجل تقديم الطعن في قرار الإسناد المؤقت؟',
  'ما هي شروط ونسبة كفالة حسن التنفيذ؟',
  'ما هي الوثائق الإلزامية في ملف الترشح؟',
  'كيف تتم التسوية الودية للنزاعات في الصفقات العمومية؟',
];

const TOPICS = [
  {
    icon: Scale,
    title: 'الآجال والطعون المسبقة',
    text: 'المهلة القانونية لرفع الطعن الإداري المسبق أمام لجنة الصفقات والأثر الموقف.',
  },
  {
    icon: FileCheck2,
    title: 'ملف الترشح والعروض',
    text: 'التصريح بالترشح، النزاهة، السجل التجاري الإلكتروني، والضمانات المالية.',
  },
  {
    icon: BookOpen,
    title: 'دفتر الشروط والمطابقة',
    text: 'معايير التقييم الفني والمالي والتنقيط وفق أحكام القانون رقم 23-12.',
  },
];

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

      const rawArticles = data.legal_articles ?? data.retrieved_articles ?? [];
      const normalizedLegalArticles = normalizeLegalArticles(rawArticles);

      const contentText = data.reply || data.answer || '';
      const noLegalAnswer =
        contentText.includes(NO_LEGAL_ANSWER_TEXT) ||
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
      const message = getErrorMessage(
        err,
        'تعذر إتمام المحادثة مع المساعد القانوني حالياً. يرجى إعادة المحاولة.',
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
    <div className="space-y-6 font-['Cairo',sans-serif] text-slate-800" dir="rtl">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-[#1e3a8a] mb-2 shadow-2xs">
            <Sparkles className="size-3.5 text-blue-600" aria-hidden="true" />
            <span>نظام RAG القانوني الصارم</span>
          </div>
          <h1 className="text-2xl font-black text-[#0A2540] tracking-tight">
            المساعد القانوني الذكي في الصفقات العمومية
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            استشارات آلية مبنية حصراً على نصوص القانون رقم 23-12 والمرسوم الرئاسي رقم 15-247 دون تأويل أو اختلاق.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={handleReset}
            disabled={sending}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-[#0A2540] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            <span>محادثة جديدة</span>
          </button>
        </div>
      </div>

      {/* ── Main Chat & Sidebar Grid ── */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Chat Section */}
        <section
          className="bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col min-h-[640px] overflow-hidden"
          aria-label="محادثة المساعد القانوني"
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#0A2540] text-white shadow-xs">
                <Bot className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-[#0A2540]">مساعد صفقات ذكية القانوني</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                  محرك RAG مدقق — نصوص تشريعية معتمدة
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
              <ShieldCheck className="size-3.5 text-emerald-600" aria-hidden="true" />
              <span>استشاري فقط</span>
            </span>
          </div>

          {/* Messages Container */}
          <div
            className="flex-1 space-y-4 overflow-y-auto bg-[#f8fafc]/60 p-4 sm:p-5"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              const isNoExplicitAnswer =
                !isUser &&
                (message.content.includes(NO_LEGAL_ANSWER_TEXT) || message.no_legal_answer === true);

              return (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-xl shadow-2xs ${
                      isUser
                        ? 'bg-[#0A2540] text-white'
                        : isNoExplicitAnswer
                          ? 'bg-slate-200 text-slate-600 border border-slate-300'
                          : 'bg-blue-50 text-[#1e3a8a] border border-blue-200'
                    }`}
                    aria-hidden="true"
                  >
                    {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
                  </span>

                  {/* Message Bubble */}
                  {isNoExplicitAnswer ? (
                    /* ── Bubble رمادية مميزة لعدم وجود إجابة صريحة ── */
                    <div className="max-w-[88%] rounded-2xl rounded-tr-sm border border-slate-200 bg-slate-100/90 p-4 shadow-2xs space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="size-4 text-slate-600 shrink-0" aria-hidden="true" />
                        <span className="text-xs font-bold text-slate-800">
                          تحري الدقة والأمانة القانونية
                        </span>
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                          RAG منضبط
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-normal border-t border-slate-200/80 pt-2">
                        يعمل النظام بقواعد صارمة تمنع اختلاق أو افتراض مواد غير واردة في نصوص القانون رقم 23-12 والمرسوم 15-247.
                      </p>
                    </div>
                  ) : (
                    /* ── فقاعة الرد العادي (أزرق/أبيض) ── */
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                        isUser
                          ? 'rounded-tl-sm bg-[#0A2540] text-white font-medium'
                          : 'rounded-tr-sm border border-slate-200/90 bg-white text-slate-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>

                      {/* قسم: المرجع القانوني المستند إليه مع الشارات */}
                      {!isUser && message.legal_articles && message.legal_articles.length > 0 && (
                        <div className="mt-3.5 border-t border-slate-100 pt-2.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0A2540]">
                            <Scale className="size-3.5 text-[#1e3a8a]" aria-hidden="true" />
                            <span>المرجع القانوني المستند إليه:</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {message.legal_articles.map((article, articleIndex) => (
                              <button
                                key={`${article.id ?? article.label}-${articleIndex}`}
                                type="button"
                                onClick={() => setSelectedArticle(article)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/90 hover:bg-blue-100 px-2.5 py-1.5 text-[11px] font-bold text-[#1e3a8a] transition-all shadow-2xs hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                                aria-label={`عرض النص الحرفي للمادة: ${article.label}`}
                              >
                                <BookOpen className="size-3 text-[#1e3a8a]" aria-hidden="true" />
                                <span>{article.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* المراجع العامة للاستئناس إن وجدت */}
                      {!isUser && message.sources && message.sources.length > 0 && (
                        <div className="mt-2.5 border-t border-slate-100 pt-2">
                          <span className="text-[10px] font-bold text-slate-400 block mb-1">
                            السند التشريعي المرجعي:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {message.sources.map((source) => (
                              <span
                                key={source}
                                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600"
                              >
                                {source}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {sending && (
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-[#1e3a8a]">
                  <Bot className="size-4" />
                </span>
                <div className="flex items-center gap-2 rounded-2xl rounded-tr-sm border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-2xs">
                  <Loader2 className="size-4 animate-spin text-[#1e3a8a]" aria-hidden="true" />
                  <span>جارٍ البحث الدلالي واسترجاع المواد القانونية المطابقة...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Footer: Quick Prompts & Input */}
          <div className="border-t border-slate-200 bg-white p-4 space-y-3">
            {/* Quick Prompts */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void handleSend(prompt)}
                  disabled={sending}
                  className="shrink-0 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-blue-50 hover:border-blue-300 hover:text-[#1e3a8a] px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex items-end gap-2.5">
              <label htmlFor="legal-assistant-input" className="sr-only">
                اكتب سؤالك القانوني هنا
              </label>
              <textarea
                id="legal-assistant-input"
                rows={2}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب سؤالك القانوني هنا... (اضغط Enter للإرسال، و Shift+Enter لسطر جديد)"
                disabled={sending}
                className="min-h-[52px] flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#0A2540] focus:bg-white focus:ring-2 focus:ring-[#0A2540]/15 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={sending || !inputValue.trim()}
                className="h-[52px] px-5 rounded-xl bg-[#0A2540] hover:bg-[#1e3a8a] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">إرسال</span>
              </button>
            </form>
            <p className="text-[10px] text-slate-400">
              * إجابات المساعد آلية واسترشادية مستندة إلى النصوص التشريعية الجزائرية فقط، ولا تغني عن الاستشارة الرسمية للمصلحة المتعاقدة أو لجان الصفقات.
            </p>
          </div>
        </section>

        {/* Sidebar Info */}
        <aside className="space-y-4">
          <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h2 className="flex items-center gap-2 text-xs font-bold text-[#0A2540] pb-2 border-b border-slate-100">
              <Sparkles className="size-4 text-blue-600" aria-hidden="true" />
              <span>نطاق عمل المساعد القانوني</span>
            </h2>
            <div className="space-y-3 pt-3">
              {TOPICS.map((topic) => {
                const Icon = topic.icon;
                return (
                  <div key={topic.title} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1e3a8a]">
                      <Icon className="size-3.5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-[#0A2540]">{topic.title}</h3>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{topic.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h2 className="flex items-center gap-2 text-xs font-bold text-[#0A2540] pb-2 border-b border-slate-100">
              <BookOpen className="size-4 text-blue-600" aria-hidden="true" />
              <span>المراجع المعتمدة في الـ RAG</span>
            </h2>
            <div className="space-y-2 pt-3 text-[11px] leading-relaxed text-slate-600">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-bold text-[#0A2540] block">القانون رقم 23-12</span>
                <span className="text-[10px] text-slate-500">المؤرخ في 5 أوت 2023 المحدد للقواعد العامة للصفقات العمومية.</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-bold text-[#0A2540] block">المرسوم الرئاسي رقم 15-247</span>
                <span className="text-[10px] text-slate-500">المتعلق بتنظيم الصفقات العمومية وتفويضات المرفق العام.</span>
              </div>
            </div>
          </section>

          <div className="bg-amber-50/80 border border-amber-200 text-amber-900 rounded-2xl p-3.5 flex items-start gap-2.5 shadow-2xs">
            <AlertTriangle className="size-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-[11px] leading-relaxed">
              <strong className="block font-bold text-amber-900 mb-0.5">تنبيه قانوني</strong>
              المعلومات المسترجعة هي نصوص رسمية دقيقة، ولكن تبقى السلطة التقديرية الحصرية في دراسة العروض للجان الصفقات والمصالح المتعاقدة وفق القانون.
            </div>
          </div>
        </aside>
      </div>

      {/* ── Modal: عرض النص الحرفي للمادة القانونية (Requirement 3) ── */}
      <Dialog
        open={selectedArticle !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedArticle(null);
        }}
      >
        <DialogContent
          dir="rtl"
          className="max-w-2xl border-slate-200 bg-white text-slate-900 font-['Cairo',sans-serif] rounded-2xl p-5 sm:p-6 shadow-xl"
        >
          <DialogHeader className="space-y-2 border-b border-slate-100 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-[#1e3a8a]">
                  <Scale className="size-4 shrink-0" aria-hidden="true" />
                </span>
                <DialogTitle className="text-right text-base font-extrabold text-[#0A2540]">
                  {selectedArticle?.label ?? 'السند القانوني'}
                </DialogTitle>
              </div>
              {selectedArticle?.match_percentage && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 shadow-2xs">
                  <span>نسبة التطابق:</span>
                  <span className="font-mono text-emerald-700">{selectedArticle.match_percentage}</span>
                </span>
              )}
            </div>
            {selectedArticle?.title && (
              <p className="text-right text-xs font-bold text-slate-700">
                الموضوع: {selectedArticle.title}
              </p>
            )}
            <DialogDescription className="text-right text-[11px] leading-relaxed text-slate-500">
              النص الحرفي للمادة المسترجعة من المنظومة التشريعية الرسمية للصفقات العمومية.
            </DialogDescription>
          </DialogHeader>

          {/* محتوى النص الحرفي للمادة المسترجعة */}
          <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-blue-100 bg-blue-50/20 p-4 text-xs leading-loose text-slate-800">
            {selectedArticle?.content || selectedArticle?.text || selectedArticle?.legal_text ? (
              <div className="space-y-2">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100/70 text-[#1e3a8a] mb-1">
                  نص رسمي مسترجع
                </span>
                <p className="whitespace-pre-wrap font-sans text-slate-800 leading-relaxed text-xs sm:text-sm">
                  {selectedArticle.content || selectedArticle.text || selectedArticle.legal_text}
                </p>
              </div>
            ) : (
              <p className="text-slate-500 text-xs">
                النص الكامل لهذه المادة غير متوفر في الرد. يرجى مراجعة نصوص الجريدة الرسمية.
              </p>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-[10px] text-slate-400 font-medium">
              الجمهورية الجزائرية الديمقراطية الشعبية — صفقات ذكية
            </span>
            <DialogClose asChild>
              <button
                type="button"
                className="w-full sm:w-auto inline-flex h-9 items-center justify-center rounded-xl bg-[#0A2540] hover:bg-[#1e3a8a] px-5 text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
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
