import React, { useCallback, useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Plus,
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
  Building,
} from 'lucide-react';

export interface AvenantApi {
  id: string;
  deal: string;
  deal_reference?: string;
  deal_title?: string;
  reference: string;
  reason: string;
  amount_change: number | string;
  percentage_impact: number;
  time_extension_days: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  status_display: string;
  committee_approval_ref: string;
  document_pdf: string | null;
  created_at: string;
  approved_at: string | null;
}

export interface DealAvenantsResponseApi {
  deal_id: string;
  deal_reference: string;
  deal_title?: string;
  base_amount: number;
  total_avenant_amount: number;
  total_avenant_percentage: number;
  limit_percentage: number;
  max_limit_percentage: number;
  is_approaching_limit: boolean;
  is_exceeded_limit: boolean;
  results: AvenantApi[];
  avenants?: AvenantApi[];
}

export interface AvenantsManagerProps {
  dealId: string;
  dealReference?: string;
  baseAmount?: number;
  readOnly?: boolean;
  className?: string;
}

export const AvenantsManager: React.FC<AvenantsManagerProps> = ({
  dealId,
  dealReference = '',
  baseAmount = 0,
  readOnly = false,
  className = '',
}) => {
  const { t, lang, dir } = useI18n();
  const isAr = lang === 'ar';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [data, setData] = useState<DealAvenantsResponseApi | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formRef, setFormRef] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDays, setFormDays] = useState('0');
  const [formCommitteeRef, setFormCommitteeRef] = useState('');
  const [formPdf, setFormPdf] = useState<File | null>(null);
  const [formError, setFormError] = useState('');

  // Approval Modal State
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalCommitteeRef, setApprovalCommitteeRef] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const loadAvenants = useCallback(async () => {
    if (!dealId) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get<DealAvenantsResponseApi>(`/procurements/deals/${dealId}/avenants/`);
      setData(response.data);
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { error?: string; detail?: string } } })?.response?.data;
      setError(resp?.error || resp?.detail || (isAr ? 'تعذر تحميل ملاحق الصفقة.' : 'Impossible de charger les avenants du marché.'));
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    void loadAvenants();
  }, [loadAvenants]);

  // Handle Create Avenant Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formReason.trim()) {
      setFormError(isAr ? 'يرجى تحديد سبب ومبرر الملحق التعاقدي.' : 'Veuillez préciser le motif de l’avenant contractuel.');
      return;
    }

    const numAmount = parseFloat(formAmount) || 0;
    const effectiveBase = (data && data.base_amount > 0 ? data.base_amount : baseAmount) || 1;
    const currentTotal = data ? data.total_avenant_amount : 0;
    const projectedTotal = currentTotal + numAmount;
    const projectedPercentage = (projectedTotal / effectiveBase) * 100;

    if (projectedPercentage > 25.0) {
      setFormError(
        isAr ? `ممنوع قانوناً: سيصل مجموع الملاحق إلى ${projectedPercentage.toFixed(1)}% وهو ما يتجاوز الحد الأقصى المطلق (25%) المنصوص عليه في المرسوم الرئاسي 15-247.` : `Légalement interdit : le cumul des avenants atteindra ${projectedPercentage.toFixed(1)}%, dépassant le plafond absolu (25%) fixé par le décret 15-247.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('deal', dealId);
      if (formRef.trim()) formData.append('reference', formRef.trim());
      formData.append('reason', formReason.trim());
      formData.append('amount_change', formAmount || '0');
      formData.append('time_extension_days', formDays || '0');
      if (formCommitteeRef.trim()) formData.append('committee_approval_ref', formCommitteeRef.trim());
      if (formPdf) formData.append('document_pdf', formPdf);

      await api.post(`/procurements/deals/${dealId}/avenants/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccessMsg(isAr ? 'تم إنشاء الملحق التعاقدي بنجاح وإدراجه في جدول المتابعة.' : 'Avenant contractuel créé avec succès et inscrit au suivi.');
      setIsModalOpen(false);
      setFormRef('');
      setFormReason('');
      setFormAmount('');
      setFormDays('0');
      setFormCommitteeRef('');
      setFormPdf(null);
      await loadAvenants();
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (resp && typeof resp === 'object') {
        const firstErr = Object.values(resp)[0];
        if (Array.isArray(firstErr) && firstErr[0]) {
          setFormError(String(firstErr[0]));
        } else if (typeof firstErr === 'string') {
          setFormError(firstErr);
        } else {
          setFormError(isAr ? 'فشل إنشاء الملحق. تأكد من صحة البيانات والحدود القانونية.' : 'Échec de création. Vérifiez la validité des données et les plafonds légaux.');
        }
      } else {
        setFormError(isAr ? 'فشل إنشاء الملحق. تأكد من صحة البيانات.' : 'Échec de création de l’avenant. Vérifiez les données.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Approve Avenant
  const handleApprove = async (avenantId: string) => {
    setIsApproving(true);
    setError('');
    try {
      await api.patch(`/procurements/avenants/${avenantId}/approve/`, {
        committee_approval_ref: approvalCommitteeRef.trim() || undefined,
      });
      setSuccessMsg(isAr ? 'تمت مصادقة لجنة الصفقات على الملحق وتحديث وضعيته رسمياً.' : 'Avenant validé par la commission des marchés et statut actualisé.');
      setApprovingId(null);
      setApprovalCommitteeRef('');
      await loadAvenants();
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { error?: string } } })?.response?.data;
      setError(resp?.error || (isAr ? 'فشلت عملية المصادقة على الملحق.' : 'Échec de la validation de l’avenant.'));
    } finally {
      setIsApproving(false);
    }
  };

  const effectiveBaseAmount = data?.base_amount && data.base_amount > 0 ? data.base_amount : baseAmount;
  const currentTotalAmount = data?.total_avenant_amount || 0;
  const currentRatio = data?.total_avenant_percentage || (effectiveBaseAmount > 0 ? (currentTotalAmount / effectiveBaseAmount) * 100 : 0);
  const isApproaching = currentRatio >= 20.0 && currentRatio < 25.0;
  const isExceeded = currentRatio >= 25.0;

  const avenantsList = data?.results || data?.avenants || [];

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 ${className}`}>
      
      {/* ─── 1. ترويسة قسم الملاحق ومؤشر التحذير القانوني ─── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-cairo">
                {t('authority.deal.avenants.title') || 'الملاحق التعاقدية (Avenants)'}
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {isAr
                  ? 'مراقبة سقف الملاحق وتمديد الآجال وفق المرسوم الرئاسي 15-247 (المادتان 138 و139)'
                  : 'Contrôle des plafonds réglementaires selon le Décret 15-247 (Articles 138-139)'}
              </span>
            </div>
          </div>
        </div>

        {/* مؤشر القياس وزر الإضافة */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          
          {/* مؤشر النسبة المئوية الدائري/الشريطي */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3">
            <div className="text-xs">
              <span className="block font-medium text-slate-500 text-[11px]">
                {t('authority.deal.avenants.current_ratio') || 'نسبة الملاحق الحالية'}:
              </span>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-base font-extrabold font-mono ${
                    isExceeded
                      ? 'text-rose-600'
                      : isApproaching
                      ? 'text-amber-600'
                      : 'text-emerald-700'
                  }`}
                >
                  {currentRatio.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">/ 20% - 25%</span>
              </div>
            </div>

            {/* شريط التقدم الصغير */}
            <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden shrink-0">
              <div
                className={`h-full transition-all duration-500 ${
                  isExceeded
                    ? 'bg-rose-600'
                    : isApproaching
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.min(100, (currentRatio / 25) * 100)}%` }}
              />
            </div>
          </div>

          {/* زر إضافة ملحق */}
          {!readOnly && (
            <Button
              type="button"
              disabled={isExceeded}
              onClick={() => {
                setFormRef(`AV-${String(avenantsList.length + 1).padStart(3, '0')}`);
                setIsModalOpen(true);
              }}
              className={`rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors ${
                isExceeded
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{t('authority.deal.avenants.add') || 'إضافة ملحق'}</span>
            </Button>
          )}

        </div>
      </div>

      {/* ─── 2. تنبيهات الحدود القانونية (Legal Warning Gauges) ─── */}
      {isExceeded && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-900" role="alert">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block text-sm font-bold text-rose-800">
              {t('authority.deal.avenants.warning.exceeded') || 'ممنوع: تجاوزت الحد الأقصى المسموح به قانوناً'}
            </strong>
            <p className="text-rose-700 text-xs font-medium leading-relaxed">
              {isAr
                ? 'تجاوزت النسبة التراكمية لملاحق هذه الصفقة سقف الـ 25% من المبلغ الأصلي. وفقاً للمرسوم الرئاسي 15-247 (المادتان 138-139)، يُمنع منعاً باتاً إبرام أي ملحق مالي إضافي دون مصادقة استثنائية من مجلس الصفقات.'
                : 'Le cumul des avenants a dépassé le plafond légal strict de 25%. Aucun avenant financier supplémentaire ne peut être créé conformément au Décret 15-247.'}
            </p>
          </div>
        </div>
      )}

      {isApproaching && !isExceeded && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900" role="alert">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block text-sm font-bold text-amber-800">
              {t('authority.deal.avenants.warning.approaching') || 'تحذير: أنت تقترب من الحد الأقصى القانوني (20%)'}
            </strong>
            <p className="text-amber-700 text-xs font-medium leading-relaxed">
              {isAr
                ? 'بلغت ملاحق هذه الصفقة نسبة تفوق 20%. يرجى الحرص على استيفاء التأشيرة الصريحة للجنة الصفقات المختصة قبل تنفيذ أي أشغال تكميلية.'
                : 'Le seuil des 20% est atteint. L’autorisation formelle de la commission des marchés est requise.'}
            </p>
          </div>
        </div>
      )}

      {/* رسائل النجاح أو الأخطاء العامة */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── 3. ملخص المبالغ والنسب ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="block font-medium text-slate-500">{isAr ? "المبلغ الأصلي للصفقة:" : "Montant initial du marché :"}</span>
          <strong className="block text-sm font-bold font-mono text-slate-900 mt-1">
            {formatCurrency(effectiveBaseAmount)}
          </strong>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="block font-medium text-slate-500">{isAr ? "مجموع الأثر المالي للملاحق:" : "Incidence financière cumulée :"}</span>
          <strong
            className={`block text-sm font-bold font-mono mt-1 ${
              currentTotalAmount >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatCurrency(currentTotalAmount)}
          </strong>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="block font-medium text-slate-500">{isAr ? "الحد الأقصى المسموح به (20% / 25%):" : "Plafond légal autorisé (20% / 25%) :"}</span>
          <strong className="block text-sm font-bold font-mono text-slate-800 mt-1">
            {formatCurrency(effectiveBaseAmount * 0.2)} — {formatCurrency(effectiveBaseAmount * 0.25)}
          </strong>
        </div>
      </div>

      {/* ─── 4. جدول الملاحق التعاقدية ─── */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
          <span className="text-xs font-medium">{isAr ? "جاري تحميل بيانات الملاحق..." : "Chargement des avenants..."}</span>
        </div>
      ) : avenantsList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-2">
          <FileText className="mx-auto h-8 w-8 text-slate-300" />
          <h4 className="text-sm font-bold text-slate-800">
            {t('operator.contracts.no_avenants') || 'لا توجد ملاحق تعاقدية مسجلة لهذه الصفقة'}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isAr
              ? 'تخضع التعديلات التعاقدية على الكميات أو الآجال للمرسوم 15-247 ويمكن إنشاؤها وتوثيقها فوراً من خلال هذا التبويب.'
              : 'Les modifications contractuelles relatives aux quantités ou aux délais peuvent être gérées depuis cet onglet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-start border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-start">
                  {t('authority.deal.avenants.table.reference') || 'رقم الملحق'}
                </th>
                <th className="py-3 px-3 text-start">
                  {t('authority.deal.avenants.table.reason') || 'السبب والمبرر'}
                </th>
                <th className="py-3 px-3 text-start">
                  {t('authority.deal.avenants.table.amount') || 'الأثر المالي'}
                </th>
                <th className="py-3 px-3 text-start">
                  {t('authority.deal.avenants.table.extension') || 'تمديد الآجال'}
                </th>
                <th className="py-3 px-3 text-start">
                  {t('authority.deal.avenants.table.status') || 'الحالة'}
                </th>
                <th className="py-3 px-3 text-start">
                  {t('authority.deal.avenants.table.actions') || 'الإجراء'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {avenantsList.map((av) => {
                const amt = typeof av.amount_change === 'number' ? av.amount_change : parseFloat(av.amount_change) || 0;
                const isApproved = av.status === 'approved';
                const isPending = av.status === 'pending_approval';

                return (
                  <tr key={av.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* رقم الملحق */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {av.reference}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {formatDate(av.created_at)}
                      </span>
                    </td>

                    {/* سبب الملحق */}
                    <td className="py-3 px-3 max-w-xs font-medium text-slate-700">
                      <p className="line-clamp-2">{av.reason}</p>
                      {av.committee_approval_ref && (
                        <span className="inline-block mt-0.5 text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {isAr ? "مرجع اللجنة:" : "Réf commission :"} {av.committee_approval_ref}
                        </span>
                      )}
                    </td>

                    {/* الأثر المالي */}
                    <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                      <span className={amt >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {amt >= 0 ? `+${formatCurrency(amt)}` : formatCurrency(amt)}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-medium">
                        ({av.percentage_impact ? `${av.percentage_impact.toFixed(1)}%` : '0%'})
                      </span>
                    </td>

                    {/* تمديد الآجال */}
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-600">
                      {av.time_extension_days > 0 ? (
                        <span className="inline-flex items-center gap-1 text-slate-800 font-bold">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{av.time_extension_days} {isAr ? "يوماً" : "jours"}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* الحالة */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3" />
                          <span>{t('authority.deal.avenants.approved') || 'معتمد'}</span>
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          <span>{t('authority.deal.avenants.pending') || 'قيد الموافقة'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <span>{t('authority.deal.avenants.draft') || 'مسودة'}</span>
                        </span>
                      )}
                    </td>

                    {/* الإجراءات */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {/* زر مصادقة اللجنة */}
                        {!readOnly && !isApproved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setApprovingId(av.id);
                              setApprovalCommitteeRef(av.committee_approval_ref || '');
                            }}
                            className="rounded-lg text-emerald-800 border-emerald-300 hover:bg-emerald-50 text-[11px] font-bold py-1 px-2.5 h-auto flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t('authority.deal.avenants.approve') || 'مصادقة اللجنة'}</span>
                          </Button>
                        )}

                        {/* زر تحميل وثيقة الملحق الرسمية PDF */}
                        <a
                          href={`/api/procurements/avenants/${av.id}/pdf/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-600 hover:text-emerald-800 hover:bg-slate-100 text-[11px] font-semibold transition-colors"
                          title={isAr ? "تحميل وثيقة الملحق الرسمية (PDF)" : "Télécharger l’avenant officiel (PDF)"}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── 5. نافذة إضافة ملحق جديد (Create Avenant Modal) ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
                <Scale className="w-5 h-5 text-emerald-700" />
                <span>{t('authority.deal.avenants.add') || 'إضافة ملحق تعاقدي جديد'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-semibold">{formError}</span>
                </div>
              )}

              {/* رقم المرجع */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">{isAr ? "رقم الملحق (المرجع التعاقدي):" : "Numéro d’avenant (Réf contractuelle) :"}</Label>
                <Input
                  value={formRef}
                  onChange={(e) => setFormRef(e.target.value)}
                  placeholder={isAr ? "مثال: AV-001" : "Ex : AV-001"}
                  required
                  className="rounded-xl text-xs font-mono"
                />
              </div>

              {/* أسباب ومبررات الملحق */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">{isAr ? "سبب ومبررات الملحق التقنية والإدارية:" : "Motifs techniques et administratifs de l’avenant :"}</Label>
                <Textarea
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder={isAr ? "وضح مبررات التعديل في الكميات أو المواصفات أو الظروف الطارئة وفق القانون 23-12..." : "Justifiez les modifications de quantités, spécifications ou sujétions imprévues..."}
                  required
                  rows={3}
                  className="rounded-xl text-xs"
                />
              </div>

              {/* الأثر المالي وتمديد المدة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">{isAr ? "الأثر المالي بالزيادة أو النقصان (دج):" : "Incidence financière (plus-value / moins-value DZD) :"}</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="rounded-xl text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    {isAr ? "يمكن إدخال قيمة سالبة في حال تخفيض الكميات." : "Une valeur négative peut être saisie en cas de moins-value."}
                  </span>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">{isAr ? "تمديد الآجال التعاقدية (بالأيام):" : "Prolongation des délais contractuels (en jours) :"}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formDays}
                    onChange={(e) => setFormDays(e.target.value)}
                    placeholder="0"
                    className="rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* مرجع موافقة اللجنة والملف المرفق */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">{isAr ? "مرجع موافقة لجنة الصفقات (إن وجد):" : "Réf approbation commission des marchés (le cas échéant) :"}</Label>
                <Input
                  value={formCommitteeRef}
                  onChange={(e) => setFormCommitteeRef(e.target.value)}
                  placeholder={isAr ? "مثال: PV-COM-2026-084" : "Ex : PV-COM-2026-084"}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">{isAr ? "وثيقة الملحق الموقعة (PDF اختياري):" : "Document d’avenant signé (PDF optionnel) :"}</Label>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFormPdf(e.target.files?.[0] || null)}
                  className="rounded-xl text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isAr ? "حفظ الملحق" : "Enregistrer l’avenant"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 6. نافذة المصادقة السريعة للجنة (Approval Modal) ─── */}
      {approvingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{isAr ? "مصادقة لجنة الصفقات على الملحق" : "Validation de l’avenant par la commission des marchés"}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr ? "يرجى إدخال مرجع محضر اجتماع لجنة الصفقات المختصة لتأكيد اعتماد الملحق وإبرامه رسمياً:" : "Veuillez saisir la référence du PV de la commission pour entériner l’avenant :"}
            </p>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">{isAr ? "مرجع المحضر / التأشيرة:" : "Référence du PV / Visa :"}</Label>
              <Input
                value={approvalCommitteeRef}
                onChange={(e) => setApprovalCommitteeRef(e.target.value)}
                placeholder={isAr ? "مثال: PV-COM-2026/12" : "Ex : PV-COM-2026/12"}
                className="rounded-xl text-xs"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApprovingId(null)}
                className="rounded-xl text-xs"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </Button>
              <Button
                size="sm"
                disabled={isApproving}
                onClick={() => void handleApprove(approvingId)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
              >
                {isApproving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                <span>{isAr ? "تأكيد الاعتماد" : "Confirmer la validation"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AvenantsManager;
