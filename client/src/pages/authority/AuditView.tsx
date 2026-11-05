import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Shield,
  Archive,
  Copy,
  Filter,
  Check,
  ChevronRight,
  ChevronLeft,
  RotateCw,
  Gavel,
  AlertOctagon,
  AlertTriangle,
  Download,
  FileText,
  Clock,
  CheckCircle2,
  Send,
  Eye,
  FileCheck,
  Scale,
} from 'lucide-react';

interface AuditItem {
  id: string;
  timestamp: string;
  action: string;
  user_name?: string;
  user_email?: string;
  checksum: string;
  description?: string;
  resource_type?: string;
}

interface InjunctionItem {
  id: string;
  reference: string;
  authority_name?: string;
  authority_entity?: string;
  deal?: string | null;
  deal_title?: string | null;
  deal_ref?: string | null;
  violation_type: string;
  violation_type_display: string;
  legal_reference: string;
  directive_text: string;
  violation_details?: string;
  issued_date: string;
  deadline_days: number;
  deadline_date: string;
  days_remaining: number;
  is_expired: boolean;
  status: 'issued' | 'acknowledged' | 'resolved' | 'escalated_to_court';
  status_display: string;
  issued_by_name?: string;
  authority_response?: string;
  response_attachment?: string | null;
  responded_at?: string | null;
  escalated_at?: string | null;
  escalation_reason?: string | null;
  document_pdf?: string | null;
}

export function AuditView() {
  const { t, lang, dir } = useI18n();
  const [activeTab, setActiveTab] = useState<'audit' | 'injunctions'>('audit');

  // Audit Logs State
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  // Injunctions State
  const [injunctions, setInjunctions] = useState<InjunctionItem[]>([]);
  const [injunctionsLoading, setInjunctionsLoading] = useState(false);
  const [injunctionStats, setInjunctionStats] = useState({
    total: 0,
    active: 0,
    resolved: 0,
    escalated: 0,
  });

  // Modal State
  const [respondModalOpen, setRespondModalOpen] = useState(false);
  const [selectedInjunction, setSelectedInjunction] = useState<InjunctionItem | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseFile, setResponseFile] = useState<File | null>(null);
  const [submittingResponse, setSubmittingResponse] = useState(false);

  const [viewResponseModalOpen, setViewResponseModalOpen] = useState(false);

  // Check URL tab parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'injunctions') {
      setActiveTab('injunctions');
    }
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/audit/logs/');
      const data = res.data;
      const items = Array.isArray(data) ? data : data.results || [];
      setLogs(items);
    } catch (err: any) {
      setError(err?.response?.data?.detail || t('authority.audit.load_error'));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadInjunctions = async () => {
    setInjunctionsLoading(true);
    try {
      const res = await api.get('/procurements/my-injunctions/');
      const list: InjunctionItem[] = Array.isArray(res.data?.injunctions)
        ? res.data.injunctions
        : Array.isArray(res.data?.results)
        ? res.data.results
        : [];
      setInjunctions(list);

      const total = list.length;
      const active = list.filter((i) => i.status === 'issued' || i.status === 'acknowledged').length;
      const resolved = list.filter((i) => i.status === 'resolved').length;
      const escalated = list.filter((i) => i.status === 'escalated_to_court').length;

      setInjunctionStats({ total, active, resolved, escalated });
    } catch (err) {
      // In case of error
      setInjunctions([]);
    } finally {
      setInjunctionsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
    loadInjunctions();
  }, []);

  const handleCopyChecksum = (id: string, checksum: string) => {
    if (!checksum) return;
    void navigator.clipboard.writeText(checksum);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadPdf = async (inj: InjunctionItem) => {
    try {
      const res = await api.get(`/procurements/injunctions/${inj.id}/pdf/`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Injonction_${inj.reference}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(lang === 'ar' ? 'تعذر تحميل وثيقة الإعذار' : 'Impossible de télécharger le document');
    }
  };

  const handleAcknowledge = async (inj: InjunctionItem) => {
    try {
      await api.patch(`/procurements/injunctions/${inj.id}/acknowledge/`);
      toast.success(lang === 'ar' ? 'تم تأكيد الاستلام بنجاح وفق المادة 67' : 'Accusé de réception enregistré (Art. 67)');
      loadInjunctions();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || (lang === 'ar' ? 'فشل تأكيد الاستلام' : 'Échec de l\'accusé'));
    }
  };

  const openRespondModal = (inj: InjunctionItem) => {
    setSelectedInjunction(inj);
    setResponseText(inj.authority_response || '');
    setResponseFile(null);
    setRespondModalOpen(true);
  };

  const openViewResponseModal = (inj: InjunctionItem) => {
    setSelectedInjunction(inj);
    setViewResponseModalOpen(true);
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInjunction) return;
    if (!responseText.trim() && !responseFile) {
      toast.error(lang === 'ar' ? 'يرجى كتابة نص التقرير أو إرفاق ملف PDF' : 'Veuillez saisir un rapport ou joindre un PDF');
      return;
    }

    setSubmittingResponse(true);
    try {
      const formData = new FormData();
      if (responseText.trim()) {
        formData.append('authority_response', responseText.trim());
      }
      if (responseFile) {
        formData.append('authority_response_file', responseFile);
      }

      await api.patch(`/procurements/injunctions/${selectedInjunction.id}/respond/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(lang === 'ar' ? 'تم إيداع تقرير التصحيح بنجاح واعتماد التسوية' : 'Rapport de régularisation soumis avec succès');
      setRespondModalOpen(false);
      setSelectedInjunction(null);
      setResponseText('');
      setResponseFile(null);
      loadInjunctions();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || (lang === 'ar' ? 'فشل إيداع التقرير' : 'Échec de la soumission'));
    } finally {
      setSubmittingResponse(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (selectedAction === 'all') return true;
    return log.action.toLowerCase().includes(selectedAction.toLowerCase());
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getActionBadge = (action: string) => {
    if (action.includes('OPEN') || action.includes('UNSEAL')) {
      return <Badge className="bg-blue-500/15 text-blue-700 border-blue-200">{action}</Badge>;
    }
    if (action.includes('SIGN') || action.includes('PV')) {
      return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200">{action}</Badge>;
    }
    if (action.includes('DELETE') || action.includes('REJECT')) {
      return <Badge className="bg-destructive/15 text-destructive border-destructive/20">{action}</Badge>;
    }
    return <Badge variant="secondary">{action}</Badge>;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto" dir={dir}>
      {/* Banner */}
      <section className="rounded-2xl p-6 md:p-8 bg-white border border-slate-200/90 text-slate-900 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800">
              {t('authority.audit.tagline')}
            </span>
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold">
              {t('authority.audit.law_badge')}
            </Badge>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900">
            {activeTab === 'audit' ? t('authority.audit.title') : t('authority.injunctions.title')}
          </h1>
          <p className="text-xs md:text-sm text-slate-600 max-w-2xl leading-relaxed font-medium">
            {activeTab === 'audit'
              ? t('authority.audit.subtitle')
              : (lang === 'ar'
                  ? 'متابعة الإعذارات الإدارية الملزمة الصادرة من عين الصقر وتقديم تقارير التصحيح لتفادي الإحالة القضائية'
                  : 'Suivi des injonctions de régularisation émises par Hawk Eye et soumission des rapports correctifs')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 px-3 py-1 text-xs flex items-center gap-1.5 font-bold shadow-2xs">
            <Archive className="w-3.5 h-3.5" />
            <span>{t('authority.audit.immutable')}</span>
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeTab === 'audit') loadAuditLogs();
              else loadInjunctions();
            }}
            disabled={loading || injunctionsLoading}
            className="text-slate-700 border-slate-200 bg-white hover:bg-slate-50 text-xs gap-1.5 shadow-2xs font-bold cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${(loading || injunctionsLoading) ? 'animate-spin' : ''}`} />
            <span>{t('authority.audit.refresh')}</span>
          </Button>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>{lang === 'ar' ? 'سجل التدقيق الجنائي والمطابقة' : 'Journal d\'audit légal'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('injunctions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === 'injunctions'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Gavel className="w-4 h-4" />
          <span>{lang === 'ar' ? 'الإعذارات الرقابية المركزية (عين الصقر)' : 'Injonctions Hawk Eye'}</span>
          {(injunctionStats.active > 0 || injunctionStats.escalated > 0) && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                injunctionStats.escalated > 0
                  ? 'bg-rose-500 text-white'
                  : 'bg-amber-500 text-stone-950'
              }`}
            >
              {injunctionStats.escalated > 0 ? injunctionStats.escalated : injunctionStats.active}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Audit Log Table */}
      {activeTab === 'audit' && (
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span>{t('authority.audit.card_title')}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {t('authority.audit.card_desc')}
                </CardDescription>
              </div>

              {/* Filter by action */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={selectedAction}
                  onChange={(e) => {
                    setSelectedAction(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">{t('authority.audit.filter_all')}</option>
                  <option value="SESSION">{t('authority.audit.filter_session')}</option>
                  <option value="PV">{t('authority.audit.filter_pv')}</option>
                  <option value="COMMITTEE">{t('authority.audit.filter_committee')}</option>
                  <option value="TENDER">{t('authority.audit.filter_tender')}</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs flex items-center justify-between">
                <span>{error}</span>
                <Button size="sm" variant="outline" onClick={loadAuditLogs} className="h-7 text-xs">
                  {t('authority.audit.retry')}
                </Button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs">
                    <th className="px-4 py-4 text-start font-bold">{t('authority.audit.th_time')}</th>
                    <th className="px-4 py-4 text-start font-bold">{t('authority.audit.th_action')}</th>
                    <th className="px-4 py-4 text-start font-bold">{t('authority.audit.th_user')}</th>
                    <th className="px-4 py-4 text-start font-bold">{t('authority.audit.th_checksum')}</th>
                    <th className="px-4 py-4 text-center font-bold">{t('authority.audit.th_status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedLogs.map((log) => {
                    const truncatedChecksum = log.checksum
                      ? `${log.checksum.slice(0, 10)}...${log.checksum.slice(-8)}`
                      : 'N/A';

                    return (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        {/* Timestamp */}
                        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {getActionBadge(log.action)}
                            {log.description && (
                              <div className="text-xs text-muted-foreground max-w-xs truncate">
                                {log.description}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* User */}
                        <td className="px-4 py-3 text-xs">
                          <div className="font-semibold text-foreground">
                            {log.user_name || log.user_email || t('authority.audit.default_user')}
                          </div>
                          {log.user_email && (
                            <div className="text-xs text-muted-foreground">{log.user_email}</div>
                          )}
                        </td>

                        {/* SHA-256 with copy */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono tabular-nums bg-muted px-2 py-1 rounded text-foreground border border-border">
                              {truncatedChecksum}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyChecksum(log.id, log.checksum)}
                              disabled={!log.checksum}
                              title={t('authority.audit.copy_tooltip')}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            >
                              {copiedId === log.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                        </td>

                        {/* Archive status */}
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <Archive className="w-3.5 h-3.5" />
                            <span>{t('authority.audit.archived_badge')}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredLogs.length === 0 && !error && !loading && (
              <div className="py-12 text-center text-muted-foreground text-xs">
                {t('authority.audit.empty')}
              </div>
            )}

            {loading && (
              <div className="py-12 text-center text-muted-foreground text-xs">
                {t('authority.audit.loading')}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-4 flex items-center justify-between border-t border-border mt-4 text-xs">
                <span className="text-muted-foreground">
                  {t('authority.audit.pagination_info', { current: currentPage, total: totalPages, count: filteredLogs.length })}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-8 text-xs gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                    <span>{t('authority.audit.prev')}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 text-xs gap-1"
                  >
                    <span>{t('authority.audit.next')}</span>
                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Injunctions Workspace */}
      {activeTab === 'injunctions' && (
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border-border bg-card">
              <div className="text-xs text-muted-foreground font-semibold">
                {lang === 'ar' ? 'إجمالي الإعذارات' : 'Total des injonctions'}
              </div>
              <div className="text-2xl font-black mt-1 text-foreground">
                {injunctionStats.total}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {lang === 'ar' ? 'سجل الرقابة المركزية' : 'Contrôle centralisé'}
              </div>
            </Card>

            <Card className="p-4 border-amber-300 dark:border-amber-800 bg-amber-500/10">
              <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'نشطة قيد المهلة' : 'Actives (en cours)'}</span>
              </div>
              <div className="text-2xl font-black mt-1 text-amber-900 dark:text-amber-200">
                {injunctionStats.active}
              </div>
              <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1">
                {lang === 'ar' ? 'مهلة 15 يوماً للتصحيح' : 'Délai légal de 15 jours'}
              </div>
            </Card>

            <Card className="p-4 border-emerald-300 dark:border-emerald-800 bg-emerald-500/10">
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تمت التسوية' : 'Régularisées'}</span>
              </div>
              <div className="text-2xl font-black mt-1 text-emerald-900 dark:text-emerald-200">
                {injunctionStats.resolved}
              </div>
              <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                {lang === 'ar' ? 'تم قبول تقرير التصحيح' : 'Rapports conformes'}
              </div>
            </Card>

            <Card className="p-4 border-rose-300 dark:border-rose-800 bg-rose-500/10">
              <div className="text-xs text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'محالة للقضاء' : 'Transmises à la justice'}</span>
              </div>
              <div className="text-2xl font-black mt-1 text-rose-900 dark:text-rose-200">
                {injunctionStats.escalated}
              </div>
              <div className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-1">
                {lang === 'ar' ? 'انتهت المهلة دون رد' : 'Délai expiré sans réponse'}
              </div>
            </Card>
          </div>

          {/* Injunctions Table */}
          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Gavel className="w-5 h-5 text-primary" />
                    <span>{t('authority.injunctions.title')}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {lang === 'ar'
                      ? 'الأوامر الرقابية الصادرة وفقاً للمادة 13 من القانون 23-12 والمادتين 138 و139 من المرسوم 15-247'
                      : 'Injonctions administratives de régularisation émises par l\'Administration Centrale'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {injunctionsLoading ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  {lang === 'ar' ? 'جاري تحميل سجل الإعذارات...' : 'Chargement des injonctions...'}
                </div>
              ) : injunctions.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <span className="font-semibold">
                    {lang === 'ar'
                      ? 'لا توجد أي إعذارات رقابية مسجلة ضد المصلحة المتعاقدة. الوضع القانوني سليم تماماً.'
                      : 'Aucune injonction administrative en cours. Conformité totale.'}
                  </span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-start border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                        <th className="px-3 py-3 text-start font-bold">{lang === 'ar' ? 'المرجع والصفقة' : 'Réf & Marché'}</th>
                        <th className="px-3 py-3 text-start font-bold">{lang === 'ar' ? 'نوع المخالفة والسند' : 'Infraction & Base légale'}</th>
                        <th className="px-3 py-3 text-start font-bold">{lang === 'ar' ? 'الأمر الرقابي للتصحيح' : 'Injonction de régularisation'}</th>
                        <th className="px-3 py-3 text-start font-bold">{lang === 'ar' ? 'المهلة المتبقية' : 'Délai'}</th>
                        <th className="px-3 py-3 text-center font-bold">{lang === 'ar' ? 'الحالة' : 'Statut'}</th>
                        <th className="px-3 py-3 text-end font-bold">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {injunctions.map((inj) => {
                        return (
                          <tr key={inj.id} className="hover:bg-muted/20 transition-colors">
                            {/* Reference and Deal */}
                            <td className="px-3 py-3">
                              <div className="font-mono font-bold text-foreground">{inj.reference}</div>
                              {inj.deal_title && (
                                <div className="text-[11px] text-muted-foreground max-w-[180px] truncate" title={inj.deal_title}>
                                  {inj.deal_title}
                                </div>
                              )}
                              <div className="text-[10px] text-muted-foreground">
                                {lang === 'ar' ? 'صدر في:' : 'Émis le:'} {inj.issued_date}
                              </div>
                            </td>

                            {/* Violation Type */}
                            <td className="px-3 py-3">
                              <div className="font-semibold text-foreground">
                                {inj.violation_type_display || inj.violation_type}
                              </div>
                              <div className="text-[10px] font-mono text-primary font-bold mt-0.5">
                                {inj.legal_reference}
                              </div>
                            </td>

                            {/* Directive text */}
                            <td className="px-3 py-3 max-w-[260px]">
                              <p className="line-clamp-2 text-foreground/90 leading-relaxed text-[11px]">
                                {inj.directive_text}
                              </p>
                            </td>

                            {/* Deadline */}
                            <td className="px-3 py-3 whitespace-nowrap">
                              {inj.status === 'resolved' ? (
                                <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 text-[10px]">
                                  {lang === 'ar' ? 'تمت التسوية' : 'Régularisé'}
                                </Badge>
                              ) : inj.status === 'escalated_to_court' ? (
                                <Badge className="bg-rose-500/15 text-rose-700 border-rose-300 text-[10px] animate-pulse">
                                  {lang === 'ar' ? 'انتهت المهلة' : 'Expiré'}
                                </Badge>
                              ) : (
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>
                                      {lang === 'ar'
                                        ? `متبقي ${inj.days_remaining} يوم`
                                        : `${inj.days_remaining} j restants`}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {lang === 'ar' ? 'حتى' : 'Jusqu\'au'} {inj.deadline_date}
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-3 py-3 text-center whitespace-nowrap">
                              {inj.status === 'issued' && (
                                <Badge className="bg-amber-500/15 text-amber-800 border-amber-300 text-[10px]">
                                  {lang === 'ar' ? 'صادر وقيد المهلة' : 'Émis (en cours)'}
                                </Badge>
                              )}
                              {inj.status === 'acknowledged' && (
                                <Badge className="bg-blue-500/15 text-blue-700 border-blue-200 text-[10px]">
                                  {lang === 'ar' ? 'مستلم ومقر به' : 'Accusé de réception'}
                                </Badge>
                              )}
                              {inj.status === 'resolved' && (
                                <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 text-[10px]">
                                  {lang === 'ar' ? 'تم تقديم تقرير التصحيح' : 'Régularisé'}
                                </Badge>
                              )}
                              {inj.status === 'escalated_to_court' && (
                                <Badge className="bg-rose-500/20 text-rose-800 border-rose-400 text-[10px] font-bold">
                                  {lang === 'ar' ? 'محال للقضاء' : 'Transmis à la justice'}
                                </Badge>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-3 py-3 text-end whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Download PDF */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadPdf(inj)}
                                  title={lang === 'ar' ? 'تحميل وثيقة الإعذار الرسمية PDF' : 'Télécharger l\'injonction PDF'}
                                  className="h-7 px-2 text-[11px] gap-1"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>PDF</span>
                                </Button>

                                {/* Acknowledge receipt if issued */}
                                {inj.status === 'issued' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAcknowledge(inj)}
                                    title={lang === 'ar' ? 'تأكيد استلام الإعذار (مادة 67)' : 'Accuser réception (Art. 67)'}
                                    className="h-7 px-2 text-[11px] border-blue-300 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 gap-1"
                                  >
                                    <FileCheck className="w-3 h-3" />
                                    <span>{lang === 'ar' ? 'إقرار بالاستلام' : 'Accuser réception'}</span>
                                  </Button>
                                )}

                                {/* Respond button */}
                                {inj.status !== 'resolved' ? (
                                  <Button
                                    size="sm"
                                    onClick={() => openRespondModal(inj)}
                                    className={`h-7 px-2.5 text-[11px] font-bold gap-1 shadow-sm ${
                                      inj.status === 'escalated_to_court'
                                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                                        : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                                    }`}
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>{t('authority.injunctions.respond')}</span>
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openViewResponseModal(inj)}
                                    className="h-7 px-2 text-[11px] text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>{lang === 'ar' ? 'عرض الرد المودع' : 'Voir la réponse'}</span>
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal: Submit Rectification Report */}
      <Dialog open={respondModalOpen} onOpenChange={setRespondModalOpen}>
        <DialogContent className="sm:max-w-xl" dir={dir}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Gavel className="w-5 h-5 text-primary" />
              <span>
                {lang === 'ar'
                  ? `إيداع تقرير التصحيح والرد على الإعذار ${selectedInjunction?.reference || ''}`
                  : `Dépôt du rapport de régularisation - ${selectedInjunction?.reference || ''}`}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {lang === 'ar'
                ? 'وفقاً لأحكام المادة 67 من القانون 23-12، يُعتمد هذا التقرير كإجراء رسمي ملزم يثبت تسوية المخالفة الرقابية.'
                : 'Conformément à l\'article 67 de la loi 23-12, ce rapport formalise la régularisation requise.'}
            </DialogDescription>
          </DialogHeader>

          {selectedInjunction && (
            <div className="p-3 rounded-lg bg-muted/60 border border-border text-xs space-y-1">
              <div className="font-semibold text-foreground">
                {lang === 'ar' ? 'المخالفة المسجلة:' : 'Infraction:'} {selectedInjunction.violation_type_display}
              </div>
              <div className="text-muted-foreground">
                <span className="font-mono text-primary font-bold">{selectedInjunction.legal_reference}</span>
                {' — '}
                {selectedInjunction.directive_text}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitResponse} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {lang === 'ar' ? 'تقرير التصحيح والإجراءات المتخذة (إلزامي)' : 'Rapport explicatif et mesures correctives (Requis)'}
              </label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
                required
                placeholder={
                  lang === 'ar'
                    ? 'بيّن بالتفصيل الإجراءات التصحيحية المتخذة لتدارك المخالفة وفق التوجيهات الرقابية الصادرة...'
                    : 'Décrivez précisément les mesures correctives prises pour régulariser l\'infraction...'
                }
                className="w-full text-xs rounded-lg border border-input bg-background p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {lang === 'ar' ? 'إرفاق المستند الثبوتي / التقرير المؤشر (PDF)' : 'Document justificatif ou PV signé (PDF)'}
              </label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setResponseFile(e.target.files[0]);
                  }
                }}
                className="w-full text-xs text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              <span className="text-[11px] text-muted-foreground block">
                {lang === 'ar'
                  ? 'يُفضل إرفاق قرار إلغاء التجزئة أو تعديل الملحق أو تقرير لجنة الصفقات موقعاً ومختوماً.'
                  : 'PV de la commission des marchés, décision modificative ou arrêté d\'annulation.'}
              </span>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRespondModalOpen(false)}
                disabled={submittingResponse}
                className="text-xs"
              >
                {lang === 'ar' ? 'إلغاء' : 'Annuler'}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingResponse}
                className="text-xs font-bold gap-1.5"
              >
                {submittingResponse ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{lang === 'ar' ? 'إيداع التقرير واعتماد التسوية' : 'Déposer et régulariser'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: View Submitted Response */}
      <Dialog open={viewResponseModalOpen} onOpenChange={setViewResponseModalOpen}>
        <DialogContent className="sm:max-w-lg" dir={dir}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {lang === 'ar'
                  ? `تقرير التصحيح المودع - ${selectedInjunction?.reference || ''}`
                  : `Rapport de régularisation déposé - ${selectedInjunction?.reference || ''}`}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {lang === 'ar'
                ? `تم إيداع هذا التقرير بتاريخ ${selectedInjunction?.responded_at ? new Date(selectedInjunction.responded_at).toLocaleString('ar-DZ') : ''}`
                : `Déposé le ${selectedInjunction?.responded_at || ''}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-lg bg-muted border border-border text-xs leading-relaxed text-foreground whitespace-pre-wrap">
              {selectedInjunction?.authority_response || (lang === 'ar' ? 'لا يوجد نص مرفق.' : 'Aucun texte.')}
            </div>

            {selectedInjunction?.response_attachment && (
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-xs">
                <span className="flex items-center gap-1.5 text-foreground font-semibold">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>{lang === 'ar' ? 'المستند الثبوتي المرفق' : 'Pièce justificative'}</span>
                </span>
                <a
                  href={selectedInjunction.response_attachment}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-bold"
                >
                  {lang === 'ar' ? 'فتح وتحميل الملف' : 'Ouvrir'}
                </a>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewResponseModalOpen(false)}
              className="text-xs"
            >
              {lang === 'ar' ? 'إغلاق' : 'Fermer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}