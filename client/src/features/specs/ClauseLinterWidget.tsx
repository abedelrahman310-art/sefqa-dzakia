import React, { useMemo } from 'react';
import { useI18n } from '@/i18n';
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Wand2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export interface LinterIssue {
  id: string;
  category: 'brand_restriction' | 'geo_discrimination' | 'excessive_requirement' | 'ambiguous_term';
  severity: 'high' | 'medium' | 'low';
  title: string;
  detectedText: string;
  explanation: string;
  legalArticle: string;
  suggestedFix?: string;
  replacementPattern?: RegExp | string;
}

interface ClauseLinterWidgetProps {
  content: string;
  onApplyFix?: (newContent: string) => void;
  className?: string;
}

// قائمة العلامات التجارية الشائعة التي يحظر اشتراطها حصراً دون عبارة "أو ما يعادلها"
const PROPRIETARY_BRANDS = [
  'cisco', 'hp', 'dell', 'lenovo', 'siemens', 'schneider', 'bosch',
  'apple', 'microsoft', 'toyota', 'renault', 'caterpillar', 'cat', 'jcb',
  'sony', 'philips', 'panasonic', 'legrand', 'knauf', 'lafarge',
];

export function ClauseLinterWidget({
  content,
  onApplyFix,
  className = '',
}: ClauseLinterWidgetProps) {
  const { dir } = useI18n();

  // تحليل فوري للنص لرصد البنود التمييزية والإقصائية غير القانونية
  const issues = useMemo<LinterIssue[]>(() => {
    if (!content || content.trim().length < 5) return [];

    const detected: LinterIssue[] = [];
    const lower = content.toLowerCase();

    // 1. فحص العلامات التجارية دون عبارة «أو ما يعادلها»
    PROPRIETARY_BRANDS.forEach((brand) => {
      const brandIndex = lower.indexOf(brand);
      if (brandIndex !== -1) {
        // فحص هل النص المحيط يحتوي على "ما يعادل" أو "equivalent"
        const snippet = lower.slice(Math.max(0, brandIndex - 30), Math.min(lower.length, brandIndex + brand.length + 35));
        if (!snippet.includes('يعادل') && !snippet.includes('équivalent') && !snippet.includes('يماثل') && !snippet.includes('equivalent')) {
          detected.push({
            id: `brand-${brand}`,
            category: 'brand_restriction',
            severity: 'high',
            title: `اشتراط علامة تجارية محددة (${brand.toUpperCase()}) دون نص التكافؤ`,
            detectedText: brand,
            explanation: `تنص المادة 28 من القانون 23-12 على أن المواصفات التقنية يجب ألا تشير إلى علامات تجارية أو مصادر محددة إلا استثناءً، ويجب وجوباً أن تقترن بعبارة «أو ما يعادلها».`,
            legalArticle: 'المادتان 5 و 28 من القانون رقم 23-12',
            suggestedFix: `${brand.toUpperCase()} (أو ما يعادلها تقنياً)`,
            replacementPattern: new RegExp(brand, 'gi'),
          });
        }
      }
    });

    // 2. فحص التمييز الجغرافي وحصر المشاركة
    const geoDiscriminationRegex = /(حصراً في (ولاية|بلدية)|يشترط أن يكون المقر في|مقتصر على المقاولين المقيمين في)/i;
    const geoMatch = content.match(geoDiscriminationRegex);
    if (geoMatch) {
      detected.push({
        id: 'geo-discrim',
        category: 'geo_discrimination',
        severity: 'high',
        title: 'شرط تمييز جغرافي يخل بحرية المنافسة',
        detectedText: geoMatch[0],
        explanation: `يعد حصر المشاركة أو منح أفضلية جغرافية على أساس المقر الاجتماعي انتهاكاً لمبدأ «حرية الوصول إلى الطلب العمومي والمساواة في معاملة المرشحين».`,
        legalArticle: 'المادة 5 من القانون رقم 23-12',
        suggestedFix: 'مفتوح لكافة المؤسسات المؤهلة وطنياً مع إمكانية التعهد بفتح فرع محلي عند المنح.',
      });
    }

    // 3. فحص اشتراط سنوات خبرة مفرطة
    const expRegex = /(\d{2,})\s*(سنوات|سنة|ans)\s*خبرة/i;
    const expMatch = content.match(expRegex);
    if (expMatch && parseInt(expMatch[1], 10) > 10) {
      detected.push({
        id: 'excessive-exp',
        category: 'excessive_requirement',
        severity: 'medium',
        title: `اشتراط خبرة مفرطة (${expMatch[1]} سنة) قد يعد بنداً تعجيزياً`,
        detectedText: expMatch[0],
        explanation: `تشترط المادة 9 التناسب التام بين شروط القدرة المطلوبة وحجم وطبيعة الصفقة، لتفادي إقصاء الشركات الناشئة والمؤسسات المصغرة المؤهلة.`,
        legalArticle: 'المادة 9 من القانون رقم 23-12',
        suggestedFix: '5 سنوات خبرة مع تقديم مراجع مهنية لمشاريع مماثلة.',
      });
    }

    // 4. فحص عبارات الإقصاء المباشر دون سند
    const directElimRegex = /(يُقصى تلقائياً دون إشعار|إقصاء فوري دون استيضاح)/i;
    const elimMatch = content.match(directElimRegex);
    if (elimMatch) {
      detected.push({
        id: 'direct-elim',
        category: 'ambiguous_term',
        severity: 'medium',
        title: 'صيغة إقصاء قطعية تخالف مسطرة طلب التوضيحات',
        detectedText: elimMatch[0],
        explanation: `تلزم المادة 71 المصلحة المتعاقدة بطلب استكمال وتوضيح الوثائق الناقصة غير الإلزامية خلال أجل 10 أيام قبل إعلان الإقصاء.`,
        legalArticle: 'المادة 71 من القانون رقم 23-12',
        suggestedFix: 'يتم طلب استيضاحات أو استكمال النواقص الشكلية في أجل قانوني قدره 10 أيام.',
      });
    }

    return detected;
  }, [content]);

  // احتساب مؤشر النزاهة والسلامة القانونية للبند
  const legalityScore = useMemo(() => {
    if (issues.length === 0) return 100;
    const penalty = issues.reduce((acc, issue) => {
      if (issue.severity === 'high') return acc + 35;
      if (issue.severity === 'medium') return acc + 20;
      return acc + 10;
    }, 0);
    return Math.max(0, 100 - penalty);
  }, [issues]);

  const handleFix = (issue: LinterIssue) => {
    if (!onApplyFix) return;
    if (issue.category === 'brand_restriction' && issue.replacementPattern && issue.suggestedFix) {
      const fixed = content.replace(issue.replacementPattern, issue.suggestedFix);
      onApplyFix(fixed);
    } else if (issue.suggestedFix) {
      const fixed = content.replace(issue.detectedText, issue.suggestedFix);
      onApplyFix(fixed);
    }
  };

  const isCompliant = issues.length === 0;

  return (
    <div
      className={`rounded-2xl border p-4 transition-all duration-200 ${
        isCompliant
          ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
          : legalityScore > 60
          ? 'border-amber-200 bg-amber-50/40 text-amber-950'
          : 'border-rose-200 bg-rose-50/40 text-rose-950'
      } ${className}`}
      dir={dir}
    >
      {/* ─── رأس المدقق القانوني ─── */}
      <div className="flex items-center justify-between border-b border-black/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex size-8 items-center justify-center rounded-xl text-white shadow-2xs ${
              isCompliant
                ? 'bg-emerald-600'
                : legalityScore > 60
                ? 'bg-amber-600'
                : 'bg-rose-600'
            }`}
          >
            {isCompliant ? <ShieldCheck className="size-4" /> : <ShieldAlert className="size-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900">
                المدقق الآلي للبنود التمييزية والإقصائية (Anti-Bias Linter)
              </h4>
              <span
                className={`rounded-full px-2 py-0.2 text-[10px] font-black ${
                  isCompliant
                    ? 'bg-emerald-100 text-emerald-800'
                    : legalityScore > 60
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {legalityScore}% سلامة قانونية
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              فحص لحظي لمطابقة البند لمبادئ المنافسة الحرة والنزاهة وفق القانون 23-12.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
          <Scale className="size-4 text-emerald-700" />
          <span>القانون 23-12</span>
        </div>
      </div>

      {/* ─── محتوى النتائج ─── */}
      <div className="mt-3">
        {isCompliant ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 py-1">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>صياغة البند سليمة ومطابقة لمعايير النزاهة والمنافسة الحرة دون أي قيود تمييزية.</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            <span className="block text-[11px] font-bold text-slate-700">
              تم رصد ({issues.length}) ملاحظات قد تعرض دفتر الشروط للطعن أو الإلغاء:
            </span>

            {issues.map((issue) => (
              <div
                key={issue.id}
                className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-2xs space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className={`size-4 shrink-0 mt-0.5 ${
                        issue.severity === 'high' ? 'text-rose-600' : 'text-amber-600'
                      }`}
                    />
                    <div>
                      <strong className="text-slate-900 block font-bold">{issue.title}</strong>
                      <span className="text-[10px] font-semibold text-slate-500">
                        المرجع القانوني: {issue.legalArticle}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                      issue.severity === 'high'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {issue.severity === 'high' ? 'مخالفة صريحة' : 'تحذير توجيهي'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {issue.explanation}
                </p>

                {issue.suggestedFix && onApplyFix && (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="text-[11px] text-emerald-800 truncate">
                      <span className="font-bold">التصحيح المقترح: </span>
                      <span className="font-mono text-[10px]">{issue.suggestedFix}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleFix(issue)}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-emerald-700 transition-colors cursor-pointer shrink-0"
                    >
                      <Wand2 className="size-3" />
                      <span>تطبيق التصحيح</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClauseLinterWidget;
