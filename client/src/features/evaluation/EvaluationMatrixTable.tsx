import React, { useState, useMemo } from 'react';
import { useI18n } from '@/i18n';
import {
  Trophy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Filter,
  Sparkles,
  Building2,
  TrendingDown,
  TrendingUp,
  Scale,
  Award,
  ChevronDown,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { AbnormallyLowBidModal, type AbnormallyLowOfferData } from './AbnormallyLowBidModal';

export interface EvaluationMatrixOffer {
  id: string;
  operatorName: string;
  operatorEmail?: string;
  technicalScore: number;
  financialAmount: number;
  isCandidacyCompliant: boolean;
  status: 'pending' | 'accepted' | 'rejected' | 'abnormally_low';
  rejectionReason?: string;
}

interface EvaluationMatrixTableProps {
  dealTitle: string;
  dealReference: string;
  authorityName: string;
  estimatedBudget?: number;
  offers: EvaluationMatrixOffer[];
  onSelectWinner?: (offerId: string) => void;
  onSendInquiry?: (offerId: string, inquiryText: string) => void;
  className?: string;
}

export function EvaluationMatrixTable({
  dealTitle,
  dealReference,
  authorityName,
  estimatedBudget,
  offers,
  onSelectWinner,
  onSendInquiry,
  className = '',
}: EvaluationMatrixTableProps) {
  const { dir, lang } = useI18n();
  const isAr = lang === 'ar';

  // نظام التقييم: الأفضل اقتصادياً (70/30) أم الأقل ثمناً
  const [method, setMethod] = useState<'ratio' | 'lowest'>('ratio');
  const [minTechScore, setMinTechScore] = useState(50);
  const [activeAnomalyModalData, setActiveAnomalyModalData] = useState<AbnormallyLowOfferData | null>(null);

  // احتساب المتوسط والوسيط المالي للعروض المقبولة
  const financialAmounts = useMemo(() => {
    return offers
      .map((o) => o.financialAmount)
      .filter((amt) => amt > 0);
  }, [offers]);

  const averageAmount = useMemo(() => {
    if (financialAmounts.length === 0) return estimatedBudget || 0;
    const sum = financialAmounts.reduce((acc, v) => acc + v, 0);
    return sum / financialAmounts.length;
  }, [financialAmounts, estimatedBudget]);

  const baselineAmount = estimatedBudget || averageAmount;

  // معالجة وحساب ترتيب العروض وفق القانون 23-12
  const rankedOffers = useMemo(() => {
    // 1. تحديد الحد الأدنى والأقصى للأسعار لحساب التنقيط المالي النسبي
    const validAmounts = offers
      .filter((o) => o.technicalScore >= minTechScore && o.financialAmount > 0)
      .map((o) => o.financialAmount);

    const minAmount = validAmounts.length > 0 ? Math.min(...validAmounts) : 1;

    return offers.map((offer) => {
      const isTechPassed = offer.technicalScore >= minTechScore;
      const deviationPercent = baselineAmount > 0
        ? ((offer.financialAmount - baselineAmount) / baselineAmount) * 100
        : 0;

      // فحص العرض المنخفض بشكل غير طبيعي وفق المادة 72 (انخفاض بأكثر من 25% عن المتوسط أو التقدير)
      const isAbnormallyLow = deviationPercent <= -25;

      // التنقيط المالي (صيغة الصفقات العمومية: Note_Fin = (Min_Amount / Offer_Amount) * 100)
      const financialScore = offer.financialAmount > 0
        ? Math.min(100, (minAmount / offer.financialAmount) * 100)
        : 0;

      // التنقيط الإجمالي المرجح
      let combinedScore = 0;
      if (isTechPassed) {
        if (method === 'ratio') {
          // 70% تقني + 30% مالي
          combinedScore = (offer.technicalScore * 0.7) + (financialScore * 0.3);
        } else {
          // الأقل ثمناً من بين المقبولين تقنياً
          combinedScore = 1000000 - offer.financialAmount;
        }
      }

      let recommendation = isAr ? 'مقبول' : 'Recevable';
      if (!isTechPassed) {
        recommendation = isAr
          ? `مقصى تقنياً (أقل من ${minTechScore} نقطة)`
          : `Éliminé techniquement (< ${minTechScore} pts)`;
      } else if (isAbnormallyLow) {
        recommendation = isAr
          ? 'يستوجب استفسار المادة 72 (سعر منخفض جداً)'
          : 'Justification art. 72 requise (offre anormalement basse)';
      } else {
        recommendation = isAr ? 'مؤهل للمنح المؤقت' : 'Éligible à l’attribution provisoire';
      }

      return {
        ...offer,
        isTechPassed,
        financialScore: Math.round(financialScore),
        deviationPercent,
        isAbnormallyLow,
        combinedScore: Math.round(combinedScore * 10) / 10,
        recommendation,
      };
    }).sort((a, b) => {
      // المقبولون تقنياً أولاً
      if (a.isTechPassed && !b.isTechPassed) return -1;
      if (!a.isTechPassed && b.isTechPassed) return 1;
      return b.combinedScore - a.combinedScore;
    });
  }, [offers, minTechScore, baselineAmount, method, isAr]);

  return (
    <div className={`space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs ${className}`} dir={dir}>
      {/* ─── الرأس وعناصر التحكم ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200">
              {isAr ? 'مصفوفة الفرز الآلي (AI Evaluation Matrix)' : 'Matrice de dépouillement IA (AI Evaluation Matrix)'}
            </span>
            <span className="text-xs text-slate-500 font-bold">
              {isAr ? 'لجنة تقييم العروض (COP)' : 'Commission d’évaluation des plis (COP)'}
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-0.5">
            {isAr
              ? 'مصفوفة المقارنة التفاعلية وكاشف العروض المنخفضة (المادة 72)'
              : 'Matrice comparative interactive et détecteur d’offres anormalement basses (Art. 72)'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAr ? 'المرجع:' : 'Réf :'} <span className="font-mono font-bold text-slate-700">{dealReference}</span> — {isAr ? 'المتوسط المرجعي:' : 'Moyenne de référence :'}{' '}
            <strong className="text-slate-900">{formatCurrency(averageAmount)}</strong>
          </p>
        </div>

        {/* محدد طريقة الفرز */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setMethod('ratio')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              method === 'ratio'
                ? 'bg-white text-slate-900 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isAr ? 'الأفضل اقتصادياً (70/30)' : 'Mieux-disant (70/30)'}
          </button>
          <button
            type="button"
            onClick={() => setMethod('lowest')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              method === 'lowest'
                ? 'bg-white text-slate-900 shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isAr ? 'الأقل ثمناً' : 'Moins-disant'}
          </button>
        </div>
      </div>

      {/* ─── جدول المصفوفة التفاعلي ─── */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-xs text-start">
          <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200">
            <tr>
              <th className="py-3 px-3 text-start">{isAr ? 'الرتبة' : 'Rang'}</th>
              <th className="py-3 px-3 text-start">{isAr ? 'اسم المتعهد / المؤسسة' : 'Soumissionnaire / Entreprise'}</th>
              <th className="py-3 px-3 text-start">{isAr ? 'ملف الترشح' : 'Candidature'}</th>
              <th className="py-3 px-3 text-center">{isAr ? 'التنقيط التقني' : 'Score technique'}</th>
              <th className="py-3 px-3 text-start">{isAr ? 'المبلغ المالي (د.ج)' : 'Montant financier (DZD)'}</th>
              <th className="py-3 px-3 text-center">{isAr ? 'الانحراف عن المرجع' : 'Écart / Référence'}</th>
              <th className="py-3 px-3 text-center">{isAr ? 'المادة 72' : 'Art. 72'}</th>
              <th className="py-3 px-3 text-center">{isAr ? 'النتيجة الإجمالية' : 'Score global'}</th>
              <th className="py-3 px-3 text-start">{isAr ? 'التوصية القانونية' : 'Recommandation légale'}</th>
              <th className="py-3 px-3 text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {rankedOffers.map((offer, index) => {
              const isWinner = index === 0 && offer.isTechPassed && !offer.isAbnormallyLow;
              return (
                <tr
                  key={offer.id}
                  className={`transition-colors hover:bg-slate-50/70 ${
                    isWinner
                      ? 'bg-emerald-50/50'
                      : offer.isAbnormallyLow
                      ? 'bg-amber-50/40'
                      : !offer.isTechPassed
                      ? 'bg-rose-50/30 opacity-75'
                      : ''
                  }`}
                >
                  {/* الرتبة */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1.5 font-bold">
                      {isWinner ? (
                        <span className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xs font-black">
                          1
                        </span>
                      ) : (
                        <span className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                          {index + 1}
                        </span>
                      )}
                      {isWinner && <Trophy className="size-4 text-emerald-600" />}
                    </div>
                  </td>

                  {/* اسم المتعهد */}
                  <td className="py-3.5 px-3">
                    <strong className="text-slate-900 block text-xs font-bold">{offer.operatorName}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">{offer.id}</span>
                  </td>

                  {/* ملف الترشح */}
                  <td className="py-3.5 px-3">
                    {offer.isCandidacyCompliant ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="size-3.5" />
                        <span>{isAr ? 'مستوفٍ' : 'Conforme'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                        <XCircle className="size-3.5" />
                        <span>{isAr ? 'نواقص' : 'Incomplet'}</span>
                      </span>
                    )}
                  </td>

                  {/* التنقيط التقني */}
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md font-bold text-xs ${
                        offer.technicalScore >= 70
                          ? 'bg-emerald-100 text-emerald-800'
                          : offer.technicalScore >= minTechScore
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {offer.technicalScore} / 100
                    </span>
                  </td>

                  {/* المبلغ المالي */}
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                    {formatCurrency(offer.financialAmount)}
                  </td>

                  {/* الانحراف */}
                  <td className="py-3.5 px-3 text-center font-mono text-[11px] font-bold">
                    <span
                      className={
                        offer.deviationPercent < -20
                          ? 'text-amber-700'
                          : offer.deviationPercent > 20
                          ? 'text-rose-700'
                          : 'text-slate-600'
                      }
                    >
                      {offer.deviationPercent > 0 ? '+' : ''}
                      {offer.deviationPercent.toFixed(1)}%
                    </span>
                  </td>

                  {/* مؤشر المادة 72 */}
                  <td className="py-3.5 px-3 text-center">
                    {offer.isAbnormallyLow ? (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveAnomalyModalData({
                            offerId: offer.id,
                            operatorName: offer.operatorName,
                            financialAmount: offer.financialAmount,
                            averageAmount,
                            estimatedBudget,
                            deviationPercent: offer.deviationPercent,
                            dealReference,
                            dealTitle,
                            authorityName,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-900 shadow-2xs hover:bg-amber-200 cursor-pointer"
                        title={
                          isAr
                            ? 'اضغط لتوليد استفسار كتابي رسمي عملاً بالمادة 72'
                            : 'Demande d’éclaircissements et de justification selon l’art. 72'
                        }
                      >
                        <AlertTriangle className="size-3 text-amber-700" />
                        <span>{isAr ? 'منخفض جداً ⚠️' : 'Anormalement basse ⚠️'}</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
                        <span>{isAr ? 'طبيعي' : 'Normale'}</span>
                      </span>
                    )}
                  </td>

                  {/* النتيجة الإجمالية */}
                  <td className="py-3.5 px-3 text-center font-black text-xs text-slate-900">
                    {offer.isTechPassed ? `${offer.combinedScore} ${isAr ? 'نقطة' : 'pts'}` : '—'}
                  </td>

                  {/* التوصية */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`text-[11px] font-bold ${
                        isWinner
                          ? 'text-emerald-800'
                          : offer.isAbnormallyLow
                          ? 'text-amber-800'
                          : !offer.isTechPassed
                          ? 'text-rose-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {offer.recommendation}
                    </span>
                  </td>

                  {/* الإجراءات */}
                  <td className="py-3.5 px-3 text-end">
                    <div className="flex items-center justify-end gap-1.5">
                      {offer.isAbnormallyLow && (
                        <button
                          type="button"
                          onClick={() =>
                            setActiveAnomalyModalData({
                              offerId: offer.id,
                              operatorName: offer.operatorName,
                              financialAmount: offer.financialAmount,
                              averageAmount,
                              estimatedBudget,
                              deviationPercent: offer.deviationPercent,
                              dealReference,
                              dealTitle,
                              authorityName,
                            })
                          }
                          className="rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-amber-600 cursor-pointer"
                        >
                          {isAr ? 'طلب تبرير (م72)' : 'Justification (Art. 72)'}
                        </button>
                      )}

                      {isWinner && onSelectWinner && (
                        <button
                          type="button"
                          onClick={() => onSelectWinner(offer.id)}
                          className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-emerald-700 cursor-pointer"
                        >
                          {isAr ? 'اعتماد المنح المؤقت' : 'Attribution provisoire'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── نافذة استفسار المادة 72 المنبثقة ─── */}
      <AbnormallyLowBidModal
        isOpen={Boolean(activeAnomalyModalData)}
        onClose={() => setActiveAnomalyModalData(null)}
        data={activeAnomalyModalData}
        onSendInquiry={(inquiryText) => {
          if (activeAnomalyModalData && onSendInquiry) {
            onSendInquiry(activeAnomalyModalData.offerId, inquiryText);
          }
        }}
      />
    </div>
  );
}

export default EvaluationMatrixTable;
