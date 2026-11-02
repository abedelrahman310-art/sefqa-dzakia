import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import {
  Mic,
  MicOff,
  Sparkles,
  Search,
  ArrowRight,
  ShieldAlert,
  FileText,
  Building,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  Cpu,
  Layers,
  Scale,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceCopilotWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedVoiceCommand {
  intent: 'search_deals' | 'nav_integrity' | 'nav_specs' | 'nav_opening' | 'nav_dashboard' | 'nav_assistant' | 'general';
  label: string;
  targetPath: string;
  queryParam?: string;
}

export function VoiceCopilotWidget({ isOpen, onClose }: VoiceCopilotWidgetProps) {
  const { dir } = useI18n();
  const [, setLocation] = useLocation();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [lang, setLang] = useState('ar-DZ');
  const [isSupported, setIsSupported] = useState(true);
  const [detectedCommand, setDetectedCommand] = useState<ParsedVoiceCommand | null>(null);

  const recognitionRef = useRef<any>(null);

  // تحليل العبارات الصوتية وتوجيهها للمسار الإداري الصحيح
  const parseVoiceIntent = (text: string): ParsedVoiceCommand | null => {
    const t = text.trim().toLowerCase();
    if (!t) return null;

    if (t.includes('رقابة') || t.includes('نزاهة') || t.includes('فساد') || t.includes('تواطؤ') || t.includes('تعثر')) {
      return {
        intent: 'nav_integrity',
        label: 'الانتقال إلى رادار الرقابة والنزاهة المؤسسية (Anti-Fraud Radar)',
        targetPath: '/central/integrity',
      };
    }

    if (t.includes('دفتر') || t.includes('دفاتر') || t.includes('شروط') || t.includes('cahier')) {
      return {
        intent: 'nav_specs',
        label: 'الانتقال إلى محرر ومولد دفاتر الشروط الذكي',
        targetPath: '/authority/drafts',
      };
    }

    if (t.includes('فتح') || t.includes('أظرفة') || t.includes('جلسة') || t.includes('تقييم')) {
      return {
        intent: 'nav_opening',
        label: 'الانتقال إلى جلسات فتح الأظرفة ولجنة تقييم العروض (COP)',
        targetPath: '/authority/opening-sessions',
      };
    }

    if (t.includes('مساعد') || t.includes('سؤال') || t.includes('قانون') || t.includes('استشارة')) {
      return {
        intent: 'nav_assistant',
        label: 'استشارة المساعد القانوني السيادي (RAG Copilot)',
        targetPath: '/operator/assistant',
      };
    }

    if (t.includes('ابحث') || t.includes('بحث') || t.includes('صفقات') || t.includes('مناقصة') || t.includes('عروض')) {
      const cleanQuery = t
        .replace('ابحث عن', '')
        .replace('ابحث في', '')
        .replace('صفقات', '')
        .replace('مناقصات', '')
        .trim();
      return {
        intent: 'search_deals',
        label: `البحث عن الصفقات المطابقة: "${cleanQuery || 'الكل'}"`,
        targetPath: '/operator/deals',
        queryParam: cleanQuery,
      };
    }

    if (t.includes('رئيسية') || t.includes('لوحة') || t.includes('استقبال')) {
      return {
        intent: 'nav_dashboard',
        label: 'الانتقال إلى لوحة القيادة المركزية',
        targetPath: '/central/dashboard',
      };
    }

    return {
      intent: 'general',
      label: `البحث في المنصة عن: "${t}"`,
      targetPath: '/operator/deals',
      queryParam: t,
    };
  };

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      let currentInterim = '';
      let currentFinal = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentFinal += event.results[i][0].transcript + ' ';
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      const fullText = (transcript + ' ' + currentFinal).trim();
      if (currentFinal) {
        setTranscript(fullText);
        const cmd = parseVoiceIntent(fullText);
        setDetectedCommand(cmd);
      }
      setInterimText(currentInterim);
    };

    recognition.onerror = (event: any) => {
      console.warn('Voice Copilot error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [lang, transcript]);

  // بدء الاستماع تلقائياً عند فتح النافذة
  useEffect(() => {
    if (isOpen && isSupported && recognitionRef.current) {
      setTranscript('');
      setInterimText('');
      setDetectedCommand(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        // ignore if already active
      }
    }
  }, [isOpen, isSupported]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Could not start recognition:', err);
      }
    }
  };

  const executeCommand = (cmd: ParsedVoiceCommand) => {
    onClose();
    if (cmd.queryParam) {
      setLocation(`${cmd.targetPath}?search=${encodeURIComponent(cmd.queryParam)}`);
    } else {
      setLocation(cmd.targetPath);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-in fade-in" dir={dir}>
      <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* خلفية جمالية مائية */}
        <div className="absolute top-0 end-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* زر الإغلاق */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 start-5 text-muted-foreground hover:text-navy-900 p-1.5 rounded-full hover:bg-muted transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ترويسة المساعد الصوتي */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
            <Mic className={`w-8 h-8 ${isListening ? 'animate-pulse' : ''}`} />
          </div>
          <h3 className="text-lg font-extrabold text-navy-950 flex items-center justify-center gap-2">
            <span>المساعد الصوتي السيادي (Voice Copilot)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              مباشر محلياً
            </span>
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            تحدث بصوتك باللغة العربية للبحث في الصفقات، تصفح دفاتر الشروط، أو فتح رادار الرقابة والنزاهة المؤسسية فوراً.
          </p>
        </div>

        {/* موجات الصوت والتعرف الصوتي المباشر */}
        <div className="bg-muted/40 border border-border rounded-2xl p-5 text-center space-y-3 min-h-[110px] flex flex-col justify-center">
          {isListening ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-1.5 h-6">
                <span className="w-1 bg-emerald-600 rounded-full h-3 animate-pulse" />
                <span className="w-1 bg-emerald-600 rounded-full h-6 animate-pulse delay-75" />
                <span className="w-1 bg-emerald-600 rounded-full h-4 animate-pulse delay-150" />
                <span className="w-1 bg-emerald-600 rounded-full h-8 animate-pulse delay-100" />
                <span className="w-1 bg-emerald-600 rounded-full h-5 animate-pulse delay-200" />
              </div>
              <p className="text-xs font-bold text-emerald-800">جاري الاستماع إليك الآن... تفضل بالكلام</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground font-medium">
              الميكروفون متوقف حالياً. انقر على الزر بالأسفل للتحدث.
            </p>
          )}

          {/* النص المكتوب */}
          <div className="min-h-[32px] text-xs font-semibold text-navy-950 leading-relaxed">
            {transcript || interimText ? (
              <span>
                {transcript} <span className="text-muted-foreground italic">{interimText}</span>
              </span>
            ) : (
              <span className="text-muted-foreground/60">مثال: «ابحث عن صفقات البناء والري في ولاية الجزائر»</span>
            )}
          </div>
        </div>

        {/* الأمر المكتشف الذكي واقتراح الإجراء */}
        {detectedCommand && (
          <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-2xl space-y-2.5 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>الأمر المكتشف (Intent Recognized):</span>
            </div>
            <p className="text-xs text-emerald-950 font-semibold leading-relaxed">
              {detectedCommand.label}
            </p>
            <Button
              size="sm"
              onClick={() => executeCommand(detectedCommand)}
              className="w-full bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl shadow-sm gap-2"
            >
              <span>تنفيذ والانتقال فوراً</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Button>
          </div>
        )}

        {/* أمثلة أوامر سريعة للاختبار */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold text-muted-foreground block text-start">أوامر صوتية نموذجية مقترحة:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              'افتح رادار الرقابة والنزاهة',
              'ابحث عن صفقات الأشغال بوهران',
              'الانتقال إلى دفاتر الشروط',
              'لجنة فتح الأظرفة والتقييم',
            ].map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setTranscript(prompt);
                  const cmd = parseVoiceIntent(prompt);
                  setDetectedCommand(cmd);
                }}
                className="text-xs bg-muted/60 hover:bg-muted text-navy-900 px-2.5 py-1 rounded-xl border border-border transition-colors text-start"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* أزرار التحكم السفلية */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>اللغة: العربية (الجزائر)</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isListening ? 'destructive' : 'default'}
              size="sm"
              onClick={toggleListening}
              className="text-xs font-bold rounded-xl gap-2 px-4 shadow-sm"
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>إيقاف</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>تحدث الآن</span>
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-xl border-border font-bold"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
