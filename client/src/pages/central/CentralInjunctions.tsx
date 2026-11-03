import React, { useCallback, useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Plus,
  Scale,
  Search,
  ShieldAlert,
  Calendar,
  X,
  Building,
  FileText,
  Gavel,
  Eye,
  Filter,
  Check,
} from 'lucide-react';

export interface InjunctionApi {
  id: string;
  reference: string;
  authority: string;
  authority_name: string;
  authority_entity: string;
  authority_wilaya: string;
  deal: string | null;
  deal_reference: string | null;
  deal_title: string | null;
  violation_type: string;
  violation_type_display: string;
  legal_reference: string;
  directive_text: string;
  violation_details: string;
  issued_date: string;
  deadline_days: number;
  deadline_date: string;
  days_remaining: number;
  is_expired: boolean;
  status: 'issued' | 'acknowledged' | 'resolved' | 'escalated_to_court';
  status_display: string;
  issued_by_name: string;
  authority_response: string;
  authority_response_file: string | null;
  responded_at: string | null;
  responded_by_name: string;
  acknowledged_at: string | null;
  escalated_at: string | null;
  escalation_reason: string;
  document_pdf: string | null;
  created_at: string;
  updated_at: string;
}

export interface InjunctionStatsApi {
  total: number;
  active: number;
  resolved: number;
  escalated: number;
}

export interface CentralInjunctionsResponse {
  count: number;
  stats: InjunctionStatsApi;
  results?: InjunctionApi[];
  injunctions?: InjunctionApi[];
}

interface AuthorityOption {
  id: string;
  name: string;
  wilaya?: string;
}

export function CentralInjunctions() {
  const { t, lang, dir } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [injunctions, setInjunctions] = useState<InjunctionApi[]>([]);
  const [stats, setStats] = useState<InjunctionStatsApi>({ total: 0, active: 0, resolved: 0, escalated: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Authorities options for modal
  const [authorities, setAuthorities] = useState<AuthorityOption[]>([]);

  // Issue Injunction Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAuthId, setSelectedAuthId] = useState('');
  const [formViolationType, setFormViolationType] = useState('tender_splitting');
  const [formLegalRef, setFormLegalRef] = useState('المادة 13 من القانون 23-12');
  const [formDirective, setFormDirective] = useState('');
  const [formDetails, setFormDetails] = useState('');
  const [formDeadline, setFormDeadline] = useState('15');
  const [formDealRef, setFormDealRef] = useState('');
  const [formRef, setFormRef] = useState('');
  const [formPdf, setFormPdf] = useState<File | null>(null);
  const [formError, setFormError] = useState('');

  // View Response Modal State
  const [viewingResponse, setViewingResponse] = useState<InjunctionApi | null>(null);

  const loadInjunctions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<CentralInjunctionsResponse>('/reports/central/injunctions/');
      const list = res.injunctions || res.results || [];
      setInjunctions(list);
      setStats(res.stats || { total: list.length, active: 0, resolved: 0, escalated: 0 });
    } catch (err: any) {
      try {
        const fallback = await api.get<CentralInjunctionsResponse>('/central/injunctions/');
        const list = fallback.injunctions || fallback.results || [];
        setInjunctions(list);
        setStats(fallback.stats || { total: list.length, active: 0, resolved: 0, escalated: 0 });
      } catch (e: any) {
        setError(e?.message || err?.message || 'تعذر تحميل سجل الإعذارات الإدارية.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAuthorities = useCallback(async () => {
    try {
      const res = await api.get<any>('/central/authorities/');
      const list = res.authorities || res.results || [];
      const opts: AuthorityOption[] = list.map((a: any) => ({
        id: a.id,
        name: a.name || a.organization_name || a.full_name || a.email,
        wilaya: a.wilaya,
      }));
      setAuthorities(opts);
    } catch {
      // Ignore if cannot preload
    }
  }, []);

  useEffect(() => {
    loadInjunctions();
    loadAuthorities();
  }, [loadInjunctions, loadAuthorities]);

  // Violation type auto-updates legal reference & preset directive
  const handleViolationChange = (type: string) => {
    setFormViolationType(type);
    if (type === 'tender_splitting') {
      setFormLegalRef('المادة 13 من القانون 23-12');
      setFormDirective('إلغاء إجراء التجزئة فوراً، وتوحيد الحصص في استشارة أو طلب عروض موحد وفقاً لحدود المبالغ الإجمالية المبرمجة.');
    } else if (type === 'avenant_excess') {
      setFormLegalRef('المادتان 138 و139 من المرسوم الرئاسي 15-247');
      setFormDirective('إلغاء مشروع الملحق المتجاوز للسقف القانوني (20%-25%)، ومراجعة الاحتياج وفقاً للأحكام التشريعية.');
    } else if (type === 'blacklist_violation') {
      setFormLegalRef('المادة 75 من القانون 23-12');
      setFormDirective('استبعاد المتعامل الاقتصادي المدرج في القائمة السوداء فوراً من الصفقة، وإلغاء أي إجراء إسناد مؤقت تم لفائدته.');
    } else if (type === 'deadline_breach') {
      setFormLegalRef('المادتان 65 و66 من القانون 23-12');
      setFormDirective('استدراك التأخر الإجرائي ونشر نتائج التقييم والإسناد المؤقت عبر البوابة الرقمية في أجل 48 ساعة.');
    } else if (type === 'hawk_eye_ignored') {
      setFormLegalRef('المادة 10 من القانون 23-12 (النزاهة والرقابة)');
      setFormDirective('موافاة المفتشية العامة بتقرير تبريري مفصل حول أسباب تجاهل تنبيه التلاعب الصادر عن رادار عين الصقر.');
    } else {
      setFormLegalRef('أحكام القانون 23-12 والمرسوم الرئاسي 15-247');
      setFormDirective('');
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!selectedAuthId) {
      setFormError('يرجى اختيار المصلحة المتعاقدة المستهدفة.');
      return;
    }
    if (!formDirective.trim()) {
      setFormError('يرجى إدخال نص الأمر الإداري بالتصحيح.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('authority', selectedAuthId);
      formData.append('violation_type', formViolationType);
      formData.append('legal_reference', formLegalRef.trim());
      formData.append('directive_text', formDirective.trim());
      formData.append('violation_details', formDetails.trim());
      formData.append('deadline_days', formDeadline || '15');
      if (formRef.trim()) formData.append('reference', formRef.trim());
      if (formPdf) formData.append('document_pdf', formPdf);

      await api.post('/reports/central/injunctions/', formData);
      setSuccessMsg('تم إصدار الإعذار الإداري الرقابي وتبليغه رسمياً للمصلحة المتعاقدة.');
      setIsCreateOpen(false);
      setSelectedAuthId('');
      setFormDirective('');
      setFormDetails('');
      setFormDeadline('15');
      setFormRef('');
      setFormPdf(null);
      await loadInjunctions();
    } catch (err: any) {
      setFormError(err?.message || 'تعذر إصدار الإعذار الإداري.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = (injunctionId: string, ref: string) => {
    window.open(`/api/central/injunctions/${injunctionId}/pdf/`, '_blank');
  };

  const filteredInjunctions = injunctions.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      item.reference.toLowerCase().includes(q) ||
      item.authority_name.toLowerCase().includes(q) ||
      (item.deal_reference && item.deal_reference.toLowerCase().includes(q)) ||
      item.violation_type_display.toLowerCase().includes(q);

    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && (item.status === 'issued' || item.status === 'acknowledged')) ||
      item.status === statusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir={dir}>
      {/* ─── 1. Header & Title ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="size-12 rounded-xl bg-red-100 text-red-800 border border-red-200 flex items-center justify-center shrink-0 shadow-xs">
            <Gavel className="size-6 text-red-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {t('central.injunctions.title') || 'الإعذارات الإدارية الرقابية (Administrative Injunctions)'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">
                عين الصقر
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              إصدار الأوامر الإدارية الملزمة للمصالح المتعاقدة لتصحيح الخروقات القانونية، والتحويل الآلي للجهات القضائية ومجلس المحاسبة.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => {
            setIsCreateOpen(true);
            setFormError('');
            handleViolationChange('tender_splitting');
          }}
          className="bg-red-800 hover:bg-red-900 text-white font-bold text-xs gap-1.5 shadow-sm shrink-0 h-10 px-4"
        >
          <Plus className="size-4" />
          <span>{t('central.injunctions.issue') || 'إصدار إعذار إداري ملزم'}</span>
        </Button>
      </div>

      {/* ─── 2. KPI Cards Strip ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Injunctions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>إجمالي الإعذارات</span>
            <Gavel className="size-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{stats.total}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">منذ بداية المنظومة</span>
        </div>

        {/* Active within Deadline */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span>نشط (قيد المهلة 15 يوماً)</span>
            <Clock className="size-4 text-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-2">{stats.active}</div>
          <span className="text-[11px] text-amber-600/80 mt-0.5 block">بانتظار تقارير التصحيح</span>
        </div>

        {/* Resolved */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>تمت التسوية والاعتماد</span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">{stats.resolved}</div>
          <span className="text-[11px] text-emerald-600/80 mt-0.5 block">تمت مطابقة التقارير</span>
        </div>

        {/* Escalated to Court */}
        <div className={`p-4 rounded-xl border shadow-xs ${stats.escalated > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold">
            <span>محال للقضاء والعدالة</span>
            <ShieldAlert className="size-4 text-rose-600 animate-pulse" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-2">{stats.escalated}</div>
          <span className="text-[11px] text-rose-600/90 mt-0.5 block">انقضت المهلة دون رد</span>
        </div>
      </div>

      {/* ─── 3. Global Feedback Alerts ─────────────────────────────────── */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="size-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">
            <X className="size-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* ─── 4. Filters & Search Bar ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute start-3 top-2.5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالمرجع، المصلحة، الصفقة، المخالفة..."
            className="ps-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'كافة الإعذارات' },
            { id: 'active', label: 'النشطة قيد المهلة' },
            { id: 'resolved', label: 'تمت التسوية' },
            { id: 'escalated_to_court', label: 'المحالة للقضاء' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                statusFilter === pill.id
                  ? 'bg-red-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 5. Injunctions Table ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="size-8 animate-spin text-red-700" />
            <span className="text-xs">جاري تحميل سجل الإعذارات الرقابية المركزية...</span>
          </div>
        ) : filteredInjunctions.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
            <CheckCircle2 className="size-12 text-emerald-500/80" />
            <p className="text-sm font-bold text-slate-700">لا توجد إعذارات إدارية مطابقة</p>
            <p className="text-xs text-slate-500 max-w-sm text-center">
              كافة المصالح المتعاقدة ممتثلة للمعايير التشريعية ولم تسجل أي إعذارات رقابية ضمن الفلتر المختار.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3 text-start">المرجع والتاريخ</th>
                  <th className="p-3 text-start">المصلحة المتعاقدة</th>
                  <th className="p-3 text-start">نوع المخالفة والسند</th>
                  <th className="p-3 text-start">الصفقة المعنية</th>
                  <th className="p-3 text-center">المهلة والعداد</th>
                  <th className="p-3 text-center">الوضعية الرقابية</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInjunctions.map((inj) => {
                  const isEscalated = inj.status === 'escalated_to_court';
                  const isResolved = inj.status === 'resolved';

                  return (
                    <tr
                      key={inj.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isEscalated ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Reference & Issue Date */}
                      <td className="p-3">
                        <div className="font-mono font-bold text-slate-900">{inj.reference}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Calendar className="size-3" />
                          <span>صادر: {formatDate(inj.issued_date)}</span>
                        </div>
                      </td>

                      {/* Authority */}
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{inj.authority_name}</div>
                        {inj.authority_wilaya && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building className="size-3 text-slate-400" />
                            <span>ولاية {inj.authority_wilaya}</span>
                          </div>
                        )}
                      </td>

                      {/* Violation Type & Legal Ref */}
                      <td className="p-3 max-w-[240px]">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-900 border border-red-200 mb-1">
                          {inj.violation_type_display || inj.violation_type}
                        </span>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {inj.legal_reference}
                        </div>
                      </td>

                      {/* Deal */}
                      <td className="p-3 max-w-[180px]">
                        {inj.deal_reference ? (
                          <div>
                            <div className="font-mono font-bold text-slate-800 text-[11px] truncate">
                              {inj.deal_reference}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate" title={inj.deal_title || ''}>
                              {inj.deal_title}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">مخالفة عامة للمصلحة</span>
                        )}
                      </td>

                      {/* Countdown & Deadline */}
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {isResolved ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="size-3" />
                              <span>تمت التسوية</span>
                            </span>
                          ) : isEscalated ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1 animate-pulse">
                              <ShieldAlert className="size-3 text-rose-700" />
                              <span>انقضت المهلة (محال للقضاء)</span>
                            </span>
                          ) : (
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                              inj.days_remaining <= 5
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                                : 'bg-blue-50 text-blue-900 border border-blue-200'
                            }`}>
                              <Clock className="size-3" />
                              <span>متبقي {inj.days_remaining} يوماً</span>
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            حتى {formatDate(inj.deadline_date)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          inj.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : inj.status === 'escalated_to_court'
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : inj.status === 'acknowledged'
                            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {inj.status_display || inj.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Response if present */}
                          {inj.authority_response && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingResponse(inj)}
                              className="h-7 text-[11px] font-bold text-sky-700 border-sky-200 hover:bg-sky-50"
                              title="معاينة تقرير التصحيح المودع من المصلحة"
                            >
                              <Eye className="size-3" />
                              <span>الرد والتصحيح</span>
                            </Button>
                          )}

                          {/* Download PDF */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadPdf(inj.id, inj.reference)}
                            className="h-7 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                            title="تحميل وثيقة الإعذار الإداري الرسمية PDF مع الختم الرقمي"
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
          Modal: Issue Administrative Injunction
         ══════════════════════════════════════════════════════════════════ */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-red-100 text-red-800 flex items-center justify-center shrink-0">
                  <Gavel className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {t('central.injunctions.issue') || 'إصدار إعذار إداري رقابي ملزم'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    أمر رسمي نافذ بموجب المادة 13 من القانون 23-12 يمنح مهلة 15 يوماً للتسوية قبل الإحالة القضائية
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
                <AlertOctagon className="size-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleIssueSubmit} className="space-y-4">
              {/* Target Authority */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">المصلحة المتعاقدة المستهدفة بالإعذار *</Label>
                <select
                  value={selectedAuthId}
                  onChange={(e) => setSelectedAuthId(e.target.value)}
                  className="w-full text-xs font-semibold rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  required
                >
                  <option value="">-- اختر المصلحة المتعاقدة --</option>
                  {authorities.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} {a.wilaya ? `(ولاية ${a.wilaya})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Violation Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">نوع المخالفة القانونية *</Label>
                  <select
                    value={formViolationType}
                    onChange={(e) => handleViolationChange(e.target.value)}
                    className="w-full text-xs font-semibold rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="tender_splitting">تجزئة الصفقات العمومية (المادة 13)</option>
                    <option value="avenant_excess">تجاوز نسبة الملاحق القانونية (المادتان 138-139)</option>
                    <option value="blacklist_violation">منح صفقة لشركة مقصاة في القائمة السوداء (المادة 75)</option>
                    <option value="deadline_breach">إخلال بالآجال والمهل القانونية الملزمة</option>
                    <option value="hawk_eye_ignored">تجاهل إنذارات عين الصقر وشبهات التلاعب</option>
                    <option value="other">مخالفات إدارية وتنظيمية أخرى</option>
                  </select>
                </div>

                {/* Legal Reference */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">السند القانوني المخالف *</Label>
                  <Input
                    type="text"
                    value={formLegalRef}
                    onChange={(e) => setFormLegalRef(e.target.value)}
                    className="text-xs font-mono font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Deadline Days */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">المهلة القانونية الممنوحة (بالأيام) *</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="text-xs font-mono font-bold"
                    placeholder="15"
                    required
                  />
                  <span className="text-[10px] text-slate-500">المهلة القانونية الرسمية: 15 يوماً للتسوية</span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">الرقم المرجعي للإعذار (اختياري)</Label>
                  <Input
                    type="text"
                    value={formRef}
                    onChange={(e) => setFormRef(e.target.value)}
                    className="text-xs font-mono"
                    placeholder="يولد تلقائياً: INJ-2026-XXX"
                  />
                </div>
              </div>

              {/* Directive Text */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">نص الأمر الإداري الملزم بالتصحيح والتسوية *</Label>
                <Textarea
                  value={formDirective}
                  onChange={(e) => setFormDirective(e.target.value)}
                  rows={3}
                  className="text-xs leading-relaxed font-semibold"
                  placeholder="أدخل الإجراءات الواجب اتخاذها من قبل المصلحة (مثلاً: إلغاء الإجراء، توحيد الحصص، استبعاد المتعامل المقصى)..."
                  required
                />
              </div>

              {/* Violation Details */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">حيثيات ووقائع المخالفة المثبتة بالتحريات</Label>
                <Textarea
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  rows={3}
                  className="text-xs leading-relaxed"
                  placeholder="بيان الوقائع المادية وتقارير عين الصقر التي تثبت المخالفة..."
                />
              </div>

              {/* Optional PDF Attachment */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">مرفق تقرير التفتيش المادي (اختياري PDF)</Label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFormPdf(e.target.files?.[0] || null)}
                  className="text-xs file:bg-slate-100 file:border-0 file:rounded-md file:text-xs file:font-bold file:px-2"
                />
              </div>

              {/* Legal Warning Notice */}
              <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 text-xs text-rose-950 flex items-start gap-2">
                <ShieldAlert className="size-4 text-rose-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">التصعيد التلقائي:</span> في حال انقضاء مهلة الـ {formDeadline || 15} يوماً دون إيداع المصلحة لتقرير التصحيح، سيتم تحويل الملف آلياً إلى وضعية <span className="font-bold text-rose-800">"محال للجهات القضائية ومجلس المحاسبة"</span> وتوجيه إخطار استعجالي فوري لكافة المفتشين.
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
                  className="bg-red-800 hover:bg-red-900 text-white font-bold text-xs gap-1.5 shadow-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>جاري الإصدار والتبليغ...</span>
                    </>
                  ) : (
                    <>
                      <Gavel className="size-3.5" />
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
          Modal: View Authority Corrective Response
         ══════════════════════════════════════════════════════════════════ */}
      {viewingResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  تقرير التصحيح والرد للإعذار {viewingResponse.reference}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingResponse(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-[11px] text-slate-500">
                المصلحة: <span className="font-bold text-slate-700">{viewingResponse.authority_name}</span> · تاريخ الرد: {formatDate(viewingResponse.responded_at)}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {viewingResponse.authority_response || 'لا يوجد نص مكتوب.'}
              </div>
              {viewingResponse.authority_response_file && (
                <a
                  href={viewingResponse.authority_response_file}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
                >
                  <Download className="size-3.5" />
                  <span>تحميل ملف تقرير التصحيح المرفق (PDF)</span>
                </a>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewingResponse(null)}
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
}
