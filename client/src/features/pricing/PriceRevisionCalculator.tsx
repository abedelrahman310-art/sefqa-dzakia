import React, { useState, useMemo } from 'react';
import { useI18n } from '@/i18n';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Scale,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Sparkles,
  Coins,
  Percent,
  Info,
  ShieldCheck,
  FileSignature,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';

export interface PriceIndexItem {
  id: string;
  name: string;
  code: string;
  weight: number; // المعامل في الصيغة (مثلاً 0.35)
  baseValue: number; // القيمة المرجعية عند تقديم العرض M0
  currentValue: number; // القيمة في شهر التنفيذ M
}

export interface PriceRevisionCalculatorProps {
  initialContractAmount?: number;
  contractReference?: string;
  contractTitle?: string;
  className?: string;
}

export function PriceRevisionCalculator({
  initialContractAmount = 45000000,
  contractReference = 'صفقة رقم 2026/04/DTP',
  contractTitle = 'مشروع إنجاز منشأة فنية وطريق اجتنابي',
  className = '',
}: PriceRevisionCalculatorProps) {
  const { dir, lang } = useI18n();
  const isAr = lang === 'ar';

  // المبلغ الأساسي للصفقة P0
  const [baseAmount, setBaseAmount] = useState<number>(initialContractAmount);

  // الجزء الثابت غير القابل للمراجعة (a) - عادة بين 0.15 و 0.20 قانونياً
  const [fixedPart, setFixedPart] = useState<number>(0.15);

  // معاملات ومؤشرات المواد الأساسية الرسمية المعتمدة (ONS / وزارة الأشغال العمومية)
  const [indices, setIndices] = useState<PriceIndexItem[]>([
    {
      id: 'iron',
      name: isAr ? 'حديد البناء والصلب (Fer à béton)' : 'Fer à béton / Acier',
      code: 'M_FER',
      weight: 0.30,
      baseValue: 85000, // دج/طن عند فتح الأظرفة
      currentValue: 98000, // دج/طن في شهر الكشف الحسابي
    },
    {
      id: 'cement',
      name: isAr ? 'الإسمنت البورتلاندي المركب (Ciment CPJ-42.5)' : 'Ciment CPJ-42.5',
      code: 'M_CIM',
      weight: 0.25,
      baseValue: 920, // دج/قنطار
      currentValue: 1040, // دج/قنطار
    },
    {
      id: 'labor',
      name: isAr ? 'مؤشر اليد العاملة والرواتب (Main d’œuvre / SMIG)' : 'Main d’œuvre / Salaires',
      code: 'S_MO',
      weight: 0.15,
      baseValue: 20000,
      currentValue: 22000,
    },
    {
      id: 'equipment',
      name: isAr ? 'عتاد وآليات الورشة والمحروقات (Matériel & Carburant)' : 'Matériel & Équipements',
      code: 'E_MAT',
      weight: 0.15,
      baseValue: 135.0,
      currentValue: 147.5,
    },
  ]);

  // التحقق من مجموع المعاملات a + b + c + d = 1.00
  const weightsSum = useMemo(() => {
    const indicesSum = indices.reduce((acc, item) => acc + (Number(item.weight) || 0), 0);
    return Number((fixedPart + indicesSum).toFixed(4));
  }, [fixedPart, indices]);

  const isFormulaBalanced = Math.abs(weightsSum - 1.0) < 0.001;

  // احتساب معامل المراجعة الكلي K: K = a + sum(b * (M / M0))
  const calculationDetails = useMemo(() => {
    let variableSum = 0;
    const itemsBreakdown = indices.map((item) => {
      const ratio = item.baseValue > 0 ? item.currentValue / item.baseValue : 1;
      const contribution = item.weight * ratio;
      variableSum += contribution;
      const priceVariationPercent = item.baseValue > 0 ? ((item.currentValue - item.baseValue) / item.baseValue) * 100 : 0;
      return {
        ...item,
        ratio,
        contribution,
        priceVariationPercent,
      };
    });

    const coefficientK = fixedPart + variableSum;
    const revisedAmount = baseAmount * coefficientK;
    const differenceAmount = revisedAmount - baseAmount;
    const revisionPercentage = baseAmount > 0 ? (differenceAmount / baseAmount) * 100 : 0;

    // السقف القانوني للملاحق وفق المرسوم الرئاسي 15-247 (عادة لا يتجاوز 10% أو 15% إلا بموافقة لجنة الصفقات)
    const isOverLegalThreshold = revisionPercentage > 15;
    const isModerateIncrease = revisionPercentage > 0 && revisionPercentage <= 15;

    return {
      itemsBreakdown,
      coefficientK,
      revisedAmount,
      differenceAmount,
      revisionPercentage,
      isOverLegalThreshold,
      isModerateIncrease,
    };
  }, [baseAmount, fixedPart, indices]);

  const handleIndexChange = (id: string, field: keyof PriceIndexItem, value: number) => {
    setIndices((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleResetToStandard = () => {
    setFixedPart(0.15);
    setIndices([
      {
        id: 'iron',
        name: isAr ? 'حديد البناء والصلب (Fer à béton)' : 'Fer à béton / Acier',
        code: 'M_FER',
        weight: 0.30,
        baseValue: 85000,
        currentValue: 98000,
      },
      {
        id: 'cement',
        name: isAr ? 'الإسمنت البورتلاندي المركب (Ciment CPJ-42.5)' : 'Ciment CPJ-42.5',
        code: 'M_CIM',
        weight: 0.25,
        baseValue: 920,
        currentValue: 1040,
      },
      {
        id: 'labor',
        name: isAr ? 'مؤشر اليد العاملة والرواتب (Main d’œuvre / SMIG)' : 'Main d’œuvre / Salaires',
        code: 'S_MO',
        weight: 0.15,
        baseValue: 20000,
        currentValue: 22000,
      },
      {
        id: 'equipment',
        name: isAr ? 'عتاد وآليات الورشة والمحروقات (Matériel & Carburant)' : 'Matériel & Équipements',
        code: 'E_MAT',
        weight: 0.15,
        baseValue: 135.0,
        currentValue: 147.5,
      },
    ]);
  };

  return (
    <div className={`space-y-6 ${className}`} dir={dir}>
      {/* ─── 1. ترويسة الحاسبة القانونية ─── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Calculator className="size-6 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {isAr ? 'حاسبة مراجعة وتحيين الأسعار الرسمية' : 'Calculateur Officiel de Révision des Prix'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {isAr ? 'المرسوم الرئاسي 15-247 (المادة 95 وما بعدها)' : 'Décret 15-247 (Art. 95+)'}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-0.5">
                {isAr
                  ? 'حساب وتوليد معامل المراجعة القانوني (K) وفروقات الأسعار وملحقات التعديل المالي وفق مؤشرات الأسعار الرسمية'
                  : 'Calcul automatique du coefficient K et des écarts financiers pour avenants de révision'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetToStandard}
              className="gap-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw className="size-3.5 text-slate-500" />
              {isAr ? 'إعادة ضبط المؤشرات القياسية' : 'Réinitialiser'}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 text-xs font-bold bg-[#0b4348] text-white hover:bg-[#073135] shadow-xs"
            >
              <Download className="size-3.5" />
              {isAr ? 'تصدير جدول الحسابات الرسمي (PDF)' : 'Exporter PV de Révision'}
            </Button>
          </div>
        </div>

        {/* معلومات الصفقة المعنية */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">{isAr ? 'الصفقة / العقد:' : 'Marché / Contrat:'}</span>
            <span className="font-bold text-slate-800">{contractTitle}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">{isAr ? 'المرجع التعاقدي:' : 'Réf. Contractuelle:'}</span>
            <span className="font-bold text-slate-800">{contractReference}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">{isAr ? 'المبلغ التعاقدي الأساسي (P0):' : 'Montant Initial (P0):'}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Input
                type="number"
                value={baseAmount}
                onChange={(e) => setBaseAmount(Math.max(0, Number(e.target.value) || 0))}
                className="h-8 text-xs font-bold w-44"
              />
              <span className="font-semibold text-slate-500">دج</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. كروت ملخص النتائج المالية الكبرى ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* كرت معامل المراجعة K */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'معامل المراجعة الإجمالي (K)' : 'Coefficient Global (K)'}
            </span>
            <Scale className="size-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
              {calculationDetails.coefficientK.toFixed(4)}
            </span>
            <span className={`text-xs font-bold ${calculationDetails.coefficientK >= 1 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {calculationDetails.coefficientK >= 1 ? 'زيادة أسعار' : 'انخفاض أسعار'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {isAr ? 'الصيغة: P = P0 × K' : 'Formule: P = P0 × K'}
          </p>
        </div>

        {/* كرت فارق المراجعة المالية ΔP */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'مبلغ فارق التحيين (ΔP)' : 'Écart de Révision (ΔP)'}
            </span>
            {calculationDetails.differenceAmount >= 0 ? (
              <TrendingUp className="size-4 text-amber-500" />
            ) : (
              <TrendingDown className="size-4 text-emerald-500" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(calculationDetails.differenceAmount)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {calculationDetails.differenceAmount >= 0 ? (isAr ? 'مستحقات إضافية للمتعامل' : 'Rappel au profit de l’opérateur') : (isAr ? 'استرداد لصالح المصلحة المتعاقدة' : 'Rappel au profit du service contractant')}
          </p>
        </div>

        {/* كرت النسبة المئوية للمراجعة */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'نسبة التغير المئوية' : 'Variation Globale (%)'}
            </span>
            <Percent className="size-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {calculationDetails.revisionPercentage >= 0 ? '+' : ''}
              {calculationDetails.revisionPercentage.toFixed(2)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {calculationDetails.isOverLegalThreshold ? (
              <span className="text-red-600 font-bold flex items-center gap-1">
                <AlertTriangle className="size-3" />
                {isAr ? 'يتجاوز سقف 15% (يستوجب ملحقاً خاصاً)' : 'Dépasse le plafond légal de 15%'}
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="size-3" />
                {isAr ? 'ضمن الحدود القانونية المسموحة' : 'Conforme aux limites réglementaires'}
              </span>
            )}
          </p>
        </div>

        {/* كرت المبلغ الإجمالي المحين النهائي */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {isAr ? 'المبلغ النهائي بعد المراجعة (P)' : 'Nouveau Montant Contractuel'}
            </span>
            <Coins className="size-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white tracking-tight">
              {formatCurrency(calculationDetails.revisedAmount)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'المبلغ الإجمالي المعتمد للملحق المالي' : 'Montant total pour l’avenant'}
          </p>
        </div>
      </div>

      {/* تنبيه توازن الصيغة التعاقدية a + sum(w) = 1 */}
      {!isFormulaBalanced && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center gap-3 text-amber-900 text-xs">
          <AlertTriangle className="size-5 text-amber-600 shrink-0" />
          <div>
            <strong className="block font-bold">
              {isAr ? 'تنبيه قانوني: مجموع المعاملات لا يساوي 1.00 بالضبط' : 'Avertissement: La somme des coefficients n’est pas égale à 1.00'}
            </strong>
            <span>
              {isAr
                ? `المجموع الحالي: ${weightsSum.toFixed(4)}. ينص المرسوم الرئاسي 15-247 على أن يكون مجموع الجزء الثابت والمعاملات الترجيحية مساوياً للوحدة (1.00).`
                : `Somme actuelle: ${weightsSum.toFixed(4)}. La réglementation exige que la somme des coefficients pondérés soit égale à 1.00.`}
            </span>
          </div>
        </div>
      )}

      {/* ─── 3. جدول تركيبة الصيغة والمعاملات التفصيلية ─── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Sliders className="size-4 text-[#0b4348]" />
            <h3 className="font-bold text-slate-900 text-sm">
              {isAr ? 'تفاصيل مكونات الصيغة التعاقدية والأسعار المرجعية' : 'Paramètres de la formule de révision'}
            </h3>
          </div>
          <div className="text-xs font-semibold text-slate-500">
            {isAr ? 'الصيغة المعتمدة: P = P0 [ a + b(M/M0) + c(S/S0) + d(E/E0) ]' : 'Formule standard'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-start">{isAr ? 'المكون / المادة' : 'Composant / Matériau'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'الرمز' : 'Symbole'}</th>
                <th className="py-3 px-4 text-center">{isAr ? 'المعامل في الصيغة (الوزن)' : 'Coefficient (Poids)'}</th>
                <th className="py-3 px-4 text-center">{isAr ? 'السعر المرجعي الأساسي (M0)' : 'Indice Base (M0)'}</th>
                <th className="py-3 px-4 text-center">{isAr ? 'السعر في شهر المراجعة (M)' : 'Indice Révision (M)'}</th>
                <th className="py-3 px-4 text-center">{isAr ? 'نسبة تطور المادة' : 'Variation (%)'}</th>
                <th className="py-3 px-4 text-center">{isAr ? 'الأثر في المعامل (K_i)' : 'Impact Partiel'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* السطر الأول: الجزء الثابت غير القابل للمراجعة (a) */}
              <tr className="bg-slate-50/40 font-semibold">
                <td className="py-3 px-4 text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="size-4 text-slate-500" />
                  <div>
                    <span className="block font-bold">{isAr ? 'الجزء الثابت غير القابل للمراجعة' : 'Partie fixe invariable'}</span>
                    <span className="text-[10px] text-slate-500">{isAr ? 'محددة قانونياً بين 0.15 و 0.20' : 'Fixée entre 0.15 et 0.20'}</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono font-bold text-slate-700">a</td>
                <td className="py-3 px-4 text-center">
                  <Input
                    type="number"
                    step="0.01"
                    min="0.10"
                    max="0.30"
                    value={fixedPart}
                    onChange={(e) => setFixedPart(Number(e.target.value) || 0)}
                    className="h-8 text-xs font-bold text-center w-24 mx-auto"
                  />
                </td>
                <td className="py-3 px-4 text-center text-slate-400">-</td>
                <td className="py-3 px-4 text-center text-slate-400">-</td>
                <td className="py-3 px-4 text-center text-slate-400">0.00%</td>
                <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                  {fixedPart.toFixed(4)}
                </td>
              </tr>

              {/* أسطر المواد المتغيرة */}
              {calculationDetails.itemsBreakdown.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800 block">{item.name}</span>
                    <span className="text-[10px] text-slate-500">{isAr ? 'مؤشر رسمي ONS' : 'Indice officiel ONS'}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">{item.code}</td>
                  <td className="py-3 px-4 text-center">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={item.weight}
                      onChange={(e) => handleIndexChange(item.id, 'weight', Number(e.target.value) || 0)}
                      className="h-8 text-xs font-bold text-center w-24 mx-auto"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Input
                      type="number"
                      value={item.baseValue}
                      onChange={(e) => handleIndexChange(item.id, 'baseValue', Number(e.target.value) || 0)}
                      className="h-8 text-xs font-semibold text-center w-28 mx-auto"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Input
                      type="number"
                      value={item.currentValue}
                      onChange={(e) => handleIndexChange(item.id, 'currentValue', Number(e.target.value) || 0)}
                      className="h-8 text-xs font-semibold text-center w-28 mx-auto"
                    />
                  </td>
                  <td className="py-3 px-4 text-center font-bold">
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] ${
                        item.priceVariationPercent > 0
                          ? 'bg-amber-100 text-amber-800'
                          : item.priceVariationPercent < 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.priceVariationPercent > 0 ? '+' : ''}
                      {item.priceVariationPercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                    {item.contribution.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100/70 border-t-2 border-slate-200 font-bold">
              <tr>
                <td className="py-3 px-4 text-slate-900" colSpan={2}>
                  {isAr ? 'المجموع الإجمالي (المعامل K)' : 'Total (Coefficient K)'}
                </td>
                <td className="py-3 px-4 text-center font-mono text-xs">
                  <span className={isFormulaBalanced ? 'text-emerald-700' : 'text-red-600'}>
                    {weightsSum.toFixed(4)}
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-slate-400" colSpan={3}></td>
                <td className="py-3 px-4 text-center font-mono text-sm font-black text-slate-900">
                  {calculationDetails.coefficientK.toFixed(4)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ─── 4. ملخص إعداد الملحق القانوني (Avenant Financier) ─── */}
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <FileSignature className="size-5 text-emerald-800 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-extrabold text-emerald-950">
              {isAr ? 'صياغة الملحق المالي وفق قانون الصفقات العمومية' : 'Projet d’Avenant Financier'}
            </h4>
            <p className="text-xs text-emerald-900/80 mt-0.5 leading-relaxed">
              {isAr
                ? `بموجب المادة 95 وما بعدها من المرسوم الرئاسي 15-247، يتم إعداد ملحق مالي بقيمة ${formatCurrency(calculationDetails.differenceAmount)} بنسبة تطور قدرها ${calculationDetails.revisionPercentage.toFixed(2)}% ليصبح مبلغ الصفقة النهائي ${formatCurrency(calculationDetails.revisedAmount)} دج.`
                : `Avenant financier de révision conforme d’un montant de ${formatCurrency(calculationDetails.differenceAmount)}.`}
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          className="gap-1.5 text-xs font-bold bg-[#0b4348] text-white hover:bg-[#073135] shrink-0"
          onClick={() => alert(isAr ? 'تم توليد مسودة الملحق المالي بنجاح وإرسالها للمصادقة.' : 'Projet d’avenant généré')}
        >
          <Sparkles className="size-3.5" />
          {isAr ? 'توليد مسودة الملحق المالي' : 'Générer l’avenant'}
        </Button>
      </div>
    </div>
  );
}

export default PriceRevisionCalculator;
