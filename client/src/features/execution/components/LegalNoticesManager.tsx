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
      const payload = res.data;
      const list = payload.notices || [];
      setNotices(list);
      setActiveCount(payload.active_notices_count || 0);
      setHasExpired(payload.has_expired_notice || false);
      if (onNoticesUpdated) {
        onNoticesUpdated(payload.active_notices_count || 0);
      }
    } catch (err: any) {
      // Fallback to procurements path if needed
      try {
        const fallback = await api.get<DealLegalNoticesResponseApi>(`/procurements/deals/${dealId}/notices/`);
        const payload = fallback.data;
        const list = payload.notices || [];
        setNotices(list);
        setActiveCount(payload.active_notices_count || 0);
        setHasExpired(payload.has_expired_notice || false);
        if (onNoticesUpdated) {
          onNoticesUpdated(payload.active_notices_count || 0);
        }
      } catch (e: any) {
        setError(e?.message || err?.message || (isAr ? 'تعذر تحميل سجل الاعذارات القانونية' : 'Impossible de charger le registre des mises en demeure'));
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
    const ref = dealReference || (isAr ? 'الصفقة المعنية' : 'le marché concerné');
    const title = dealTitle || (isAr ? 'المشروع' : 'le projet');

    if (templateLang === 'ar') {
      let specificReason = '';
      if (formType === 'delay') {
        specificReason = isAr ? 'تسجيل تأخر فادح وغير مبرر في وتيرة الإنجاز الميداني مقارنة بالجدول الزمني التعاقدي المعتمد، مما يهدد إتمام المشروع في آجاله.' : 'Retard important et injustifié constaté dans le rythme d’exécution par rapport au planning contractuel approuvé, compromettant l’achèvement des prestations dans les délais.';
      } else if (formType === 'quality') {
        specificReason = isAr ? 'عدم مطابقة المواد والأشغال المنجزة للمواصفات التقنية ومعايير الجودة المنصوص عليها في دفتر الشروط.' : 'Non-conformité des matériaux et prestations exécutées aux prescriptions techniques et normes de qualité stipulées au cahier des charges.';
      } else if (formType === 'abandonment') {
        specificReason = isAr ? 'التوقف الكلي وغير المبرر للأشغال وشغور الورشة من العتاد والموارد البشرية اللازمة لمواصلة الإنجاز.' : 'Arrêt total et injustifié des travaux et abandon du chantier sans moyens matériels ou humains nécessaires à la poursuite des prestations.';
      } else {
        specificReason = isAr ? 'عدم الامتثال للأوامر المصلحية والتعليمات الموجهة إليكم من طرف المصلحة المتعاقدة وهيئة المتابعة.' : 'Inobservation des ordres de service et instructions notifiés par le service contractant et l’organisme de suivi.';
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
      setFormError(isAr ? 'يرجى كتابة نص الإعذار والحيثيات القانونية أو توليدها من القالب الرسمي.' : 'Veuillez saisir le texte de la mise en demeure ou le générer à partir du modèle.');
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
      setSuccessMsg(isAr ? 'تم إصدار الإعذار القانوني وتبليغه رسمياً عبر المنصة بنجاح.' : 'Mise en demeure établie et notifiée officiellement avec succès.');
      setIsCreateOpen(false);
      setFormRef('');
      setFormReason('');
      setFormDays('15');
      setFormPdf(null);
      await loadNotices();
    } catch (err: any) {
      setFormError(err?.message || (isAr ? 'تعذر إصدار الإعذار القانوني.' : 'Impossible d’émettre la mise en demeure.'));
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
      setSuccessMsg(isAr ? 'تم تأكيد استلام الإعذار القانوني وتسجيل الإقرار الإلكتروني وفق المادة 67.' : 'Accusé de réception électronique confirmé conformément à l’article 67.');
      await loadNotices();
    } catch (err: any) {
      setError(err?.message || (isAr ? 'تعذر تسجيل الإقرار بالاستلام.' : 'Impossible d’enregistrer l’accusé de réception.'));
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
        notes: resolutionNotes.trim() || (isAr ? 'تم استدراك التأخر وتصحيح الوضعية التعاقدية ميدانياً.' : 'Régularisation effective du retard et conformité constatée sur site.'),
      });
      setSuccessMsg(isAr ? `تمت تسوية الإعذار ${resolvingNotice.reference} ورفع الإنذار بنجاح.` : `Mise en demeure ${resolvingNotice.reference} levée avec succès.`);
      setResolvingNotice(null);
      setResolutionNotes('');
      await loadNotices();
    } catch (err: any) {
      setError(err?.message || (isAr ? 'تعذر تسوية الإعذار.' : 'Impossible de lever la mise en demeure.'));
    } finally {
      setIsResolving(false);
    }
  };

  // Operator Submit Justification
  const handleJustificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justifyingNotice) return;
    if (!justificationText.trim() && !justificationFile) {
      setError(isAr ? 'يرجى كتابة المبررات التعاقدية أو إرفاق ملف PDF للرد.' : 'Veuillez saisir vos justifications ou joindre un fichier PDF de réponse.');
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
      setSuccessMsg(isAr ? 'تم تقديم تبريراتكم بنجاح للمصلحة المتعاقدة.' : 'Justifications transmises avec succès au service contractant.');
      setJustifyingNotice(null);
      setJustificationText('');
      setJustificationFile(null);
      await loadNotices();
    } catch (err: any) {
      setError(err?.message || (isAr ? 'تعذر إرسال التبريرات.' : 'Impossible d’envoyer les justifications.'));
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
                {isAr ? "تجاوز المتعامل المهلة القانونية المحددة في الإعذار الرسمي (المادة 147 من المرسوم الرئاسي 15-247). الغرامة اليومية سارية بنسبة 1/1000 يومياً." : "Dépassement du délai légal imparti par la mise en demeure (Art. 147 du décret 15-247). Pénalités de retard applicables à raison de 1/1000 par jour."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-rose-200 text-rose-900 text-xs font-bold rounded-full">
              {isAr ? "إجراء ردعي ساري" : "Mesure coercitive active"}
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
                  {notices.length} {isAr ? "إعذار" : "mise(s) en demeure"}
                </span>
                {activeCount > 0 && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                    {activeCount} {isAr ? "نشط" : "active(s)"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr ? "تتبع الإعذارات الرسمية والمهل القانونية (15 يوماً) واحتساب غرامات التأخير التلقائية وفقاً للمرسوم الرئاسي 15-247 والمادة 67 من القانون 23-12." : "Suivi des mises en demeure réglementaires (délai de 15 jours) et calcul automatique des pénalités selon le décret 15-247 et l’article 67 de la loi 23-12."}
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
            <span className="text-xs">{isAr ? "جاري تحميل سجل الاعذارات القانونية والمهل..." : "Chargement du registre des mises en demeure..."}</span>
          </div>
        ) : notices.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <FileCheck2 className="size-10 text-emerald-500/70" />
            <p className="text-sm font-bold text-slate-700">{isAr ? "لا توجد اعذارات قانونية مسجلة لهذه الصفقة" : "Aucune mise en demeure enregistrée pour ce marché"}</p>
            <p className="text-xs text-slate-500 max-w-sm text-center">
              {isAr ? "سير الأشغال والأداء التعاقدي منتظم ولم يتم إصدار أي إعذار رسمي لتدارك التأخر أو المخالفات." : "Le déroulement des prestations est régulier. Aucune mise en demeure n’a été notifiée."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3 text-start">{isAr ? "المرجع والتاريخ" : "Référence et Date"}</th>
                  <th className="p-3 text-start">{isAr ? "طبيعة المخالفة" : "Nature du manquement"}</th>
                  <th className="p-3 text-start">{isAr ? "الحيثيات والسبب" : "Motifs et constats"}</th>
                  <th className="p-3 text-center">{isAr ? "المهلة والعداد التنازلي" : "Délai et décompte"}</th>
                  <th className="p-3 text-center">{isAr ? "الوضعية القانونية" : "Statut légal"}</th>
                  <th className="p-3 text-center">{isAr ? "غرامة التأخير" : "Pénalité de retard"}</th>
                  <th className="p-3 text-center">{isAr ? "الإجراءات" : "Actions"}</th>
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
                          <span>{isAr ? "تاريخ التبليغ:" : "Notifié le :"} {formatDate(n.issued_date)}</span>
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
                            <span>{isAr ? "تم إيداع دفوعات المتعامل (معاينة)" : "Mémoire en défense déposé (consulter)"}</span>
                          </button>
                        )}
                      </td>

                      {/* Countdown & Deadline */}
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {isResolved ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="size-3 text-emerald-700" />
                              <span>{isAr ? "تمت التسوية" : "Levée"}</span>
                            </span>
                          ) : isExp ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 animate-pulse">
                              <AlertCircle className="size-3 text-rose-700" />
                              <span>{isAr ? "انتهت المهلة (تأخير)" : "Délai expiré (Pénalités)"}</span>
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
                            {isAr ? `المهلة: ${n.legal_deadline_days} يوماً (حتى ${formatDate(n.deadline_date)})` : `Délai : ${n.legal_deadline_days} j (jusqu au ${formatDate(n.deadline_date)})`}
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
                          <div className="text-[10px] text-slate-400 mt-0.5" title={isAr ? `مستلم من: ${n.acknowledged_by_name || ''}` : `Accusé par : ${n.acknowledged_by_name || ''}`}>
                            {isAr ? "تم الإقرار:" : "Accusé le :"} {formatDate(n.acknowledged_at)}
                          </div>
                        )}
                      </td>

                      {/* Penalty Amount */}
                      <td className="p-3 text-center">
                        {penaltyNum > 0 ? (
                          <div className="font-mono font-bold text-rose-700 text-xs">
                            {formatCurrency(penaltyNum)}
                            <div className="text-[9px] font-normal text-slate-500">
                              (1/1000 j art. 147)
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
                              title={isAr ? "إقرار رسمي باستلام هذا الإعذار وفق المادة 67" : "Accusé de réception officiel (Art. 67)"}
                            >
                              {acknowledgingId === n.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Check className="size-3" />
                              )}
                              <span>{isAr ? "إقرار بالاستلام" : "Accuser réception"}</span>
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
                              title={isAr ? "تقديم تبريرات ودفوعات رسمية للمصلحة المتعاقدة" : "Fournir des justifications au service contractant"}
                            >
                              <Send className="size-3" />
                              <span>{n.operator_justification ? (isAr ? 'تعديل التبريرات' : 'Modifier les justifications') : (isAr ? 'تقديم تبريرات' : 'Fournir justifications')}</span>
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
                              title={isAr ? "تسوية الإعذار بعد تدارك المتعامل للتأخر ميدانياً" : "Levée de la mise en demeure après régularisation"}
                            >
                              <CheckCircle2 className="size-3" />
                              <span>{isAr ? "تسوية الإعذار" : "Lever la mise en demeure"}</span>
                            </Button>
                          )}

                          {/* Download PDF */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadPdf(n.id, n.reference)}
                            className="h-7 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                            title={isAr ? "تحميل وثيقة الإعذار الرسمية PDF" : "Télécharger la mise en demeure officielle (PDF)"}
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
                    {isAr ? "تبليغ رسمي إلكتروني ملزم قانوناً وفقاً للمرسوم 15-247 والمادة 67 من القانون 23-12" : "Notification électronique officielle conforme au décret 15-247 et à l’article 67 de la loi 23-12"}
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
                  <Label className="text-xs font-bold text-slate-700">{isAr ? "طبيعة الإعذار والمخالفة *" : "Objet de la mise en demeure *"}</Label>
                  <select
                    value={formType}
                    onChange={(e: any) => setFormType(e.target.value)}
                    className="w-full text-xs font-semibold rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="delay">{isAr ? "تأخر في وتيرة التنفيذ والإنجاز" : "Retard dans le rythme d’exécution"}</option>
                    <option value="quality">{isAr ? "إخلال بمعايير الجودة ودفتر الشروط" : "Non-respect des normes de qualité et du cahier des charges"}</option>
                    <option value="abandonment">{isAr ? "توقف غير مبرر للورشة والأشغال" : "Arrêt injustifié du chantier"}</option>
                    <option value="non_compliance">{isAr ? "عدم الامتثال للأوامر المصلحية والتعليمات" : "Inobservation des ordres de service"}</option>
                  </select>
                </div>

                {/* Legal Deadline Days */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">{isAr ? "المهلة القانونية الممنوحة (بالأيام) *" : "Délai imparti pour régulariser (en jours) *"}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="90"
                    value={formDays}
                    onChange={(e) => setFormDays(e.target.value)}
                    className="text-xs font-mono font-bold"
                    placeholder="15"
                  />
                  <span className="text-[10px] text-slate-500">{isAr ? "المهلة النموذجية القانونية: 15 يوماً" : "Délai réglementaire standard : 15 jours"}</span>
                </div>
              </div>

              {/* Reference */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">{isAr ? "رقم الإعذار الرسمي (اختياري، يولد تلقائياً)" : "Réf officielle de la mise en demeure (optionnel)"}</Label>
                <Input
                  type="text"
                  value={formRef}
                  onChange={(e) => setFormRef(e.target.value)}
                  className="text-xs font-mono"
                  placeholder={isAr ? "مثال: MD-2026-DZ-001" : "Ex : MD-2026-DZ-001"}
                />
              </div>

              {/* Template generator buttons */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-amber-600" />
                    <span>{isAr ? "المولد الذكي لنصوص الإعذار الرسمي (وفق المرسوم 15-247):" : "Générateur réglementaire de mise en demeure (Décret 15-247) :"}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateTemplate('ar')}
                      className="h-6 text-[11px] font-bold text-slate-700 border-slate-300 hover:bg-slate-100"
                    >
                      {isAr ? "توليد النص بالعربية" : "Générer en arabe"}
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
                <Label className="text-xs font-bold text-slate-700">{isAr ? "نص الإعذار والحيثيات القانونية والتقنية *" : "Texte et motifs juridiques de la mise en demeure *"}</Label>
                <Textarea
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  rows={6}
                  className="text-xs leading-relaxed font-sans"
                  placeholder={isAr ? "أدخل حيثيات الإعذار، المخالفات المعاينة ميدانياً، والإنذارات الموجهة للمتعامل..." : "Détaillez les motifs de la mise en demeure, constats de chantier..."}
                  required
                />
              </div>

              {/* PDF Document Attachment */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">{isAr ? "محضر المعاينة الميدانية أو وثيقة الإعذار (اختياري PDF)" : "Procès-verbal de constat ou document PDF (optionnel)"}</Label>
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
                  <span className="font-bold">{isAr ? "أثر التبليغ الرقمي:" : "Effet de la notification :"}</span> {isAr ? `يُعتد بهذا الإعذار كإشعار رسمي نافذ بمجرد التبليغ عبر المنصة (المادة 67). في حال عدم التدارك خلال ${formDays || 15} يوماً، تُطبّق تلقائياً غرامات التأخير اليومية بنسبة 1/1000 من قيمة الصفقة (سقف 10% بموجب المادة 147).` : `Cette mise en demeure prend effet dès sa notification (Art. 67). À défaut de régularisation sous ${formDays || 15} jours, des pénalités journalières de 1/1000 s'appliquent (plafonnées à 10% selon l'Art. 147).`}
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
                  {isAr ? "إلغاء" : "Annuler"}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs gap-1.5 shadow-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>{isAr ? "جاري الإصدار والتبليغ..." : "Émission et notification en cours..."}</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" />
                      <span>{isAr ? "إصدار الإعذار وتبليغه رسمياً" : "Émettre et notifier la mise en demeure"}</span>
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
                  {isAr ? `تسوية الإعذار القانوني رقم ${resolvingNotice.reference}` : `Levée de la mise en demeure n° ${resolvingNotice.reference}`}
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
              {isAr ? "تأكيد استدراك المتعامل الاقتصادي للتأخر المسجل وتصحيحه للمخالفات ميدانياً. سيتم إغلاق الإعذار ووقف أي احتساب إضافي لغرامات التأخير." : "Confirmation de la régularisation du retard par l’opérateur sur site. La mise en demeure sera clôturée et le décompte des pénalités suspendu."}
            </p>

            <form onSubmit={handleResolveNotice} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">{isAr ? "ملاحظات وتقرير التسوية الميدانية *" : "Rapport de constat et observations de levée *"}</Label>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={4}
                  className="text-xs"
                  placeholder={isAr ? "مثال: بناءً على محضر المعاينة المؤرخ في ...، تم استدراك وتيرة الأشغال وتصحيح العيوب بالكامل." : "Ex : Vu le PV de constat en date du ..., les travaux ont repris conformément au planning."}
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
                  {isAr ? "إلغاء" : "Annuler"}
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
                  <span>{isAr ? "تأكيد التسوية ورفع الإعذار" : "Confirmer la levée de la mise en demeure"}</span>
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
                  {isAr ? `تقديم دفوعات وتبريرات بخصوص الإعذار ${justifyingNotice.reference}` : `Mémoire en réponse à la mise en demeure n° ${justifyingNotice.reference}`}
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
              {isAr ? "يمكنك كتابة أسباب وتبريرات التأخر (ظروف طارئة، أوامر توقيف، إلخ) وإرفاق ملف PDF للرد الرسمي على المصلحة المتعاقدة." : "Vous pouvez exposer les motifs et justifications du retard (sujétions imprévues, ordres d’arrêt, intempéries) et joindre un mémoire PDF officiel."}
            </p>

            <form onSubmit={handleJustificationSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">{isAr ? "التبريرات والدفوعات التعاقدية *" : "Exposé des motifs et justifications contractuelles *"}</Label>
                <Textarea
                  value={justificationText}
                  onChange={(e) => setJustificationText(e.target.value)}
                  rows={4}
                  className="text-xs"
                  placeholder={isAr ? "اكتب التبريرات والمستندات الداعمة لموقفك التعاقدي..." : "Exposez vos arguments et pièces à l'appui..."}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">{isAr ? "ملف التبريرات الرسمي (PDF اختياري)" : "Mémoire justificatif officiel (PDF optionnel)"}</Label>
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
                  {isAr ? "إلغاء" : "Annuler"}
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
                  <span>{isAr ? "إرسال التبريرات للمصلحة" : "Transmettre les justifications"}</span>
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
                  {isAr ? `دفوعات المتعامل للإعذار ${viewingJustification.reference}` : `Justifications présentées pour la mise en demeure n° ${viewingJustification.reference}`}
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
                {isAr ? "تاريخ تقديم التبريرات:" : "Déposé le :"} {formatDate(viewingJustification.justification_submitted_at)}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {viewingJustification.operator_justification || (isAr ? 'لا يوجد نص مكتوب.' : 'Aucun texte fourni.')}
              </div>
              {viewingJustification.operator_justification_file && (
                <a
                  href={viewingJustification.operator_justification_file}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200"
                >
                  <Download className="size-3.5" />
                  <span>{isAr ? "تحميل ملف التبريرات المرفق (PDF)" : "Télécharger la pièce jointe (PDF)"}</span>
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
                {isAr ? "إغلاق" : "Fermer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
