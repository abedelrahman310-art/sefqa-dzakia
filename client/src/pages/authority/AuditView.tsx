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
  const { t } = useI18n();
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
      setError(err?.response?.data?.detail || 'تعذر تحميل سجلات التدقيق من الخادم.');
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
              صفقات ذكية · نظام التتبع والرقابة القانونية
            </span>
            <Badge variant="outline" className="text-[11px] bg-white/10 text-white border-white/20">
              قانون 23-12
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
            <span>تحديث السجل</span>
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
                <span>سجلات الأرشفة وبصمات التحقق</span>
              </CardTitle>
              <CardDescription className="text-xs">
                كل عملية مسجلة مصحوبة ببصمة تحقق (Hash) فريدة، وتُحفظ في سجل التدقيق لأغراض الأرشفة والمراجعة.
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
                <option value="all">جميع الإجراءات</option>
                <option value="SESSION">جلسات الفتح</option>
                <option value="PV">محاضر الفتح والتقييم</option>
                <option value="COMMITTEE">تعيين اللجان</option>
                <option value="TENDER">إعلانات الصفقات</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs flex items-center justify-between">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={loadAuditLogs} className="h-7 text-xs">
                إعادة المحاولة
              </Button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs">
                  <th className="py-3 px-4 text-start font-bold">الوقت والتاريخ</th>
                  <th className="py-3 px-4 text-start font-bold">الإجراء</th>
                  <th className="py-3 px-4 text-start font-bold">المستخدم</th>
                  <th className="py-3 px-4 text-start font-bold">بصمة التحقق (SHA-256)</th>
                  <th className="py-3 px-4 text-center font-bold">حالة الأرشفة</th>
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
                      <td className="py-3.5 px-4 text-xs font-mono text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString('ar-DZ')}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {getActionBadge(log.action)}
                          {log.description && (
                            <div className="text-[11px] text-muted-foreground max-w-xs truncate">
                              {log.description}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-semibold text-foreground">
                          {log.user_name || log.user_email || 'مستخدم النظام'}
                        </div>
                        {log.user_email && (
                          <div className="text-[11px] text-muted-foreground">{log.user_email}</div>
                        )}
                      </td>

                      {/* SHA-256 with copy */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono tabular-nums bg-muted px-2 py-1 rounded text-foreground border border-border">
                            {truncatedChecksum}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyChecksum(log.id, log.checksum)}
                            disabled={!log.checksum}
                            title="نسخ البصمة الكاملة"
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
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          <Archive className="w-3.5 h-3.5" />
                          <span>مؤرشف</span>
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
              لا توجد سجلات تدقيق مسجلة ضمن التصنيف المختار.
            </div>
          )}

          {loading && (
            <div className="py-12 text-center text-muted-foreground text-xs">
              جارٍ تحميل سجلات التدقيق من الخادم…
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-4 flex items-center justify-between border-t border-border mt-4 text-xs">
              <span className="text-muted-foreground">
                الصفحة {currentPage} من {totalPages} ({filteredLogs.length} سجل إجمالي)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 text-xs gap-1"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>السابق</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 text-xs gap-1"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
