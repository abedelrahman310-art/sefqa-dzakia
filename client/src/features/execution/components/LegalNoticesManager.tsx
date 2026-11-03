import React, { useCallback, useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Scale,
  ShieldAlert,
  Calendar,
  X,
  Check,
  Send,
  Upload,
  FileText,
  FileCheck2,
  Sparkles,
  Info,
} from 'lucide-react';

export interface LegalNoticeApi {
  id: string;
  deal: string;
  deal_reference: string;
  deal_title: string;
  authority_name: string;
  operator_name: string;
  reference: string;
  notice_type: 'delay' | 'quality' | 'abandonment' | 'non_compliance';
  notice_type_display: string;
  reason: string;
  issued_date: string;
  legal_deadline_days: number;
  deadline_date: string;
  days_remaining: number;
  is_expired: boolean;
  status: 'draft' | 'issued' | 'acknowledged' | 'expired' | 'resolved';
  status_display: string;
  penalty_amount: number | string;
  operator_justification: string;
  operator_justification_file: string | null;
  justification_submitted_at: string | null;
  created_by_name: string;
  acknowledged_at: string | null;
  acknowledged_by_name: string;
  resolved_at: string | null;
  resolution_notes: string;
  document_pdf: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealLegalNoticesResponseApi {
  deal_id: string;
  deal_reference: string;
  deal_title: string;
  active_notices_count: number;
  has_expired_notice: boolean;
  notices: LegalNoticeApi[];
}

export interface LegalNoticesManagerProps {
  dealId: string;
  dealReference?: string;
  dealTitle?: string;
  userRole?: 'authority' | 'operator' | 'central_admin';
  readOnly?: boolean;
  className?: string;
  onNoticesUpdated?: (count: number) => void;
}

export const LegalNoticesManager: React.FC<LegalNoticesManagerProps> = ({
  dealId,
  dealReference = '',
  dealTitle = '',
  userRole = 'authority',
  readOnly = false,
  className = '',
  onNoticesUpdated,
}) => {
  const { t, lang, dir } = useI18n();
  const isAr = lang === 'ar';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [notices, setNotices] = useState<LegalNoticeApi[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [hasExpired, setHasExpired] = useState(false);

  // Issue Notice Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formType, setFormType] = useState<'delay' | 'quality' | 'abandonment' | 'non_compliance'>('delay');
  const [formRef, setFormRef] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formDays, setFormDays] = useState('15');
  const [formPdf, setFormPdf] = useState<File | null>(null);
  const [formError, setFormError] = useState('');

  // Resolve Notice Modal
  const [resolvingNotice, setResolvingNotice] = useState<LegalNoticeApi | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Operator Justification Modal
  const [justifyingNotice, setJustifyingNotice] = useState<LegalNoticeApi | null>(null);
  const [justificationText, setJustificationText] = useState('');
  const [justificationFile, setJustificationFile] = useState<File | null>(null);
  const [isJustifying, setIsJustifying] = useState(false);

  // Operator View Justification Modal
  const [viewingJustification, setViewingJustification] = useState<LegalNoticeApi | null>(null);

  // Acknowledging State
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const loadNotices = useCallback(async () => {
    if (!dealId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get<DealLegalNoticesResponseApi>(`/execution/deals/${dealId}/notices/`);
      const list = res.notices || [];
      setNotices(list);
      setActiveCount(res.active_notices_count || 0);
      setHasExpired(res.has_expired_notice || false);
      if (onNoticesUpdated) {
        onNoticesUpdated(res.active_notices_count || 0);
      }
    } catch (err: any) {
      // Fallback to procurements path if needed
      try {
        const fallback = await api.get<DealLegalNoticesResponseApi>(`/procurements/deals/${dealId}/notices/`);
        const list = fallback.notices || [];
        setNotices(list);
        setActiveCount(fallback.active_notices_count || 0);
        setHasExpired(fallback.has_expired_notice || false);
        if (onNoticesUpdated) {
          onNoticesUpdated(fallback.active_notices_count || 0);
        }
      } catch (e: any) {
        setError(e?.message || err?.message || 'تعذر تحميل سجل الاعذارات القانونية');
      }
    } finally {
      setLoading(false);
    }
  }, [dealId, onNoticesUpdated]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  // Template generator helper
  const handleGenerateTemplate = (templateLang: 'ar' | 'fr') => {
    const days = formDays || '15';
    const ref = dealReference || 'الصفقة المعنية';
    const title = dealTitle || 'المشروع';

    if (templateLang === 'ar') {
      let specificReason = '';
      if (formType === 'delay') {
        specificReason = 'تسجيل تأخر فادح وغير مبرر في وتيرة الإنجاز الميداني مقارنة بالجدول الزمني التعاقدي المعتمد، مما يهدد إتمام المشروع في آجاله.';
      } else if (formType === 'quality') {
        specificReason = 'عدم مطابقة المواد والأشغال المنجزة للمواصفات التقنية ومعايير الجودة المنصوص عليها في دفتر الشروط.';
      } else if (formType === 'abandonment') {
        specificReason = 'التوقف الكلي وغير المبرر للأشغال وشغور الورشة من العتاد والموارد البشرية اللازمة لمواصلة الإنجاز.';
      } else {
        specificReason = 'عدم الامتثال للأوامر المصلحية والتعليمات الموجهة إليكم من طرف المصلحة المتعاقدة وهيئة المتابعة.';
      }

      setFormReason(
        `بناءً على أحكام المرسوم الرئاسي رقم 15-247 المنظم للصفقات العمومية وتفويضات المرفق العام (لا سيما المادتين 147 و148 المتعلقة بالآجال وغرامات التأخير والفسخ)، والقانون رقم 23-12 المحدد للقواعد العامة للصفقات العمومية (لا سيما المادة 67 الخاصة بالإخطارات الرسمية)؛\n\n` +
        `وبناءً على المعاينات الميدانية وتقارير المتابعة الدورية الخاصة بالصفقة رقم ${ref} المتعلقة بمشروع "${title}"، نوجه إليكم هذا الإعذار الرسمي لتسجيل:\n` +
        `• ${specificReason}\n\n` +
        `وعليه، نوجه إليكم أمراً صريحاً لتدارك الوضعية التعاقدية واستئناف وتيرة الإنجاز بالشكل المطابق، وذلك في أجل أقصاه ${days} يوماً ابتداءً من تاريخ التبليغ بهذا الإعذار.\n\n` +
        `وفي حال انقضاء هذه المهلة القانونية دون تدارك الوضع أو تقديم تبريرات مقبولة، ستطبق ضدكم الإجراءات القانونية والمالية الردعية، بما فيها فرض غرامات التأخير اليومية والفسخ على عاتقكم.`
      );
    } else {
      let specificReasonFr = '';
      if (formType === 'delay') {
        specificReasonFr = "Constat d'un retard injustifié et préjudiciable dans le rythme d'avancement des travaux par rapport au planning contractuel.";
      } else if (formType === 'quality') {
        specificReasonFr = "Non-conformité des prestations et des matériaux aux spécifications techniques et aux normes du cahier des charges.";
      } else if (formType === 'abandonment') {
        specificReasonFr = "Abandon injustifié du chantier et démobilisation constatée des moyens matériels et humains.";
      } else {
        specificReasonFr = "Inobservation répétée des ordres de service et des instructions de chantier émises par le service contractant.";
      }

      setFormReason(
        `Vu le Décret Présidentiel n° 15-247 portant réglementation des marchés publics, notamment les articles 147 et 148 ;\n` +
        `Vu la Loi n° 23-12 fixant les règles générales relatives aux marchés publics (notamment l'Art. 67) ;\n\n` +
        `Suite aux constats contradictoires et rapports de suivi relatifs au marché N° ${ref} ("${title}") :\n` +
        `• ${specificReasonFr}\n\n` +
        `En conséquence, vous êtes mis en demeure de prendre toutes les mesures nécessaires pour régulariser votre situation dans un délai impératif de ${days} jours à compter de la date de notification de la présente.\n\n` +
        `Faute par vous de vous conformer à ces directives dans le délai imparti, il sera fait application à votre encontre des sanctions prévues par la réglementation en vigueur, notamment l'application des pénalités de retard journalières et la résiliation du marché à vos torts exclusifs.`
      );
    }
  };

  // Submit Issue Notice
  const handleIssueNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formReason.trim()) {
      setFormError('يرجى كتابة نص الإعذار والحيثيات القانونية أو توليدها من القالب الرسمي.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('deal', dealId);
      formData.append('notice_type', formType);
      formData.append('reason', formReason.trim());
      formData.append('legal_deadline_days', formDays || '15');
      if (formRef.trim()) {
        formData.append('reference', formRef.trim());
      }
      if (formPdf) {
        formData.append('document_pdf', formPdf);
      }

      await api.post(`/execution/deals/${dealId}/notices/`, formData);
      setSuccessMsg('تم إصدار الإعذار القانوني وتبليغه رسمياً عبر المنصة بنجاح.');
      setIsCreateOpen(false);
      setFormRef('');
      setFormReason('');
      setFormDays('15');
      setFormPdf(null);
      await loadNotices();
    } catch (err: any) {
      setFormError(err?.message || 'تعذر إصدار الإعذار القانوني.');
    } finally {
      setSubmitting(false);
    }
  };

  // Operator Acknowledge Notice
  const handleAcknowledge = async (noticeId: string) => {
    setAcknowledgingId(noticeId);
    setError('');
    try {
      await api.patch(`/execution/notices/${noticeId}/acknowledge/`, {});
      setSuccessMsg('تم تأكيد استلام الإعذار القانوني وتسجيل الإقرار الإلكتروني وفق المادة 67.');
      await loadNotices();
    } catch (err: any) {
      setError(err?.message || 'تعذر تسجيل الإقرار بالاستلام.');
    } finally {
      setAcknowledgingId(null);
    }
  };

  // Authority Resolve Notice
  const handleResolveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingNotice) return;
    setIsResolving(true);
    try {
      await api.patch(`/execution/notices/${resolvingNotice.id}/resolve/`, {
        notes: resolutionNotes.trim() || 'تم استدراك التأخر وتصحيح الوضعية التعاقدية ميدانياً.',
      });
      setSuccessMsg(`تمت تسوية الإعذار ${resolvingNotice.reference} ورفع الإنذار بنجاح.`);
      setResolvingNotice(null);
      setResolutionNotes('');
      await loadNotices();
    } catch (err: any) {
      setError(err?.message || 'تعذر تسوية الإعذار.');
    } finally {
      setIsResolving(false);
    }
  };

  // Operator Submit Justification
  const handleJustificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justifyingNotice) return;
    if (!justificationText.trim() && !justificationFile) {
      setError('يرجى كتابة المبررات التعاقدية أو إرفاق ملف PDF للرد.');
      return;
    }
    setIsJustifying(true);
    try {
      const formData = new FormData();
      if (justificationText.trim()) {
        formData.append('operator_justification', justificationText.trim());
      }
      if (justificationFile) {
        formData.append('operator_justification_file', justificationFile);
      }

      await api.post(`/execution/notices/${justifyingNotice.id}/justification/`, formData);
      setSuccessMsg('تم تقديم تبريراتكم بنجاح للمصلحة المتعاقدة.');
      setJustifyingNotice(null);
      setJustificationText('');
      setJustificationFile(null);
      await loadNotices();
    } catch (err: any) {
      setError(err?.message || 'تعذر إرسال التبريرات.');
    } finally {
      setIsJustifying(false);
    }
  };

  // Download PDF helper
  const handleDownloadPdf = (noticeId: string, reference: string) => {
    window.open(`/api/execution/notices/${noticeId}/pdf/`, '_blank');
  };

  return (
    <div className={`space-y-6 ${className}`} dir={dir}>
      {/* Alert banner if expired notice exists */}
      {hasExpired && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-950 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldAlert className="size-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-rose-900">
                {t('execution.notices.status.expired') || 'إعذار قانوني منتهي المهلة — غرامات تأخير مطبقة'}
              </h4>
              <p className="text-xs text-rose-800 mt-0.5">
                تجاوز المتعامل المهلة القانونية المحددة في الإعذار الرسمي (المادة 147 من المرسوم الرئاسي 15-247). الغرامة اليومية سارية بنسبة 1/1000 يومياً.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-rose-200 text-rose-900 text-xs font-bold rounded-full">
              إجراء ردعي ساري
            </span>
          </div>
        </div>
      )}

      {/* Header & Metric Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {t('execution.notices.title') || 'الاعذارات القانونية وإدارة التأخيرات (Mises en Demeure)'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                  {notices.length} إعذار
                </span>
                {activeCount > 0 && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                    {activeCount} نشط
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                تتبع الإعذارات الرسمية والمهل القانونية (15 يوماً) واحتساب غرامات التأخير التلقائية وفقاً للمرسوم الرئاسي 15-247 والمادة 67 من القانون 23-12.
              </p>
            </div>
          </div>

          {!readOnly && (userRole === 'authority' || userRole === 'central_admin') && (
            <Button
              type="button"
              onClick={() => {
                setIsCreateOpen(true);
                setFormError('');
              }}
              className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs gap-1.5 shadow-sm shrink-0"
            >
              <Send className="size-3.5" />
              <span>{t('execution.notices.issue') || 'إصدار إعذار رسمي'}</span>
            </Button>
          )}
        </div>

        {/* Global Messages */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
              <X className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Notices Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="size-7 animate-spin text-red-600" />
            <span className="text-xs">جاري تحميل سجل الاعذارات القانونية والمهل...</span>
          </div>
        ) : notices.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <FileCheck2 className="size-10 text-emerald-500/70" />
            <p className="text-sm font-bold text-slate-700">لا توجد اعذارات قانونية مسجلة لهذه الصفقة</p>
            <p className="text-xs text-slate-500 max-w-sm text-center">
              سير الأشغال والأداء التعاقدي منتظم ولم يتم إصدار أي إعذار رسمي لتدارك التأخر أو المخالفات.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3 text-start">المرجع والتاريخ</th>
                  <th className="p-3 text-start">طبيعة المخالفة</th>
                  <th className="p-3 text-start">الحيثيات والسبب</th>
                  <th className="p-3 text-center">المهلة والعداد التنازلي</th>
                  <th className="p-3 text-center">الوضعية القانونية</th>
                  <th className="p-3 text-center">غرامة التأخير</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notices.map((n) => {
                  const isExp = n.is_expired || n.status === 'expired';
                  const isResolved = n.status === 'resolved';
                  const penaltyNum = Number(n.penalty_amount || 0);

                  return (
                    <tr key={n.id} className={`hover:bg-slate-50/70 transition-colors ${isExp ? 'bg-rose-50/30' : ''}`}>
                      {/* Reference & Date */}
                      <td className="p-3">
                        <div className="font-mono font-bold text-slate-900">{n.reference}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Calendar className="size-3" />
                          <span>تاريخ التبليغ: {formatDate(n.issued_date)}</span>
                        </div>
                      </td>

                      {/* Notice Type */}
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {n.notice_type_display || n.notice_type}
                        </span>
                      </td>

                      {/* Reason */}
                      <td className="p-3 max-w-[260px]">
                        <p className="line-clamp-2 text-slate-700 text-xs" title={n.reason}>
                          {n.reason}
                        </p>
                        {n.operator_justification && (
                          <button
                            type="button"
                            onClick={() => setViewingJustification(n)}
                            className="mt-1 text-[10px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 underline underline-offset-2"
                          >
                            <FileText className="size-3" />
                            <span>تم إيداع دفوعات المتعامل (معاينة)</span>
                          </button>
                        )}
                      </td>

                      {/* Countdown & Deadline */}
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {isResolved ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="size-3 text-emerald-700" />
                              <span>تمت التسوية</span>
                            </span>
                          ) : isExp ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 animate-pulse">
                              <AlertCircle className="size-3 text-rose-700" />
                              <span>انتهت المهلة (تأخير)</span>
                            </span>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                              n.days_remaining <= 5
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                                : 'bg-blue-50 text-blue-900 border border-blue-200'
                            }`}>
                              <Clock className="size-3" />
                              <span>{t('execution.notices.countdown', { count: n.days_remaining }) || `متبقي ${n.days_remaining} يوماً`}</span>
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            المهلة: {n.legal_deadline_days} يوماً (حتى {formatDate(n.deadline_date)})
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          n.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : n.status === 'expired'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : n.status === 'acknowledged'
                            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {n.status_display || n.status}
                        </span>
                        {n.acknowledged_at && (
                          <div className="text-[10px] text-slate-400 mt-0.5" title={`مستلم من: ${n.acknowledged_by_name || ''}`}>
                            تم الإقرار: {formatDate(n.acknowledged_at)}
                          </div>
                        )}
                      </td>

                      {/* Penalty Amount */}
                      <td className="p-3 text-center">
                        {penaltyNum > 0 ? (
                          <div className="font-mono font-bold text-rose-700 text-xs">
                            {formatCurrency(penaltyNum)}
                            <div className="text-[9px] font-normal text-slate-500">
                              (1/1000 يومياً م 147)
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Operator: Acknowledge */}
                          {userRole === 'operator' && n.status === 'issued' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcknowledge(n.id)}
                              disabled={acknowledgingId === n.id}
                              className="h-7 text-[11px] font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                              title="إقرار رسمي باستلام هذا الإعذار وفق المادة 67"
                            >
                              {acknowledgingId === n.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Check className="size-3" />
                              )}
                              <span>إقرار بالاستلام</span>
                            </Button>
                          )}

                          {/* Operator: Submit Justifications */}
                          {userRole === 'operator' && !isResolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setJustifyingNotice(n);
                                setJustificationText(n.operator_justification || '');
                              }}
                              className="h-7 text-[11px] font-bold text-sky-700 border-sky-200 hover:bg-sky-50"
                              title="تقديم تبريرات ودفوعات رسمية للمصلحة المتعاقدة"
                            >
                              <Send className="size-3" />
                              <span>{n.operator_justification ? 'تعديل التبريرات' : 'تقديم تبريرات'}</span>
                            </Button>
                          )}

                          {/* Authority: Resolve Notice */}
                          {(userRole === 'authority' || userRole === 'central_admin') && !isResolved && !readOnly && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setResolvingNotice(n);
                                setResolutionNotes('');
                              }}
                              className="h-7 text-[11px] font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                              title="تسوية الإعذار بعد تدارك المتعامل للتأخر ميدانياً"
                            >
                              <CheckCircle2 className="size-3" />
                              <span>تسوية الإعذار</span>
                            </Button>
                          )}

                          {/* Download PDF */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadPdf(n.id, n.reference)}
                            className="h-7 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                            title="تحميل وثيقة الإعذار الرسمية PDF"
                          >
                            <Download className="size-3" />
                            <span>PDF</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          Modal: Create / Issue Legal Notice (Authority)
         ══════════════════════════════════════════════════════════════════ */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <ShieldAlert className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {t('execution.notices.issue') || 'إصدار إعذار قانوني رسمي (Mise en Demeure)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    تبليغ رسمي إلكتروني ملزم قانوناً وفقاً للمرسوم 15-247 والمادة 67 من القانون 23-12
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="size-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleIssueNotice} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Notice Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">طبيعة الإعذار والمخالفة *</Label>
                  <select
                    value={formType}
                    onChange={(e: any) => setFormType(e.target.value)}
                    className="w-full text-xs font-semibold rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="delay">تأخر في وتيرة التنفيذ والإنجاز</option>
                    <option value="quality">إخلال بمعايير الجودة ودفتر الشروط</option>
                    <option value="abandonment">توقف غير مبرر للورشة والأشغال</option>
                    <option value="non_compliance">عدم الامتثال للأوامر المصلحية والتعليمات</option>
                  </select>
                </div>

                {/* Legal Deadline Days */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">المهلة القانونية الممنوحة (بالأيام) *</Label>
                  <Input
                    type="number"
                    min="1"
                    max="90"
                    value={formDays}
                    onChange={(e) => setFormDays(e.target.value)}
                    className="text-xs font-mono font-bold"
                    placeholder="15"
                  />
                  <span className="text-[10px] text-slate-500">المهلة النموذجية القانونية: 15 يوماً</span>
                </div>
              </div>

              {/* Reference */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">رقم الإعذار الرسمي (اختياري، يولد تلقائياً)</Label>
                <Input
                  type="text"
                  value={formRef}
                  onChange={(e) => setFormRef(e.target.value)}
                  className="text-xs font-mono"
                  placeholder="مثال: MD-2026-DZ-001"
                />
              </div>

              {/* Template generator buttons */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-amber-600" />
                    <span>المولد الذكي لنصوص الإعذار الرسمي (وفق المرسوم 15-247):</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateTemplate('ar')}
                      className="h-6 text-[11px] font-bold text-slate-700 border-slate-300 hover:bg-slate-100"
                    >
                      توليد النص بالعربية
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateTemplate('fr')}
                      className="h-6 text-[11px] font-bold text-slate-700 border-slate-300 hover:bg-slate-100"
                    >
                      Générer en Français
                    </Button>
                  </div>
                </div>
              </div>

              {/* Reason / Full Legal Text */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">نص الإعذار والحيثيات القانونية والتقنية *</Label>
                <Textarea
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  rows={6}
                  className="text-xs leading-relaxed font-sans"
                  placeholder="أدخل حيثيات الإعذار، المخالفات المعاينة ميدانياً، والإنذارات الموجهة للمتعامل..."
                  required
                />
              </div>

              {/* PDF Document Attachment */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">محضر المعاينة الميدانية أو وثيقة الإعذار (اختياري PDF)</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFormPdf(e.target.files?.[0] || null)}
                  className="text-xs file:bg-slate-100 file:border-0 file:rounded-md file:text-xs file:font-bold file:px-2"
                />
              </div>

              {/* Deterrent Reminder */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 flex items-start gap-2">
                <Info className="size-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">أثر التبليغ الرقمي:</span> يُعتد بهذا الإعذار كإشعار رسمي نافذ بمجرد التبليغ عبر المنصة (المادة 67). في حال عدم التدارك خلال {formDays || 15} يوماً، تُطبّق تلقائياً غرامات التأخير اليومية بنسبة 1/1000 من قيمة الصفقة (سقف 10% بموجب المادة 147).
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={submitting}
                  className="text-xs"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs gap-1.5 shadow-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>جاري الإصدار والتبليغ...</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" />
                      <span>إصدار الإعذار وتبليغه رسمياً</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Modal: Resolve Notice (Authority)
         ══════════════════════════════════════════════════════════════════ */}
      {resolvingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  تسوية الإعذار القانوني رقم {resolvingNotice.reference}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResolvingNotice(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              تأكيد استدراك المتعامل الاقتصادي للتأخر المسجل وتصحيحه للمخالفات ميدانياً. سيتم إغلاق الإعذار ووقف أي احتساب إضافي لغرامات التأخير.
            </p>

            <form onSubmit={handleResolveNotice} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">ملاحظات وتقرير التسوية الميدانية *</Label>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={4}
                  className="text-xs"
                  placeholder="مثال: بناءً على محضر المعاينة المؤرخ في ...، تم استدراك وتيرة الأشغال وتصحيح العيوب بالكامل."
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResolvingNotice(null)}
                  disabled={isResolving}
                  className="text-xs"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isResolving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                >
                  {isResolving ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  <span>تأكيد التسوية ورفع الإعذار</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Modal: Submit Justifications (Operator)
         ══════════════════════════════════════════════════════════════════ */}
      {justifyingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Send className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  تقديم دفوعات وتبريرات بخصوص الإعذار {justifyingNotice.reference}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setJustifyingNotice(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              يمكنك كتابة أسباب وتبريرات التأخر (ظروف طارئة، أوامر توقيف، إلخ) وإرفاق ملف PDF للرد الرسمي على المصلحة المتعاقدة.
            </p>

            <form onSubmit={handleJustificationSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">التبريرات والدفوعات التعاقدية *</Label>
                <Textarea
                  value={justificationText}
                  onChange={(e) => setJustificationText(e.target.value)}
                  rows={4}
                  className="text-xs"
                  placeholder="اكتب التبريرات والمستندات الداعمة لموقفك التعاقدي..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">ملف التبريرات الرسمي (PDF اختياري)</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setJustificationFile(e.target.files?.[0] || null)}
                  className="text-xs file:bg-slate-100 file:border-0 file:rounded-md file:text-xs file:font-bold file:px-2"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setJustifyingNotice(null)}
                  disabled={isJustifying}
                  className="text-xs"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isJustifying}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                >
                  {isJustifying ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  <span>إرسال التبريرات للمصلحة</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          Modal: View Operator Justifications (Both)
         ══════════════════════════════════════════════════════════════════ */}
      {viewingJustification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">
                  دفوعات المتعامل للإعذار {viewingJustification.reference}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingJustification(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-[11px] text-slate-500">
                تاريخ تقديم التبريرات: {formatDate(viewingJustification.justification_submitted_at)}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {viewingJustification.operator_justification || 'لا يوجد نص مكتوب.'}
              </div>
              {viewingJustification.operator_justification_file && (
                <a
                  href={viewingJustification.operator_justification_file}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200"
                >
                  <Download className="size-3.5" />
                  <span>تحميل ملف التبريرات المرفق (PDF)</span>
                </a>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewingJustification(null)}
                className="text-xs"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
