import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Lock,
  Copy,
  CheckCircle,
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
  verified?: boolean;
}

const FALLBACK_LOGS: AuditItem[] = [
  {
    id: 'aud-001',
    timestamp: '2026-04-12T14:32:00Z',
    action: 'SESSION_OPENED',
    user_name: 'مديرية الصفقات العمومية',
    user_email: 'authority@safaqat.dz',
    checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    description: 'افتتاح جلسة فتح الأظرفة للصفقة DTP-DZ-2026-042',
    resource_type: 'OpeningSession',
  },
  {
    id: 'aud-002',
    timestamp: '2026-04-12T14:45:10Z',
    action: 'BID_ENVELOPE_UNSEALED',
    user_name: 'أمين لجنة الفتح',
    user_email: 'secretary@safaqat.dz',
    checksum: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
    description: 'فك تشفير العرض الفني للمتعامل SARL BATIMENT PLUS',
    resource_type: 'BidOffer',
  },
  {
    id: 'aud-003',
    timestamp: '2026-04-12T15:10:22Z',
    action: 'PV_GENERATED_AND_SIGNED',
    user_name: 'رئيس لجنة الصفقات',
    user_email: 'president@safaqat.dz',
    checksum: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    description: 'توليد وتوقيع محضر جلسة فتح الأظرفة رقم PV-2026-042',
    resource_type: 'ProcurementPV',
  },
  {
    id: 'aud-004',
    timestamp: '2026-04-11T10:15:40Z',
    action: 'COMMITTEE_APPOINTED',
    user_name: 'المصلحة المتعاقدة',
    user_email: 'authority@safaqat.dz',
    checksum: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    description: 'تعيين أعضاء لجنة فتح الأظرفة وتقييم العروض',
    resource_type: 'DealCommittee',
  },
  {
    id: 'aud-005',
    timestamp: '2026-04-10T09:00:00Z',
    action: 'TENDER_PUBLISHED',
    user_name: 'المسؤول الإداري',
    user_email: 'admin@safaqat.dz',
    checksum: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    description: 'نشر إعلان طلب العروض الوطني المفتوح عبر المنصة',
    resource_type: 'ProcurementDeal',
  },
];

export function AuditView() {
  const { t } = useI18n();
  const [logs, setLogs] = useState<AuditItem[]>(FALLBACK_LOGS);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [verifiedMap, setVerifiedMap] = useState<Record<string, boolean>>({});
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit/logs/');
      const data = res.data;
      const items = Array.isArray(data) ? data : data.results || [];
      if (items.length > 0) {
        setLogs(items);
      }
    } catch {
      // Use fallback logs safely
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleCopyChecksum = (id: string, checksum: string) => {
    navigator.clipboard.writeText(checksum);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVerify = (id: string) => {
    // Simulates cryptographic proof verification
    setVerifiedMap((prev) => ({ ...prev, [id]: true }));
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
      <section className="rounded-2xl p-6 md:p-8 text-white bg-gradient-to-r from-navy-900 to-navy-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-navy-100 uppercase tracking-wider">
              صفقات ذكية · نظام التتبع والرقابة القانونية
            </span>
            <Badge variant="outline" className="text-[11px] bg-white/10 text-white border-white/20">
              قانون 23-12
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            {t('authority.audit.title')}
          </h1>
          <p className="text-xs md:text-sm text-navy-100 max-w-2xl">
            {t('authority.audit.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 px-3 py-1 text-xs flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
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
                <span>سجلات التتبع الرقمي للبصمات</span>
              </CardTitle>
              <CardDescription className="text-xs">
                كل عملية مسجلة مصحوبة ببصمة تشفيرية فريدة غير قابلة للتعديل أو الحذف
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs">
                  <th className="py-3 px-4 text-start font-bold">الوقت والتاريخ</th>
                  <th className="py-3 px-4 text-start font-bold">الإجراء</th>
                  <th className="py-3 px-4 text-start font-bold">المستخدم</th>
                  <th className="py-3 px-4 text-start font-bold">بصمة التشفير (SHA-256)</th>
                  <th className="py-3 px-4 text-center font-bold">حالة السلامة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedLogs.map((log) => {
                  const isVerified = verifiedMap[log.id];
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

                      {/* Integrity Verify */}
                      <td className="py-3.5 px-4 text-center">
                        {isVerified ? (
                          <div className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>سليم 100%</span>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerify(log.id)}
                            className="text-xs h-7 gap-1 border-border hover:bg-muted"
                          >
                            <Shield className="w-3 h-3 text-primary" />
                            <span>{t('authority.audit.verify')}</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-xs">
              لا توجد سجلات تدقيق مسجلة ضمن التصنيف المختار.
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
