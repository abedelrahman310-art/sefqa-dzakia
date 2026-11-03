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
  const [formLegalRef, setFormLegalRef] = useState(() => t('central.injunctions.legal_default_splitting'));
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
      const payload = res.data;
      const list = payload.injunctions || payload.results || [];
      setInjunctions(list);
      setStats(payload.stats || { total: list.length, active: 0, resolved: 0, escalated: 0 });
    } catch (err: any) {
      try {
        const fallback = await api.get<CentralInjunctionsResponse>('/central/injunctions/');
        const payload = fallback.data;
        const list = payload.injunctions || payload.results || [];
        setInjunctions(list);
        setStats(payload.stats || { total: list.length, active: 0, resolved: 0, escalated: 0 });
      } catch (e: any) {
        setError(t('central.injunctions.error_load'));
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadAuthorities = useCallback(async () => {
    try {
      const res = await api.get<any>('/central/authorities/');
      const list = res.data?.authorities || res.data?.results || [];
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
      setFormLegalRef(t('central.injunctions.legal_default_splitting'));
      setFormDirective(t('central.injunctions.directive_splitting'));
    } else if (type === 'avenant_excess') {
      setFormLegalRef(t('central.injunctions.legal_default_avenant'));
      setFormDirective(t('central.injunctions.directive_avenant'));
    } else if (type === 'blacklist_violation') {
      setFormLegalRef(t('central.injunctions.legal_default_blacklist'));
      setFormDirective(t('central.injunctions.directive_blacklist'));
    } else if (type === 'deadline_breach') {
      setFormLegalRef(t('central.injunctions.legal_default_deadline'));
      setFormDirective(t('central.injunctions.directive_deadline'));
    } else if (type === 'hawk_eye_ignored') {
      setFormLegalRef(t('central.injunctions.legal_default_hawk'));
      setFormDirective(t('central.injunctions.directive_hawk'));
    } else {
      setFormLegalRef(t('central.injunctions.legal_default_other'));
      setFormDirective('');
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!selectedAuthId) {
      setFormError(t('central.injunctions.error_select_authority'));
      return;
    }
    if (!formDirective.trim()) {
      setFormError(t('central.injunctions.error_directive'));
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
      setSuccessMsg(t('central.injunctions.success_issue'));
      setIsCreateOpen(false);
      setSelectedAuthId('');
      setFormDirective('');
      setFormDetails('');
      setFormDeadline('15');
      setFormRef('');
      setFormPdf(null);
      await loadInjunctions();
    } catch (err: any) {
      setFormError(err?.response?.data?.error || t('central.injunctions.error_issue'));
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
                {t('central.injunctions.title')}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">
                {t('central.injunctions.badge')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t('central.injunctions.header_subtitle')}
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
          <span>{t('central.injunctions.issue')}</span>
        </Button>
      </div>

      {/* ─── 2. KPI Cards Strip ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Injunctions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t('central.injunctions.kpi_total')}</span>
            <Gavel className="size-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">{stats.total}</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{t('central.injunctions.kpi_total_sub')}</span>
        </div>

        {/* Active within Deadline */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span>{t('central.injunctions.kpi_active')}</span>
            <Clock className="size-4 text-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-2">{stats.active}</div>
          <span className="text-[11px] text-amber-600/80 mt-0.5 block">{t('central.injunctions.kpi_active_sub')}</span>
        </div>

        {/* Resolved */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>{t('central.injunctions.kpi_resolved')}</span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">{stats.resolved}</div>
          <span className="text-[11px] text-emerald-600/80 mt-0.5 block">{t('central.injunctions.kpi_resolved_sub')}</span>
        </div>

        {/* Escalated to Court */}
        <div className={`p-4 rounded-xl border shadow-xs ${stats.escalated > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold">
            <span>{t('central.injunctions.kpi_escalated')}</span>
            <ShieldAlert className="size-4 text-rose-600 animate-pulse" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-2">{stats.escalated}</div>
          <span className="text-[11px] text-rose-600/90 mt-0.5 block">{t('central.injunctions.kpi_escalated_sub')}</span>
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
            placeholder={t('central.injunctions.search_placeholder')}
            className="ps-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: t('central.injunctions.filter_all') },
            { id: 'active', label: t('central.injunctions.filter_active') },
            { id: 'resolved', label: t('central.injunctions.filter_resolved') },
            { id: 'escalated_to_court', label: t('central.injunctions.filter_escalated') },
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
            <span className="text-xs">{t('central.injunctions.loading')}</span>
          </div>
        ) : filteredInjunctions.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
            <CheckCircle2 className="size-12 text-emerald-500/80" />
            <p className="text-sm font-bold text-slate-700">{t('central.injunctions.empty_title')}</p>
            <p className="text-xs text-slate-500 max-w-sm text-center">
              {t('central.injunctions.empty_desc')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3 text-start">{t('central.injunctions.col_reference')}</th>
                  <th className="p-3 text-start">{t('central.injunctions.col_authority')}</th>
                  <th className="p-3 text-start">{t('central.injunctions.col_violation')}</th>
                  <th className="p-3 text-start">{t('central.injunctions.col_deal')}</th>
                  <th className="p-3 text-center">{t('central.injunctions.col_deadline')}</th>
                  <th className="p-3 text-center">{t('central.injunctions.col_status')}</th>
                  <th className="p-3 text-center">{t('central.injunctions.col_actions')}</th>
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
                          <span>{t('central.injunctions.issued_at', { date: formatDate(inj.issued_date) })}</span>
                        </div>
                      </td>

                      {/* Authority */}
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{inj.authority_name}</div>
                        {inj.authority_wilaya && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building className="size-3 text-slate-400" />
                            <span>{t('central.injunctions.wilaya', { wilaya: inj.authority_wilaya })}</span>
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
                          <span className="text-slate-400 text-xs">{t('central.injunctions.general_violation')}</span>
                        )}
                      </td>

                      {/* Countdown & Deadline */}
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {isResolved ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="size-3" />
                              <span>{t('central.injunctions.resolved_badge')}</span>
                            </span>
                          ) : isEscalated ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1 animate-pulse">
                              <ShieldAlert className="size-3 text-rose-700" />
                              <span>{t('central.injunctions.escalated_badge')}</span>
                            </span>
                          ) : (
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                              inj.days_remaining <= 5
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                                : 'bg-blue-50 text-blue-900 border border-blue-200'
                            }`}>
                              <Clock className="size-3" />
                              <span>{t('central.injunctions.days_remaining', { days: inj.days_remaining })}</span>
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            {t('central.injunctions.deadline_until', { date: formatDate(inj.deadline_date) })}
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
                              title={t('central.injunctions.view_response_title')}
                            >
                              <Eye className="size-3" />
                              <span>{t('central.injunctions.view_response')}</span>
                            </Button>
                          )}

                          {/* Download PDF */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadPdf(inj.id, inj.reference)}
                            className="h-7 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                            title={t('central.injunctions.download_pdf_title')}
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
                    {t('central.injunctions.issue')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('central.injunctions.modal_subtitle')}
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
                <Label className="text-xs font-bold text-slate-700">{t('central.injunctions.form_authority')}</Label>
                <select
                  value={selectedAuthId}
                  onChange={(e) => setSelectedAuthId(e.target.value)}
                  className="w-full text-xs font-semibold rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  required
                >
                  <option value="">-- {t('central.injunctions.form_authority_placeholder')} --</option>
                  {authorities.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} {a.wilaya ? ` ${t('central.injunctions.wilaya', { wilaya: a.wilaya })}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Violation Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">{t('central.injunctions.form_type')}</Label>
                  <select
                    value={formViolationType}
                    onChange={(e) => handleViolationChange(e.target.value)}
                    className="w-full text-xs font-semibold rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="tender_splitting">{t('central.injunctions.types.tender_splitting')}</option>
                    <option value="avenant_excess">{t('central.injunctions.types.avenant_excess')}</option>
                    <option value="blacklist_violation">{t('central.injunctions.types.blacklist_violation')}</option>
                    <option value="deadline_breach">{t('central.injunctions.types.deadline_breach')}</option>
                    <option value="hawk_eye_ignored">{t('central.injunctions.types.hawk_eye_ignored')}</option>
                    <option value="other">{t('central.injunctions.types.other')}</option>
                  </select>
                </div>

                {/* Legal Reference */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">{t('central.injunctions.form_legal_ref')}</Label>
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
                  <Label className="text-xs font-bold text-slate-700">{t('central.injunctions.form_deadline_days')}</Label>
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
                  <span className="text-[10px] text-slate-500">{t('central.injunctions.form_deadline_hint')}</span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">{t('central.injunctions.form_ref')}</Label>
                  <Input
                    type="text"
                    value={formRef}
                    onChange={(e) => setFormRef(e.target.value)}
                    className="text-xs font-mono"
                    placeholder={t('central.injunctions.form_ref_placeholder')}
                  />
                </div>
              </div>

              {/* Directive Text */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">{t('central.injunctions.form_directive')}</Label>
                <Textarea
                  value={formDirective}
                  onChange={(e) => setFormDirective(e.target.value)}
                  rows={3}
                  className="text-xs leading-relaxed font-semibold"
                  placeholder={t('central.injunctions.form_directive_placeholder')}
                  required
                />
              </div>

              {/* Violation Details */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">{t('central.injunctions.form_details')}</Label>
                <Textarea
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  rows={3}
                  className="text-xs leading-relaxed"
                  placeholder={t('central.injunctions.form_details_placeholder')}
                />
              </div>

              {/* Optional PDF Attachment */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">{t('central.injunctions.form_pdf')}</Label>
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
                  <span className="font-bold">{t('central.injunctions.escalation_warning', { days: formDeadline || 15 })}</span>
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
                  {t('central.injunctions.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-red-800 hover:bg-red-900 text-white font-bold text-xs gap-1.5 shadow-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>{t('central.injunctions.submitting')}</span>
                    </>
                  ) : (
                    <>
                      <Gavel className="size-3.5" />
                      <span>{t('central.injunctions.submit')}</span>
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
                  {t('central.injunctions.response_title', { ref: viewingResponse.reference })}
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
                {t('central.injunctions.response_meta', { authority: viewingResponse.authority_name, date: formatDate(viewingResponse.responded_at) })}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {viewingResponse.authority_response || t('central.injunctions.no_text')}
              </div>
              {viewingResponse.authority_response_file && (
                <a
                  href={viewingResponse.authority_response_file}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
                >
                  <Download className="size-3.5" />
                  <span>{t('central.injunctions.download_response')}</span>
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
                {t('central.injunctions.close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
