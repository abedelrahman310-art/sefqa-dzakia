import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Archive,
  Copy,
  Filter,
  Check,
  ChevronRight,
  ChevronLeft,
  RotateCw,
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

export function AuditView() {
  const { t, lang, dir } = useI18n();
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

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

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleCopyChecksum = (id: string, checksum: string) => {
    if (!checksum) return;
    void navigator.clipboard.writeText(checksum);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Banner */}
      <section className="rounded-2xl p-6 md:p-8 text-white bg-navy-900 border border-navy-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-navy-100">
              {t('authority.audit.tagline')}
            </span>
            <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/20">
              {t('authority.audit.law_badge')}
            </Badge>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            {t('authority.audit.title')}
          </h1>
          <p className="text-xs md:text-sm text-navy-100 max-w-2xl">
            {t('authority.audit.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 px-3 py-1 text-xs flex items-center gap-1.5">
            <Archive className="w-3.5 h-3.5" />
            <span>{t('authority.audit.immutable')}</span>
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAuditLogs}
            disabled={loading}
            className="text-white border-white/20 bg-white/10 hover:bg-white/20 text-xs gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('authority.audit.refresh')}</span>
          </Button>
        </div>
      </section>

      {/* Main Table Card */}
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
    </div>
  );
}
