import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sparkles,
  Lock,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ChevronUp,
  Scale,
  Building,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Coins,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { estimateAuthorityBOQ } from '@/features/ai/api/ai';
import type {
  AuthorityBOQEstimateResponse,
  AuthorityBOQItem,
} from '@/features/ai/types';
import { ALGERIA_69_WILAYAS } from '@/lib/wilayas';

interface AIBOQEstimatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTitle?: string;
  initialNature?: string;
  initialWilaya?: string;
  initialBudget?: string;
  onApplyToDeal: (
    items: Array<{
      id: string;
      name: string;
      unit: string;
      quantity: number;
      unitPrice: number;
    }>,
    totalBudget: number,
  ) => void;
}

export const AIBOQEstimatorModal: React.FC<AIBOQEstimatorModalProps> = ({
  open,
  onOpenChange,
  initialTitle = '',
  initialNature = 'supplies',
  initialWilaya = '16',
  initialBudget = '',
  onApplyToDeal,
}) => {
  // Input Form States
  const [title, setTitle] = useState(initialTitle);
  const [procurementNature, setProcurementNature] = useState(initialNature);
  const [wilaya, setWilaya] = useState(initialWilaya);
  const [availableBudget, setAvailableBudget] = useState(initialBudget);
  const [vatRate, setVatRate] = useState<number>(19);
  const [transportCost, setTransportCost] = useState<string>('0');
  const [installationCost, setInstallationCost] = useState<string>('0');
  const [description, setDescription] = useState('');
  const [rawSpecsText, setRawSpecsText] = useState('');

  // Processing & Results
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuthorityBOQEstimateResponse | null>(null);
  const [showInputForm, setShowInputForm] = useState(true);

  // Sync initial props when opened
  React.useEffect(() => {
    if (open) {
      if (initialTitle && !title) setTitle(initialTitle);
      if (initialNature) setProcurementNature(initialNature);
      if (initialWilaya) setWilaya(initialWilaya);
      if (initialBudget && !availableBudget) setAvailableBudget(initialBudget);
    }
  }, [open, initialTitle, initialNature, initialWilaya, initialBudget]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !description.trim() && !rawSpecsText.trim()) {
      toast.warning('يرجى كتابة عنوان الصفقة أو وصف الحاجة على الأقل.');
      return;
    }

    setLoading(true);
    try {
      const response = await estimateAuthorityBOQ({
        title: title.trim(),
        description: description.trim() || title.trim(),
        procurement_nature: procurementNature,
        wilaya: wilaya,
        available_budget: availableBudget ? parseFloat(availableBudget) : null,
        vat_rate: Number(vatRate),
        transport_cost: parseFloat(transportCost) || 0,
        installation_cost: parseFloat(installationCost) || 0,
        raw_specs_text: rawSpecsText.trim(),
      });

      setResult(response);
      setShowInputForm(false);
      toast.success('تم إعداد التقدير المالي الإداري وتوليد جدول B.O.Q بنجاح!');
    } catch (err: any) {
      console.error(err);
      toast.error('حدث خطأ أثناء إعداد التقدير، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result || !result.boq_items?.length) return;

    const mappedItems = result.boq_items.map((item, idx) => ({
      id: `boq-ai-${Date.now()}-${idx}`,
      name: item.name,
      unit: item.unit || 'وحدة',
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unit_price) || 0,
    }));

    // Pass the items and the Total HT as standard budget base
    onApplyToDeal(mappedItems, result.budget_summary.total_ht);
    onOpenChange(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl bg-white border border-slate-200 text-right" dir="rtl">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 rounded-t-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 flex">
            <div className="w-1/2 bg-[#006233]" />
            <div className="w-1/2 bg-[#d21034]" />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                <Sparkles className="size-6 text-emerald-300 animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>مُقدِّر الميزانية الإدارية وجدول الكميات (B.O.Q)</span>
                </DialogTitle>
                <DialogDescription className="text-emerald-100 text-xs sm:text-sm mt-0.5">
                  خاص بالمصلحة المتعاقدة — إعداد التقدير المالي المبدئي والموضوعي قبل إطلاق طلب العروض
                </DialogDescription>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-300/40 text-amber-200 text-xs font-bold">
              <Lock className="size-3.5" />
              <span>وثيقة سرية داخلية (المادة 19)</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Statutory Confidentiality Alert */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs sm:text-sm text-amber-900 leading-relaxed">
            <AlertTriangle className="size-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">تنبيه نظامي هام (المادة 19 من القانون رقم 23-12):</strong>{' '}
              هذا التقدير الإداري هو وثيقة داخلية سرية محظور إدراجها أو نشر أسعارها في دفتر الشروط الموجه للمتعهدين. 
              يُطرح للمتنافسين فقط <strong>«جدول كميات فارغ الأسعار (B.O.Q vierge)»</strong> لضمان المنافسة النزيهة ومنع أي تواطؤ سعري.
            </div>
          </div>

          {/* Toggle Input Form */}
          {result && (
            <div className="flex items-center justify-between border-b pb-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowInputForm(!showInputForm)}
                className="text-emerald-700 hover:text-emerald-800 text-xs font-bold flex items-center gap-1"
              >
                <span>{showInputForm ? 'إخفاء بيانات المدخلات' : 'تعديل بيانات المدخلات والصفقة'}</span>
                {showInputForm ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </Button>

              <span className="text-xs text-slate-500 font-mono">
                {result.deal_summary.items_count} بنود تقديرية مُولّدة
              </span>
            </div>
          )}

          {/* Input Form */}
          {(showInputForm || !result) && (
            <form onSubmit={handleGenerate} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">اسم أو موضوع الصفقة *</label>
                  <Input
                    placeholder="مثال: اقتناء وتوريد عتاد وتجهيزات الإعلام الآلي للمقر الإداري"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">طبيعة الصفقة *</label>
                  <select
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={procurementNature}
                    onChange={(e) => setProcurementNature(e.target.value)}
                  >
                    <option value="supplies">اللوازم والتجهيزات (Supplies)</option>
                    <option value="works">الأشغال العمومية (Works)</option>
                    <option value="services">الخدمات (Services)</option>
                    <option value="studies">الدراسات والاستشارات (Studies)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">ولاية التنفيذ *</label>
                  <select
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={wilaya}
                    onChange={(e) => setWilaya(e.target.value)}
                  >
                    {ALGERIA_69_WILAYAS.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.code} - {w.name_ar}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">الغلاف المالي المتاح في الميزانية (دج - اختياري)</label>
                  <Input
                    type="number"
                    placeholder="مثال: 1500000"
                    value={availableBudget}
                    onChange={(e) => setAvailableBudget(e.target.value)}
                    className="bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">معدل الرسم على القيمة المضافة (TVA)</label>
                  <select
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    value={vatRate}
                    onChange={(e) => setVatRate(Number(e.target.value))}
                  >
                    <option value={19}>19% (المعدل العادي)</option>
                    <option value={9}>9% (المعدل المخفض للمنتجات والخدمات الاستراتيجية)</option>
                    <option value={0}>0% (معفى من الرسم - مشاريع استثمارية AAPI)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">تكاليف النقل التقديرية (دج)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={transportCost}
                    onChange={(e) => setTransportCost(e.target.value)}
                    className="bg-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">تكاليف التركيب أو التنفيذ (دج)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={installationCost}
                    onChange={(e) => setInstallationCost(e.target.value)}
                    className="bg-white font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">وصف الحاجة والمخرجات المطلوبة</label>
                  <Textarea
                    rows={3}
                    placeholder="اذكر البنود المطلوبة والكميات إن وُجدت، أو الصق المواصفات التقنية..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-white text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>جاري الفحص ومطابقة الأسعار المرجعية...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      <span>تحليل الحاجة وتوليد جدول B.O.Q التقديري</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Results Area */}
          {result && (
            <div className="space-y-6 pt-2">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 font-semibold block">المجموع خارج الرسم (HT)</span>
                  <span className="text-lg font-black text-slate-900 font-mono mt-1 block">
                    {result.budget_summary.total_ht.toLocaleString()} دج
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 font-semibold block">الرسم TVA ({result.budget_summary.vat_rate}%)</span>
                  <span className="text-lg font-black text-slate-900 font-mono mt-1 block">
                    {result.budget_summary.vat_amount.toLocaleString()} دج
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-xs text-emerald-800 font-semibold block">المجموع التقديري (TTC)</span>
                  <span className="text-xl font-black text-emerald-700 font-mono mt-1 block">
                    {result.budget_summary.total_ttc.toLocaleString()} دج
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <span className="text-xs text-blue-800 font-semibold block">طريقة الإبرام المقترحة</span>
                  <span className="text-xs font-bold text-blue-900 mt-1.5 block leading-tight">
                    {result.deal_summary.estimated_procedure}
                  </span>
                </div>
              </div>

              {/* Threshold & Budget Variance Indicator */}
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm text-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="size-4 text-emerald-700 shrink-0" />
                  <span>{result.budget_summary.procedure_recommendation}</span>
                </div>
                {result.budget_summary.available_budget && (
                  <span className={`font-bold font-mono px-2.5 py-1 rounded-md text-xs ${result.budget_summary.is_within_budget ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {result.budget_summary.is_within_budget ? `فائض متاح: +${result.budget_summary.budget_variance?.toLocaleString()} دج` : `عجز تقديري: ${result.budget_summary.budget_variance?.toLocaleString()} دج`}
                  </span>
                )}
              </div>

              {/* Generated B.O.Q Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="size-4 text-emerald-700" />
                    <h4 className="font-black text-slate-800 text-sm">جدول الكميات والأسعار الإدارية التقديرية (Confidential B.O.Q)</h4>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">الأسعار استرشادية لسنة 2026</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="p-3 w-12 text-center">الرقم</th>
                        <th className="p-3 min-w-[200px]">بيان البند والمواصفة المحايدة</th>
                        <th className="p-3 w-20 text-center">الوحدة</th>
                        <th className="p-3 w-20 text-center">الكمية</th>
                        <th className="p-3 w-32 text-end">سعر الوحدة (دج)</th>
                        <th className="p-3 w-32 text-end">المبلغ الإجمالي (دج HT)</th>
                        <th className="p-3 min-w-[150px]">مصدر السعر المرجعي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {result.boq_items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 text-center font-mono text-slate-500">{item.item_number || `${idx + 1}`}</td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{item.name}</span>
                            {item.technical_notes && (
                              <span className="text-[11px] text-slate-500 block mt-0.5">{item.technical_notes}</span>
                            )}
                          </td>
                          <td className="p-3 text-center">{item.unit}</td>
                          <td className="p-3 text-center font-mono font-bold">{item.quantity}</td>
                          <td className="p-3 text-end font-mono">{Number(item.unit_price).toLocaleString()}</td>
                          <td className="p-3 text-end font-mono font-bold text-emerald-800">{Number(item.total_price).toLocaleString()}</td>
                          <td className="p-3 text-xs text-slate-500">{item.reference_source || 'قاعدة الأسعار 2026'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                      <tr>
                        <td colSpan={5} className="p-3 text-end">مجموع البنود (HT):</td>
                        <td className="p-3 text-end font-mono text-emerald-800">{result.budget_summary.subtotal_ht.toLocaleString()} دج</td>
                        <td></td>
                      </tr>
                      {result.budget_summary.transport_cost > 0 && (
                        <tr>
                          <td colSpan={5} className="p-3 text-end text-slate-600 font-normal">تكاليف النقل:</td>
                          <td className="p-3 text-end font-mono text-slate-700 font-normal">{result.budget_summary.transport_cost.toLocaleString()} دج</td>
                          <td></td>
                        </tr>
                      )}
                      {result.budget_summary.installation_cost > 0 && (
                        <tr>
                          <td colSpan={5} className="p-3 text-end text-slate-600 font-normal">تكاليف التركيب/التنفيذ:</td>
                          <td className="p-3 text-end font-mono text-slate-700 font-normal">{result.budget_summary.installation_cost.toLocaleString()} دج</td>
                          <td></td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={5} className="p-3 text-end">المجموع الإجمالي خارج الرسم (Total HT):</td>
                        <td className="p-3 text-end font-mono text-emerald-900 font-black">{result.budget_summary.total_ht.toLocaleString()} دج</td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="p-3 text-end">الرسم على القيمة المضافة (TVA {result.budget_summary.vat_rate}%):</td>
                        <td className="p-3 text-end font-mono text-slate-700">{result.budget_summary.vat_amount.toLocaleString()} دج</td>
                        <td></td>
                      </tr>
                      <tr className="bg-emerald-100/70 text-emerald-950 font-black text-sm">
                        <td colSpan={5} className="p-3 text-end">المبلغ الإجمالي التقديري بكل الرسوم (Total TTC):</td>
                        <td className="p-3 text-end font-mono text-emerald-900">{result.budget_summary.total_ttc.toLocaleString()} دج</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Recommendations & Alerts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                  <h5 className="font-bold text-amber-900 flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-amber-700" />
                    <span>تنبيهات فنية ومخاطر إجرائية</span>
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-amber-950 text-xs leading-relaxed">
                    {result.authority_alerts.map((alert, i) => (
                      <li key={i}>{alert}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                  <h5 className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-700" />
                    <span>توصيات لإعداد دفتر الشروط (Cahier des charges)</span>
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-emerald-950 text-xs leading-relaxed">
                    {result.tender_recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Disclaimer Note */}
              <div className="p-3 rounded-lg bg-slate-100 text-[11px] text-slate-600 leading-relaxed text-center">
                {result.disclaimer}
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrint}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Printer className="size-4" />
                  <span>طباعة تقرير التقدير الإداري</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInputForm(true)}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <span>تعديل المعطيات</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleApply}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>تطبيق البنود على دفتر الشروط وتحديث الميزانية</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIBOQEstimatorModal;
