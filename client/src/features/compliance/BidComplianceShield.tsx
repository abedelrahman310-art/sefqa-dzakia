import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  ExternalLink,
  Award,
} from 'lucide-react';

export interface ComplianceDocument {
  code: string;
  name: string;
  category?: string;
  description?: string;
  legal_ref?: string;
  is_mandatory?: boolean;
}

export interface ExpiredDocument {
  code: string;
  name: string;
  expiry_date?: string;
  reason?: string;
}

export interface ComplianceData {
  deal_id: string;
  deal_reference?: string;
  deal_title?: string;
  is_compliant: boolean;
  compliance_score: number;
  total_required: number;
  submitted_count: number;
  missing_count: number;
  missing_documents: ComplianceDocument[];
  available_documents: ComplianceDocument[];
  expired_documents?: ExpiredDocument[];
  has_expired_documents?: boolean;
  advisory_notes?: string[];
  submission_deadline?: string | null;
}

interface BidComplianceShieldProps {
  data: ComplianceData;
  onUploadRequest?: (docCode: string) => void;
  className?: string;
}

export function BidComplianceShield({
  data,
  onUploadRequest,
  className = '',
}: BidComplianceShieldProps) {
  const { t, dir, lang } = useI18n();
  const isRtl = dir === 'rtl';

  const [activeTab, setActiveTab] = useState<'all' | 'missing' | 'available' | 'expired'>('all');
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const score = Math.round(data.compliance_score || 0);
  const isProtected = data.is_compliant && (!data.missing_documents || data.missing_documents.length === 0);
  const hasExpired = Boolean(data.expired_documents && data.expired_documents.length > 0);

  // تصنيف درجة الجاهزية والحماية
  const getScoreTheme = () => {
    if (isProtected && !hasExpired) {
      return {
        bg: 'bg-emerald-50 border-emerald-300 text-emerald-950',
        badgeBg: 'bg-emerald-600 text-white',
        ringColor: 'stroke-emerald-600',
        trackColor: 'stroke-emerald-100',
        title: 'عرض محمي من الإقصاء الشكلي بنسبة 100%',
        subtitle: 'كافة الوثائق الإلزامية لملف الترشح والعرضين التقني والمالي مستوفاة وسارية المفعول وفق القانون 23-12.',
        icon: ShieldCheck,
      };
    }
    if (score >= 70) {
      return {
        bg: 'bg-amber-50 border-amber-300 text-amber-950',
        badgeBg: 'bg-amber-600 text-white',
        ringColor: 'stroke-amber-500',
        trackColor: 'stroke-amber-100',
        title: 'جاهزية مرتفعة مع مخاطر شكلية محتملة',
        subtitle: 'تم استيفاء معظم الوثائق، لكن ينبغي استكمال البنود المتبقية لتفادي ملاحظات لجنة فتح الأظرفة.',
        icon: AlertTriangle,
      };
    }
    return {
      bg: 'bg-rose-50 border-rose-300 text-rose-950',
      badgeBg: 'bg-rose-600 text-white',
      ringColor: 'stroke-rose-600',
      trackColor: 'stroke-rose-100',
      title: 'خطر إقصاء شكلي مباشر — ملف غير مكتمل',
      subtitle: 'توجد وثائق إلزامية ناقصة وفق المادة 67 من القانون 23-12. الإيداع بهذا الوضع يعرض عرضك للرفض التلقائي.',
      icon: ShieldAlert,
    };
  };

  const theme = getScoreTheme();
  const IconComponent = theme.icon;

  // تقسيم الوثائق بحسب الملفات القانونية الثلاثة (المادة 67)
  const missing = data.missing_documents || [];
  const available = data.available_documents || [];
  const expired = data.expired_documents || [];

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-xs bg-white ${className}`}
      dir={dir}
    >
      {/* ─── 1. رأس الدرع والنتيجة البصرية ─── */}
      <div className={`p-5 border-b transition-colors ${theme.bg}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${theme.badgeBg}`}>
              <IconComponent className="size-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  درع مكافحة الإقصاء الشكلي (Bid Compliance Shield)
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${theme.badgeBg}`}>
                  {score}% جاهزية
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                {theme.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                {theme.subtitle}
              </p>
            </div>
          </div>

          {/* عداد النسبة الدائري الفاخر */}
          <div className="relative size-20 shrink-0 self-center sm:self-auto flex items-center justify-center">
            <svg className="size-full -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className={`fill-none ${theme.trackColor}`}
                strokeWidth="3.5"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`fill-none ${theme.ringColor} transition-all duration-1000 ease-out`}
                strokeDasharray={`${score}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-sm font-black text-slate-900">{score}%</span>
              <span className="text-[9px] font-bold text-slate-500">
                {data.submitted_count}/{data.total_required}
              </span>
            </div>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-200/60 pt-3 text-center">
          <div className="rounded-xl bg-white/80 p-2 border border-slate-200/60 shadow-2xs">
            <span className="block text-xs font-bold text-emerald-700">{available.length}</span>
            <span className="text-[10px] font-semibold text-slate-600">وثائق مستوفاة ومقبولة</span>
          </div>
          <div className="rounded-xl bg-white/80 p-2 border border-slate-200/60 shadow-2xs">
            <span className={`block text-xs font-bold ${missing.length > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {missing.length}
            </span>
            <span className="text-[10px] font-semibold text-slate-600">وثائق ناقصة مطلوبة</span>
          </div>
          <div className="rounded-xl bg-white/80 p-2 border border-slate-200/60 shadow-2xs">
            <span className={`block text-xs font-bold ${expired.length > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
              {expired.length}
            </span>
            <span className="text-[10px] font-semibold text-slate-600">وثائق منتهية الصلاحية</span>
          </div>
        </div>
      </div>

      {/* ─── 2. شريط التبويبات للتصفية ─── */}
      <div className="flex border-b border-slate-100 bg-slate-50/70 p-2 gap-1.5 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex-1 rounded-xl py-1.5 px-3 transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          كافة الوثائق ({data.total_required})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('missing')}
          className={`flex-1 rounded-xl py-1.5 px-3 transition-colors cursor-pointer ${
            activeTab === 'missing'
              ? 'bg-white text-rose-700 shadow-2xs border border-rose-200 font-black'
              : 'text-slate-500 hover:text-rose-600'
          }`}
        >
          الناقصة ({missing.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('available')}
          className={`flex-1 rounded-xl py-1.5 px-3 transition-colors cursor-pointer ${
            activeTab === 'available'
              ? 'bg-white text-emerald-700 shadow-2xs border border-emerald-200 font-black'
              : 'text-slate-500 hover:text-emerald-700'
          }`}
        >
          المستوفاة ({available.length})
        </button>
        {expired.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('expired')}
            className={`flex-1 rounded-xl py-1.5 px-3 transition-colors cursor-pointer ${
              activeTab === 'expired'
                ? 'bg-white text-amber-700 shadow-2xs border border-amber-200 font-black'
                : 'text-slate-500 hover:text-amber-700'
            }`}
          >
            المنتهية ({expired.length})
          </button>
        )}
      </div>

      {/* ─── 3. قائمة الوثائق التفاعلية ─── */}
      <div className="p-4 space-y-2.5 max-h-96 overflow-y-auto">
        {/* التنبيهات منتهية الصلاحية إن وجدت */}
        {(activeTab === 'all' || activeTab === 'expired') && expired.length > 0 && (
          <div className="mb-3 space-y-2">
            <span className="block text-[11px] font-bold text-amber-800">
              ⚠️ وثائق منتهية الصلاحية تحتاج إلى تجديد قبل تاريخ الإيداع:
            </span>
            {expired.map((doc) => (
              <div
                key={doc.code}
                className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="size-4 text-amber-600 shrink-0" />
                  <div>
                    <strong className="text-slate-900 block">{doc.name}</strong>
                    <span className="text-[10px] text-amber-700 font-medium">{doc.reason}</span>
                  </div>
                </div>
                {onUploadRequest && (
                  <button
                    type="button"
                    onClick={() => onUploadRequest(doc.code)}
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-700 transition-colors shadow-2xs cursor-pointer"
                  >
                    <UploadCloud className="size-3" />
                    <span>تحديث</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* الوثائق الناقصة */}
        {(activeTab === 'all' || activeTab === 'missing') && missing.length > 0 && (
          <div className="space-y-2">
            {activeTab === 'all' && (
              <span className="block text-[11px] font-bold text-rose-800">
                ❌ وثائق مطلوبة غير موجودة في ملفك (تسبب الإقصاء الإجرائي):
              </span>
            )}
            {missing.map((doc) => (
              <div
                key={doc.code}
                className="rounded-xl border border-rose-200 bg-rose-50/30 p-3 transition-all hover:bg-rose-50/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <XCircle className="size-4 text-rose-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-slate-900 truncate">{doc.name}</strong>
                        {doc.is_mandatory && (
                          <span className="rounded-md bg-rose-100 px-1.5 py-0.2 text-[9px] font-extrabold text-rose-700">
                            إلزامي
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {doc.category} {doc.legal_ref ? `• ${doc.legal_ref}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onUploadRequest && (
                      <button
                        type="button"
                        onClick={() => onUploadRequest(doc.code)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                      >
                        <UploadCloud className="size-3" />
                        <span>إرفاق</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpandedDoc(expandedDoc === doc.code ? null : doc.code)}
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {expandedDoc === doc.code ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </button>
                  </div>
                </div>

                {expandedDoc === doc.code && doc.description && (
                  <div className="mt-2.5 pt-2 border-t border-rose-100 text-[11px] text-slate-600 leading-relaxed bg-white/70 p-2.5 rounded-lg">
                    <p className="font-semibold text-slate-700 mb-1">الإرشاد القانوني والشكلي:</p>
                    <p>{doc.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* الوثائق المستوفاة */}
        {(activeTab === 'all' || activeTab === 'available') && available.length > 0 && (
          <div className="space-y-2 mt-3">
            {activeTab === 'all' && (
              <span className="block text-[11px] font-bold text-emerald-800">
                ✅ وثائق مستوفاة ومسجلة في المنظومة:
              </span>
            )}
            {available.map((doc) => (
              <div
                key={doc.code}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <strong className="text-xs text-slate-800 truncate block">{doc.name}</strong>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {doc.category} {doc.legal_ref ? `• ${doc.legal_ref}` : ''}
                    </span>
                  </div>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                  معتمدة
                </span>
              </div>
            ))}
          </div>
        )}

        {/* حالة اكتمال تامة */}
        {activeTab === 'missing' && missing.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-500">
            <CheckCircle2 className="size-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-bold text-slate-800">لا توجد وثائق ناقصة!</p>
            <p className="text-[11px] mt-0.5">ملفك مستوفٍ لكافة متطلبات الترشح في هذه الصفقة.</p>
          </div>
        )}
      </div>

      {/* ─── 4. التذييل القانوني التوجيهي ─── */}
      <div className="border-t border-slate-100 bg-slate-50/80 p-3 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Award className="size-3.5 text-emerald-700" />
          <span>مطابق للمادة 67 من القانون 23-12 (ملف الترشح والعرضين التقني والمالي)</span>
        </div>
        <span className="font-bold text-slate-600">صفقات ذكية 🇩🇿</span>
      </div>
    </div>
  );
}

export default BidComplianceShield;
