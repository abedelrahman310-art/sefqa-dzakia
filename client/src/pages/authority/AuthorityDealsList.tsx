import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Briefcase,
  Plus,
  Search,
  Calendar,
  Layers,
  ArrowRight,
  FileText,
  AlertCircle,
  FileCheck2,
  Clock,
  Sparkles,
  Download,
  Filter,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Lock,
  Scale,
  Paperclip,
  FolderOpen,
} from 'lucide-react';
import { downloadPdfBlob } from '@/lib/pdfDownloader';
import {
  ProcurementNature,
  ProcurementMethod,
  ProcurementForm,
  NATURE_LABELS,
  METHOD_LABELS,
  FORM_LABELS,
} from '@/lib/procurementTemplates';

interface DealItem {
  id: string;
  reference_number: string;
  title: string;
  description: string;
  current_stage: number;
  stage_display?: string;
  estimated_budget: string | number | null;
  wilaya?: string;
  submission_deadline?: string | null;
  cahier_specs?: any;
  created_at: string;
  updated_at: string;
}

const STAGE_LABELS: Record<number, string> = {
  1: '01 - التخطيط والاحتياج',
  2: '02 - إعداد دفتر الشروط',
  3: '03 - نشر الإعلان',
  4: '04 - استفسارات المتعاملين',
  5: '05 - استلام العروض',
  6: '06 - الفحص الإداري والفني والمالي',
  7: '07 - التقييم والمقارنة',
  8: '08 - الإسناد والطعون',
  9: '09 - إبرام العقد',
  10: '10 - التنفيذ والتعديلات',
  11: '11 - الاستلام المؤقت والنهائي',
  12: '12 - الأداء والدفع والإغلاق',
};

export interface AuthorityDealsListProps {
  initialView?: 'deals' | 'specs' | 'docs';
}

export function AuthorityDealsList({ initialView = 'deals' }: AuthorityDealsListProps) {
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<'deals' | 'specs' | 'docs'>(initialView);
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | 'stage_1' | 'stage_2' | 'published' | 'awarded'>('all');
  const [exportingId, setExportingId] = useState<string | null>(null);

  const fetchDeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/procurements/deals/');
      const data = res.data;
      const list = Array.isArray(data) ? data : data?.results || [];
      setDeals(list);
    } catch (err: any) {
      console.error('Failed to fetch deals:', err);
      setError('تعذر تحميل قائمة الصفقات من الخادم. يرجى التحقق من الاتصال وإعادة المحاولة.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleExportPdf = async (e: React.MouseEvent, deal: DealItem) => {
    e.stopPropagation();
    setExportingId(deal.id);
    try {
      const filename = `Cahier_Specs_${deal.reference_number || deal.id}.pdf`;
      await downloadPdfBlob(`/procurements/deals/${deal.id}/specs-pdf/`, filename);
    } catch (err) {
      alert('تعذر تصدير دفتر الشروط بصيغة PDF. تأكد من إعداد دفتر الشروط للصفقة.');
    } finally {
      setExportingId(null);
    }
  };

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        deal.title.toLowerCase().includes(query) ||
        (deal.reference_number && deal.reference_number.toLowerCase().includes(query)) ||
        (deal.description && deal.description.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (stageFilter === 'stage_1') return deal.current_stage === 1;
      if (stageFilter === 'stage_2') return deal.current_stage === 2;
      if (stageFilter === 'published') return deal.current_stage >= 3 && deal.current_stage <= 7;
      if (stageFilter === 'awarded') return deal.current_stage >= 8;

      return true;
    });
  }, [deals, search, stageFilter]);

  const getStageBadge = (stage: number) => {
    if (stage === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          {STAGE_LABELS[stage] || 'التخطيط والاحتياج'}
        </span>
      );
    }
    if (stage === 2) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          {STAGE_LABELS[stage] || 'إعداد دفتر الشروط'}
        </span>
      );
    }
    if (stage >= 3 && stage <= 7) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {STAGE_LABELS[stage] || 'معلنة ومتاحة للمنافسة'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
        <FileCheck2 className="w-3.5 h-3.5 text-purple-600" />
        {STAGE_LABELS[stage] || `المرحلة ${stage}`}
      </span>
    );
  };

  const formatBudget = (budget: string | number | null) => {
    if (!budget) return 'غير محدد';
    const num = typeof budget === 'string' ? parseFloat(budget) : budget;
    if (isNaN(num)) return 'غير محدد';
    return `${num.toLocaleString('ar-DZ')} دج`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('ar-DZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── Hero / Header Banner ────────────────────────────────────────── */}
      <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-navy-50 text-navy-800 border border-navy-100">
              <Briefcase className="w-3.5 h-3.5 text-navy-700" />
              المدخل الموحد لإعداد ملفات الصفقات ودفاتر الشروط
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-3 h-3" />
              سلسلة الإسناد والتحضير الذكي
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-navy-900 tracking-tight">
            الصفقات
          </h1>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed">
            المنصة المركزية لإعداد ملفات الصفقات، حصر الاحتياجات، صياغة دفاتر الشروط وسلسلة الإسناد، وإدارة الوثائق والسندات وفق القانون 23-12.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
          <Button
            onClick={() => setLocation('/authority/deals/new')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء ملف صفقة جديد</span>
          </Button>
        </div>
      </section>

      {/* ─── Sub-Navigation Views (Deals Hub Tabs) ────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[#D5DDEA] pb-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveView('deals')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeView === 'deals'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-[#D5DDEA]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>ملفات الصفقات والمشاريع ({deals.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('specs')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeView === 'specs'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-[#D5DDEA]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>دفاتر الشروط وسلسلة الإسناد (سند)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('docs')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
            activeView === 'docs'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-[#D5DDEA]'
          }`}
        >
          <Paperclip className="w-4 h-4" />
          <span>الوثائق والسندات التنظيمية العامة</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 1: جميع ملفات الصفقات
          ══════════════════════════════════════════════════════════════════════ */}
      {activeView === 'deals' && (
        <div className="space-y-6">
          {/* Controls: Search & Stage Filters */}
          <section className="bg-white border border-[#D5DDEA] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="البحث بالموضوع، الرقم المرجعي، أو الوصف..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10 pl-4 py-2 text-sm rounded-xl border-[#D5DDEA] bg-gray-50/50 focus:bg-white focus:border-navy-500 transition-colors"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs">
                <button
                  type="button"
                  onClick={() => setStageFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                    stageFilter === 'all'
                      ? 'bg-navy-900 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  الكل ({deals.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStageFilter('stage_1')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                    stageFilter === 'stage_1'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
                  }`}
                >
                  التخطيط والاحتياج ({deals.filter((d) => d.current_stage === 1).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStageFilter('stage_2')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                    stageFilter === 'stage_2'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/60'
                  }`}
                >
                  دفتر الشروط ({deals.filter((d) => d.current_stage === 2).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStageFilter('published')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                    stageFilter === 'published'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                  }`}
                >
                  الإعلان والمنافسة ({deals.filter((d) => d.current_stage >= 3 && d.current_stage <= 7).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStageFilter('awarded')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                    stageFilter === 'awarded'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/60'
                  }`}
                >
                  الإسناد والتعاقد ({deals.filter((d) => d.current_stage >= 8).length})
                </button>
              </div>
            </div>
          </section>

          {/* Deals Table */}
          <section className="bg-white border border-[#D5DDEA] rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-gray-500 space-y-3">
                <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">جاري تحميل ملفات الصفقات المعتمدة...</span>
              </div>
            ) : error ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <p className="text-xs text-gray-600">{error}</p>
                <Button onClick={fetchDeals} variant="outline" className="text-xs">
                  إعادة المحاولة
                </Button>
              </div>
            ) : filteredDeals.length === 0 ? (
              <div className="py-20 px-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-navy-50 text-navy-800 flex items-center justify-center mx-auto border border-navy-100">
                  <Briefcase className="w-8 h-8 text-navy-600" />
                </div>
                <h3 className="text-lg font-bold text-navy-900">
                  {search || stageFilter !== 'all' ? 'لا توجد صفقات تطابق البحث' : 'لا توجد صفقات مسجلة بعد'}
                </h3>
                <Button
                  onClick={() => setLocation('/authority/deals/new')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                >
                  <Plus className="w-4 h-4 ml-1" />
                  إنشاء أول ملف صفقة
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#D5DDEA] bg-gray-50/75 text-xs font-bold text-gray-600">
                      <th className="py-3.5 px-5">الرقم المرجعي والموضوع</th>
                      <th className="py-3.5 px-4">الموقع والميزانية</th>
                      <th className="py-3.5 px-4">مرحلة الإعداد</th>
                      <th className="py-3.5 px-4">آخر تحديث</th>
                      <th className="py-3.5 px-5 text-left">إدارة الملف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5EBF4]">
                    {filteredDeals.map((deal) => {
                      return (
                        <tr
                          key={deal.id}
                          className="hover:bg-gray-50/60 transition-colors group cursor-pointer"
                          onClick={() => setLocation(`/authority/deals/${deal.id}`)}
                        >
                          <td className="py-4 px-5">
                            <div className="space-y-1.5 max-w-lg">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                                  {deal.reference_number || 'مسودة قيد الترقيم'}
                                </span>
                                {deal.cahier_specs?.administrative_clauses?.procurement_nature && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    {NATURE_LABELS[deal.cahier_specs.administrative_clauses.procurement_nature as ProcurementNature] ||
                                      deal.cahier_specs.administrative_clauses.procurement_nature}
                                  </span>
                                )}
                                {deal.cahier_specs?.administrative_clauses?.procurement_method && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-navy-50 text-navy-800 border border-navy-100">
                                    {METHOD_LABELS[deal.cahier_specs.administrative_clauses.procurement_method as ProcurementMethod] || 'طلب العروض'}
                                    {deal.cahier_specs.administrative_clauses.procurement_form
                                      ? ` (${FORM_LABELS[deal.cahier_specs.administrative_clauses.procurement_form as ProcurementForm] || deal.cahier_specs.administrative_clauses.procurement_form})`
                                      : ''}
                                  </span>
                                )}
                              </div>
                              <p className="font-bold text-navy-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                                {deal.title}
                              </p>
                              {deal.description && (
                                <p className="text-xs text-gray-500 line-clamp-1">{deal.description}</p>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="font-semibold text-gray-900 text-xs">
                              {formatBudget(deal.estimated_budget)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {deal.wilaya ? `ولاية: ${deal.wilaya}` : 'الولاية: غير محددة'}
                            </div>
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            {getStageBadge(deal.current_stage)}
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap text-xs text-gray-500">
                            {formatDate(deal.updated_at || deal.created_at)}
                          </td>

                          <td className="py-4 px-5 whitespace-nowrap text-left" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="تصدير مسودة دفتر الشروط PDF"
                                onClick={(e) => handleExportPdf(e, deal)}
                                disabled={exportingId === deal.id}
                                className="text-gray-600 hover:text-navy-900 hover:bg-gray-100 rounded-lg p-2 h-auto"
                              >
                                <Download className="w-4 h-4" />
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => setLocation(`/authority/deals/${deal.id}`)}
                                className="bg-navy-900 hover:bg-navy-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5"
                              >
                                <span>فتح ملف الصفقة</span>
                                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
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
          </section>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 2: دفاتر الشروط وسلسلة الإسناد (Sanad Absorbed View)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeView === 'specs' && (
        <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5EBF4] pb-4">
            <div>
              <h2 className="text-lg font-bold text-navy-900">سند — سلسلة الإسناد الحية لدفاتر الشروط</h2>
              <p className="text-xs text-gray-500 mt-1">
                استعراض ومتابعة دفاتر الشروط المعتمدة، سلاسل الإسناد التنظيمية، وحالات التجميد الرقمي.
              </p>
            </div>
            <span className="text-xs font-bold text-navy-800 bg-navy-50 px-3 py-1 rounded-full border border-navy-100">
              القانون 23-12 والمرسوم 15-247
            </span>
          </div>

          <div className="grid gap-3">
            {deals.map((d) => (
              <div
                key={d.id}
                onClick={() => setLocation(`/authority/deals/${d.id}`)}
                className="p-4 rounded-xl border border-gray-200 hover:border-navy-300 hover:bg-gray-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                      {d.reference_number || 'مسودة'}
                    </span>
                    <h3 className="font-bold text-navy-900 text-sm">{d.title}</h3>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {d.description || 'بدون وصف'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleExportPdf(e, d)}
                    className="border-gray-200 text-xs font-bold rounded-xl"
                  >
                    <Download className="w-3.5 h-3.5 ml-1 text-emerald-600" />
                    تصدير PDF
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setLocation(`/authority/deals/${d.id}`)}
                    className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <span>فتح دفتر الشروط</span>
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 3: الوثائق والسندات التنظيمية العامة
          ══════════════════════════════════════════════════════════════════════ */}
      {activeView === 'docs' && (
        <section className="bg-white border border-[#D5DDEA] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-[#E5EBF4] pb-4">
            <h2 className="text-lg font-bold text-navy-900">الوثائق والسندات التنظيمية العامة</h2>
            <p className="text-xs text-gray-500 mt-1">
              نماذج دفاتر الشروط الرسمية الصادرة عن وزارة المالية، نصوص القرارات الوزارية، ونماذج التصاريح المعتمدة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 space-y-2">
              <span className="font-bold text-navy-900 text-sm block">دفاتر الشروط النموذجية الوزارية</span>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                النماذج الرسمية الصادرة بموجب القرار الوزاري المؤرخ في 25 ديسمبر 2023 لتأطير صفقات الأشغال واللوازم والخدمات والدراسات.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                  معتمد رسمياً
                </span>
                <span className="text-gray-400 text-[11px]">وزارة المالية</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 space-y-2">
              <span className="font-bold text-navy-900 text-sm block">استمارات التصريح بالنزاهة والترشح</span>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                الاستمارات النموذجية الموحدة المنصوص عليها بالمادة 67 من القانون 23-12 الواجب إيداعها ضمن الملف الإداري للمتعاملين.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                  إلزامي نظاماً
                </span>
                <span className="text-gray-400 text-[11px]">القانون 23-12</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 space-y-2">
              <span className="font-bold text-navy-900 text-sm block">جدول كفالات الضمان والسندات البنكية</span>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                شروط ونسب قبول كفالة التعهد، كفالة حسن التنفيذ، وكفالة استرجاع التسبيقات وفق المرسوم الرئاسي 15-247.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold">
                  ضمان مالي
                </span>
                <span className="text-gray-400 text-[11px]">البنوك المعتمدة</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 space-y-2">
              <span className="font-bold text-navy-900 text-sm block">دليل مكافحة الممارسات المقيدة للمنافسة</span>
              <p className="text-gray-600 text-[11px] leading-relaxed">
                مؤشرات التحقق من حياد المواصفات التقنية وعدم ذكر العلامات التجارية أو حصر المنافسة دون مبرر تقني موثق.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                  دليل تدقيق
                </span>
                <span className="text-gray-400 text-[11px]">سلطة الضبط</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
