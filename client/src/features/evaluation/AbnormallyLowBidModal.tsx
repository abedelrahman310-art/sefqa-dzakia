import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import {
  AlertTriangle,
  X,
  FileText,
  Copy,
  Check,
  Send,
  Scale,
  Calendar,
  Building2,
  Coins,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export interface AbnormallyLowOfferData {
  offerId: string;
  operatorName: string;
  financialAmount: number;
  averageAmount: number;
  estimatedBudget?: number;
  deviationPercent: number;
  dealReference: string;
  dealTitle: string;
  authorityName: string;
}

interface AbnormallyLowBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AbnormallyLowOfferData | null;
  onSendInquiry?: (inquiryText: string) => void;
}

export function AbnormallyLowBidModal({
  isOpen,
  onClose,
  data,
  onSendInquiry,
}: AbnormallyLowBidModalProps) {
  const { dir } = useI18n();
  const [copied, setCopied] = useState(false);
  const [responseDays, setResponseDays] = useState(7);

  if (!isOpen || !data) return null;

  const letterText = `الجمهورية الجزائرية الديمقراطية الشعبية
${data.authorityName}
لجنة فتح الأظرفة وتقييم العروض (COP)

المرجع: ${data.dealReference}
التاريخ: ${new Date().toLocaleDateString('ar-DZ')}

إلى السيد(ة): ممثل مؤسسة ${data.operatorName}
الموضوع: طلب توضيحات وتبرير الأسعار المنخفضة غير الطبيعية (عملاً بالمادة 72 من القانون رقم 23-12)
الصفقة: ${data.dealTitle}

تحية طيبة وبعد،

في إطار دراسة وتقييم العروض المالية المقدمة للصفقة المرجعية أعلاه من طرف لجنة فتح الأظرفة وتقييم العروض، تبيّن أن العرض المالي الإجمالي المقترح من طرف مؤسستكم والبالغ قدره: [ ${formatCurrency(data.financialAmount)} ]، يقل بنسبة انحراف قدرها (${Math.abs(data.deviationPercent).toFixed(1)}%) عن متوسط العروض المقبولة والتقدير الإداري للمصلحة المتعاقدة.

وعملاً بأحكام المادة 72 من القانون رقم 23-12 المحدد للقواعد العامة المتعلقة بالصفقات العمومية، نطلب منكم بموجب هذا الإشعار تقديم تبريرات وإيضاحات كتابية مفصلة ومدعمة بالوثائق الإثباتية حول:
1. كيفية حساب الأسعار الأحادية المنخفضة ومصادر التموين بالمواد والمعدات.
2. الحلول التقنية المعتمدة لضمان تنفيذ الأشغال والالتزامات التعاقدية بالجودة المطلوبة.
3. الامتثال للالتزامات المتعلقة بالتشريع الاجتماعي والضريبي الساري المفعول.

تمنح لكم مهلة قدرها (${responseDays}) أيام عمل ابتداءً من تاريخ تسلم هذا الإشعار لإيداع التبريرات المطلوبة لدى أمانة اللجنة. وفي حال عدم الرد أو عدم كفاية التبريرات، سيتم تطبيق الإجراءات القانونية المنصوص عليها برفض العرض المالي.

وتقبلوا فائق عبارات التقدير والاحترام.

رئيس لجنة فتح الأظرفة وتقييم العروض
الختم والتوقيع:`;

  const handleCopy = () => {
    navigator.clipboard.writeText(letterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-50"
      dir={dir}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col justify-between">
        {/* زر الإغلاق */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 end-4 z-20 size-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* ─── الرأس ─── */}
        <div className="p-6 border-b border-amber-100 bg-amber-50/70 rounded-t-3xl">
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-sm shrink-0">
              <AlertTriangle className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[10px] font-black text-amber-900">
                  تطبيق أحكام المادة 72 (القانون 23-12)
                </span>
                <span className="text-xs text-amber-800 font-bold">
                  انحراف: {Math.abs(data.deviationPercent).toFixed(1)}%-
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                توليد استفسار رسمي لعرض منخفض بشكل غير طبيعي
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                المتعهد: <strong className="text-slate-900">{data.operatorName}</strong> — المبلغ المقترح:{' '}
                <strong className="text-amber-800">{formatCurrency(data.financialAmount)}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* ─── محتوى الخطاب الرسمي ─── */}
        <div className="p-6 space-y-4 flex-1">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-700">المهلة القانونية الممنوحة للرد (أيام):</label>
            <div className="flex items-center gap-2">
              {[5, 7, 10].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setResponseDays(days)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    responseDays === days
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {days} أيام
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <textarea
              readOnly
              rows={14}
              value={letterText}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="absolute top-3 end-3 inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ الخطاب'}</span>
            </button>
          </div>
        </div>

        {/* ─── التذييل ─── */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 rounded-b-3xl flex items-center justify-between">
          <span className="text-xs text-slate-500">
            سيتم إرسال هذا الإشعار رسمياً إلى فضاء المتعامل وتوثيقه في سجل التدقيق.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={() => {
                if (onSendInquiry) onSendInquiry(letterText);
                onClose();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-700 transition-all cursor-pointer"
            >
              <Send className="size-3.5" />
              <span>إرسال الاستفسار للمتعامل</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AbnormallyLowBidModal;
