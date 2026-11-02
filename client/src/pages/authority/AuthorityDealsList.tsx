import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import { formatCurrency, formatDate as intlFormatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Briefcase,
  Plus,
  Search,
  FileText,
  AlertCircle,
  FileCheck2,
  Clock,
  Sparkles,
  Download,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Paperclip,
} from 'lucide-react';
import { downloadPdfBlob } from '@/lib/pdfDownloader';
import type { ProcurementDealApi } from '@/lib/procurementApiTypes';

type DealItem = ProcurementDealApi;

export interface AuthorityDealsListProps {
  initialView?: 'deals' | 'specs' | 'docs';
}

export function AuthorityDealsList({ initialView = 'deals' }: AuthorityDealsListProps) {
  const { t, lang, dir } = useI18n();
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<'deals' | 'specs' | 'docs'>(initialView);
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | 'stage_1' | 'stage_2' | 'published' | 'awarded'>('all');
  const [exportingId, setExportingId] = useState<string | null>(null);

  const getStageName = (stage: number) => {
    return t(`central.deals.stage_${stage}` as any) || `Stage ${stage}`;
  };

  const getMethodLabel = (methodKey?: string) => {
    if (!methodKey) return t('common.method.open_tender');
    const methodMap: Record<string, string> = {
      open_tender: t('common.method.open_tender'),
      restricted_tender: t('common.method.restricted_tender'),
      consultation: t('common.method.consultation'),
      direct_negotiation: t('common.method.direct_negotiation'),
      after_consultation_negotiation: t('common.method.after_consultation_negotiation'),
    };
    return methodMap[methodKey] || methodKey;
  };

  const getNatureLabel = (natureKey?: string) => {
    if (!natureKey) return '';
    const natureMap: Record<string, string> = {
      works: t('common.nature.works'),
      supplies: t('common.nature.supplies'),
      services: t('common.nature.services'),
      studies: t('common.nature.studies'),
    };
    return natureMap[natureKey] || natureKey;
  };

  const getFormLabel = (formKey?: string) => {
    if (!formKey) return '';
    const formMap: Record<string, string> = {
      open: t('common.form.open'),
      restricted: t('common.form.restricted'),
    };
    return formMap[formKey] || formKey;
  };

  const fetchDeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/procurements/deals/');
      const data = res.data;
      const list: DealItem[] = Array.isArray(data) ? data : data?.results || [];
      setDeals(list);
    } catch (err: any) {
      console.error('Failed to fetch deals:', err);
      setError(t('authority.deals.fetch_error'));
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
      alert(t('authority.deals.export_specs_error'));
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
    const stageNum = String(stage).padStart(2, '0');
    const stageLabel = getStageName(stage);
    if (stage === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="size-3 text-amber-600 shrink-0" />
          <span>{stageNum} — {stageLabel}</span>
        </span>
      );
    }
    if (stage === 2) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          <FileText className="size-3 text-blue-600 shrink-0" />
          <span>{stageNum} — {stageLabel}</span>
        </span>
      );
    }
    if (stage >= 3 && stage <= 7) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
          <span>{stageNum} — {stageLabel}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200">
        <FileCheck2 className="size-3 text-blue-700 shrink-0" />
        <span>{stageNum} — {stageLabel}</span>
      </span>
    );
  };

  const renderBudget = (budget: string | number | null) => {
    if (!budget) return <span className="text-xs text-muted-foreground">—</span>;
    const num = typeof budget === 'string' ? parseFloat(budget) : budget;
    if (isNaN(num)) return <span className="text-xs text-muted-foreground">—</span>;
    return (
      <div className="font-mono text-sm font-semibold text-navy-900 tabular-nums">
        <span>{formatCurrency(num, lang)}</span>
      </div>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return intlFormatDate(dateStr, lang);
  };

  return (
    <div className="space-y-6" dir={dir}>
      {/* ─── Hero / Header Banner ────────────────────────────────────────── */}
      <section className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-navy-50 text-navy-800 border border-navy-100">
              <Briefcase className="w-3.5 h-3.5 text-navy-700" />
              {t('authority.deals.eyebrow')}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-3 h-3" />
              {t('authority.deals.tagline')}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-navy-900 tracking-tight">
            {t('authority.deals.title')}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {t('authority.deals.desc')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
          <Button
            onClick={() => setLocation('/authority/deals/new')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('authority.deals.btn_create')}</span>
          </Button>
        </div>
      </section>

      {/* ─── Sub-Navigation Views (Deals Hub Tabs) ────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-bold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveView('deals')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeView === 'deals'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'bg-card text-foreground hover:bg-muted border border-border'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>{t('authority.deals.tab_deals', { count: deals.length })}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('specs')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeView === 'specs'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'bg-card text-foreground hover:bg-muted border border-border'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{t('authority.deals.tab_sanad')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('docs')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeView === 'docs'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'bg-card text-foreground hover:bg-muted border border-border'
          }`}
        >
          <Paperclip className="w-4 h-4" />
          <span>{t('authority.deals.tab_docs')}</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 1: All Deals
          ══════════════════════════════════════════════════════════════════════ */}
      {activeView === 'deals' && (
        <div className="space-y-6">
          {/* Controls: Search & Stage Filters */}
          <section className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${dir === 'rtl' ? 'right-3.5' : 'left-3.5'}`} />
                <Input
                  type="text"
                  placeholder={t('authority.deals.search_placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`py-2 text-sm rounded-xl border-border bg-muted/40 focus:bg-background focus:border-navy-500 transition-colors ${
                    dir === 'rtl' ? 'pe-4 ps-10' : 'ps-10 pe-4'
                  }`}
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
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {t('authority.deals.filter_all', { count: deals.length })}
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
                  {t('authority.deals.filter_planning', { count: deals.filter((d) => d.current_stage === 1).length })}
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
                  {t('authority.deals.filter_specs', { count: deals.filter((d) => d.current_stage === 2).length })}
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
                  {t('authority.deals.filter_announced', { count: deals.filter((d) => d.current_stage >= 3 && d.current_stage <= 7).length })}
                </button>
                <button
                  type="button"
                  onClick={() => setStageFilter('awarded')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                    stageFilter === 'awarded'
                      ? 'bg-navy-900 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-800 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {t('authority.deals.filter_awarding', { count: deals.filter((d) => d.current_stage >= 8).length })}
                </button>
              </div>
            </div>
          </section>

          {/* Deals Table */}
          <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-muted-foreground space-y-3">
                <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">{t('authority.deals.loading')}</span>
              </div>
            ) : error ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <p className="text-xs text-muted-foreground">{error}</p>
                <Button onClick={fetchDeals} variant="outline" className="text-xs">
                  {t('common.retry')}
                </Button>
              </div>
            ) : filteredDeals.length === 0 ? (
              <div className="py-20 px-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-navy-50 text-navy-800 flex items-center justify-center mx-auto border border-navy-100">
                  <Briefcase className="w-8 h-8 text-navy-600" />
                </div>
                <h3 className="text-lg font-bold text-navy-900">
                  {search || stageFilter !== 'all' ? t('authority.deals.empty_search') : t('authority.deals.empty_list')}
                </h3>
                <Button
                  onClick={() => setLocation('/authority/deals/new')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                >
                  <Plus className="w-4 h-4 me-1" />
                  {t('authority.deals.btn_create_first')}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-xs font-bold text-muted-foreground">
                      <th className="px-4 py-4 text-start">{t('authority.deals.col_ref_title')}</th>
                      <th className="px-4 py-4 text-start">{t('authority.deals.col_wilaya_budget')}</th>
                      <th className="px-4 py-4 text-start">{t('authority.deals.col_stage')}</th>
                      <th className="px-4 py-4 text-start">{t('authority.deals.col_updated')}</th>
                      <th className="px-4 py-4 text-end">{t('authority.deals.col_actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredDeals.map((deal) => {
                      const clauses = deal.cahier_specs?.administrative_clauses;
                      const natureLabel = getNatureLabel(clauses?.procurement_nature);
                      const methodLabel = getMethodLabel(clauses?.procurement_method);
                      const formLabel = getFormLabel(clauses?.procurement_form);

                      return (
                        <tr
                          key={deal.id}
                          className="hover:bg-muted/40 transition-colors group cursor-pointer"
                          onClick={() => setLocation(`/authority/deals/${deal.id}`)}
                        >
                          <td className="px-4 py-3">
                            <div className="space-y-1 max-w-lg">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                  {deal.reference_number || t('authority.deals.draft_numbering')}
                                </span>
                                {natureLabel && (
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    {natureLabel}
                                  </span>
                                )}
                                {clauses?.procurement_method && (
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-navy-50 text-navy-800 border border-navy-100">
                                    {methodLabel}
                                    {formLabel ? ` (${formLabel})` : ''}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-bold text-navy-900 group-hover:text-emerald-700 transition-colors line-clamp-1 leading-snug">
                                {deal.title}
                              </p>
                              {deal.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{deal.description}</p>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            {renderBudget(deal.estimated_budget)}
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {deal.wilaya ? t('authority.deals.wilaya_prefix', { wilaya: deal.wilaya }) : t('authority.deals.wilaya_unset')}
                            </div>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            {getStageBadge(deal.current_stage)}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground font-mono">
                            {formatDate(deal.updated_at || deal.created_at)}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap text-end" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                title={t('authority.deals.export_pdf_tooltip')}
                                onClick={(e) => handleExportPdf(e, deal)}
                                disabled={exportingId === deal.id}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-navy-900 hover:bg-muted rounded-lg shrink-0"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => setLocation(`/authority/deals/${deal.id}`)}
                                className="h-8 px-3 rounded-lg bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
                              >
                                <span>{t('authority.deals.open_deal_file')}</span>
                                <ChevronRight className="size-3 shrink-0 rtl:rotate-180" />
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
          VIEW 2: Cahier Specs and Provenance (Sanad Absorbed View)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeView === 'specs' && (
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold text-navy-900">{t('authority.deals.sanad_title')}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {t('authority.deals.sanad_desc')}
              </p>
            </div>
            <span className="text-xs font-bold text-navy-800 bg-navy-50 px-3 py-1 rounded-full border border-navy-100">
              {t('authority.deals.statutory_badge')}
            </span>
          </div>

          <div className="grid gap-3">
            {deals.map((d) => (
              <div
                key={d.id}
                onClick={() => setLocation(`/authority/deals/${d.id}`)}
                className="p-4 rounded-xl border border-border hover:border-navy-300 hover:bg-muted/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground">
                      {d.reference_number || t('authority.deals.draft_label')}
                    </span>
                    <h3 className="font-bold text-navy-900 text-sm">{d.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {d.description || t('authority.deals.no_desc')}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleExportPdf(e, d)}
                    className="border-border text-xs font-bold rounded-xl"
                  >
                    <Download className="w-3.5 h-3.5 me-1 text-emerald-600" />
                    {t('specs.export_pdf')}
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setLocation(`/authority/deals/${d.id}`)}
                    className="bg-navy-900 hover:bg-navy-800 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <span>{t('authority.deals.open_cahier')}</span>
                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 3: General Regulatory Documents & Deeds
          ══════════════════════════════════════════════════════════════════════ */}
      {activeView === 'docs' && (
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-lg font-bold text-navy-900">{t('authority.deals.docs_title')}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {t('authority.deals.docs_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
              <span className="font-bold text-navy-900 text-sm block">{t('authority.deals.doc1_title')}</span>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {t('authority.deals.doc1_desc')}
              </p>
              <div className="pt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  {t('authority.deals.doc1_badge')}
                </span>
                <span className="text-muted-foreground text-xs">{t('authority.deals.doc1_source')}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
              <span className="font-bold text-navy-900 text-sm block">{t('authority.deals.doc2_title')}</span>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {t('authority.deals.doc2_desc')}
              </p>
              <div className="pt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
                  {t('authority.deals.doc2_badge')}
                </span>
                <span className="text-muted-foreground text-xs">{t('authority.deals.doc2_source')}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
              <span className="font-bold text-navy-900 text-sm block">{t('authority.deals.doc3_title')}</span>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {t('authority.deals.doc3_desc')}
              </p>
              <div className="pt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
                  {t('authority.deals.doc3_badge')}
                </span>
                <span className="text-muted-foreground text-xs">{t('authority.deals.doc3_source')}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
              <span className="font-bold text-navy-900 text-sm block">{t('authority.deals.doc4_title')}</span>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {t('authority.deals.doc4_desc')}
              </p>
              <div className="pt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                  {t('authority.deals.doc4_badge')}
                </span>
                <span className="text-muted-foreground text-xs">{t('authority.deals.doc4_source')}</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
