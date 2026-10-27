import { useMemo, useState } from 'react';
import { PageHeader, KpiCard } from '@/shared/components';
import {
  Shield,
  Users,
  History,
  Activity,
  Search,
  RefreshCw,
  Lock,
  ChevronRight,
  ChevronLeft,
  Fingerprint,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  fetchCentralAuditLogs,
  useCentralResource,
  type CentralAuditLogRow,
} from './centralApi';
import { TableState, formatDateTime, formatNumber } from './centralUi';

/**
 * صلاحيات المراقبة وسجل التدقيق القانوني.
 *
 * سجل التدقيق يُقرأ من GET /api/audit/logs/ (غير قابل للتعديل أو الحذف في الخادم).
 * إدارة حسابات المراقبين ومنح دور central_admin تتم من لوحة الإدارة المحمية
 * `/admin/` لأنها عملية إدارية حساسة لا تُنجَز من واجهة API عامة.
 */

const PAGE_SIZE = 15;
const DAY_MS = 24 * 60 * 60 * 1000;

interface ReviewerActivity {
  key: string;
  name: string;
  email: string;
  actionsCount: number;
  actionTypes: number;
  lastActivity: number;
  firstActivity: number;
}

function buildReviewers(logs: CentralAuditLogRow[]): ReviewerActivity[] {
  const buckets = new Map<
    string,
    {
      name: string;
      email: string;
      count: number;
      actions: Set<string>;
      last: number;
      first: number;
    }
  >();

  for (const log of logs) {
    const email = (log.user_email ?? '').trim();
    const name = (log.user_name ?? '').trim();
    const key = email || log.user || 'system';
    const timestamp = new Date(log.timestamp).getTime();
    const safeTimestamp = Number.isNaN(timestamp) ? 0 : timestamp;

    const current = buckets.get(key) ?? {
      name: name || 'حساب غير معروف',
      email: email || '—',
      count: 0,
      actions: new Set<string>(),
      last: safeTimestamp,
      first: safeTimestamp,
    };

    current.count += 1;
    if (log.action) current.actions.add(log.action);
    current.last = Math.max(current.last, safeTimestamp);
    current.first =
      current.first === 0 ? safeTimestamp : Math.min(current.first, safeTimestamp);
    if (!current.name && name) current.name = name;
    buckets.set(key, current);
  }

  return Array.from(buckets.entries())
    .map(([key, value]) => ({
      key,
      name: value.name,
      email: value.email,
      actionsCount: value.count,
      actionTypes: value.actions.size,
      lastActivity: value.last,
      firstActivity: value.first,
    }))
    .sort((a, b) => b.actionsCount - a.actionsCount);
}

export function CentralPermissions() {
  const { data, loading, error, reload } = useCentralResource(fetchCentralAuditLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResource, setFilterResource] = useState('all');
  const [page, setPage] = useState(1);

  const logs = useMemo(() => data ?? [], [data]);
  const reviewers = useMemo(() => buildReviewers(logs), [logs]);

  const stats = useMemo(() => {
    const now = Date.now();
    const last24h = logs.filter((log) => {
      const timestamp = new Date(log.timestamp).getTime();
      return !Number.isNaN(timestamp) && now - timestamp <= DAY_MS;
    }).length;
    const actionTypes = new Set(logs.map((log) => log.action).filter(Boolean)).size;
    return { total: logs.length, last24h, actionTypes, reviewers: reviewers.length };
  }, [logs, reviewers]);

  const resourceTypes = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.resource_type).filter(Boolean))).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return logs.filter((log) => {
      if (filterResource !== 'all' && log.resource_type !== filterResource) return false;
      if (!query) return true;
      return (
        (log.action ?? '').toLowerCase().includes(query) ||
        (log.description ?? '').toLowerCase().includes(query) ||
        (log.user_email ?? '').toLowerCase().includes(query) ||
        (log.user_name ?? '').toLowerCase().includes(query) ||
        (log.resource_id ?? '').toLowerCase().includes(query)
      );
    });
  }, [logs, searchQuery, filterResource]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-4" dir="rtl">
      <PageHeader
        title="الصلاحيات وسجل التدقيق"
        titleClassName="text-xl font-bold"
        description="إدارة حسابات المراقبين ومتابعة سجل التدقيق القانوني غير القابل للتعديل: كل عملية حساسة في المنصة تُختم ببصمة رقمية ولا يمكن تعديلها أو حذفها."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={loading}
            className="text-xs h-8"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            تحديث السجل
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          eyebrow="سجلات التدقيق"
          value={formatNumber(stats.total)}
          icon={History}
          accent="navy"
          description="سجلات محفوظة وغير قابلة للتعديل"
        />
        <KpiCard
          eyebrow="حسابات نشطة في السجل"
          value={formatNumber(stats.reviewers)}
          icon={Users}
          accent="emerald"
          description="حسابات نفّذت عمليات مسجّلة"
        />
        <KpiCard
          eyebrow="عمليات آخر 24 ساعة"
          value={formatNumber(stats.last24h)}
          icon={Activity}
          accent="gold"
          description="نشاط رقابي حديث"
        />
        <KpiCard
          eyebrow="أنواع العمليات"
          value={formatNumber(stats.actionTypes)}
          icon={Fingerprint}
          accent="red"
          description="تصنيفات عمليات مختلفة مسجّلة"
        />
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-2.5 text-xs leading-relaxed text-[var(--ink-700)] shadow-sm">
        <Lock className="mt-0.5 size-4 shrink-0 text-[var(--stamp-green-700)]" aria-hidden="true" />
        <p>
          إنشاء حسابات المراقبين ومنح دور <span className="font-mono">central_admin</span> عملية
          إدارية حساسة تُنجَز من لوحة الإدارة المحمية <span className="font-mono">/admin/</span>{' '}
          عبر مسؤول النظام، ولا توجد نقطة API عامة للتحكم في الحسابات — وهذا قيد أمني مقصود. هذا
          الفضاء يعرض الحسابات التي نفّذت عمليات فعلية في سجل التدقيق.
        </p>
      </div>

      <Card className="bg-white shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-200 pb-3">
          <CardTitle className="text-base font-bold text-[var(--ink-900)]">
            حسابات المراقبة النشطة
          </CardTitle>
          <CardDescription className="mt-0.5 text-xs text-[var(--ink-500)]">
            مستخرجة من سجل التدقيق الفعلي — عدد العمليات وآخر نشاط لكل حساب
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">الحساب</TableHead>
                <TableHead className="min-w-[200px]">البريد الإلكتروني</TableHead>
                <TableHead className="text-center">العمليات المسجّلة</TableHead>
                <TableHead className="text-center">أنواع العمليات</TableHead>
                <TableHead className="text-center">أول نشاط</TableHead>
                <TableHead className="text-center">آخر نشاط</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableState
                colSpan={6}
                loading={loading && !data}
                error={error}
                empty={!loading && reviewers.length === 0}
                emptyLabel="لا توجد عمليات مسجّلة بعد، وبالتالي لا توجد حسابات مراقبة نشطة."
                onRetry={reload}
              >
                {reviewers.map((reviewer) => (
                  <TableRow key={reviewer.key} className="transition-colors hover:bg-slate-50/70">
                    <TableCell className="text-xs font-semibold text-[var(--ink-900)] py-2.5">
                      <div className="flex items-center gap-2">
                        <Shield
                          className="size-3.5 text-[var(--stamp-green-700)]"
                          aria-hidden="true"
                        />
                        {reviewer.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[var(--ink-700)] py-2.5">
                      {reviewer.email}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs font-bold text-[var(--ink-900)] py-2.5">
                      {formatNumber(reviewer.actionsCount)}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-[var(--ink-700)] py-2.5">
                      {formatNumber(reviewer.actionTypes)}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-[var(--ink-500)] py-2.5">
                      {formatDateTime(
                        reviewer.firstActivity ? new Date(reviewer.firstActivity).toISOString() : null,
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs text-[var(--ink-700)] py-2.5">
                      {formatDateTime(
                        reviewer.lastActivity ? new Date(reviewer.lastActivity).toISOString() : null,
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableState>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border-gray-200">
        <CardHeader className="flex flex-col gap-3 border-b border-gray-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-bold text-[var(--ink-900)]">
              سجل التدقيق القانوني (AuditLog)
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs text-gray-500">
              السجلات مختومة ببصمة SHA-256 وغير قابلة للتعديل أو الحذف
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className="size-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="بحث في العمليات أو المستخدمين…"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(1);
                }}
                aria-label="بحث في سجل التدقيق"
                className="ps-8 pe-3 py-1 text-xs h-8 rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] focus:outline-none focus:ring-1 focus:ring-[var(--stamp-green-700)]"
              />
            </div>

            <select
              value={filterResource}
              onChange={(event) => {
                setFilterResource(event.target.value);
                setPage(1);
              }}
              aria-label="تصفية حسب نوع الكيان"
              className="px-2.5 py-1 text-xs h-8 rounded-lg border border-gray-200 bg-white text-[var(--ink-900)] focus:outline-none focus:ring-1 focus:ring-[var(--stamp-green-700)]"
            >
              <option value="all">كل الكيانات</option>
              {resourceTypes.map((resource) => (
                <option key={resource} value={resource}>
                  {resource}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px] text-xs">ختم الوقت</TableHead>
                <TableHead className="min-w-[170px] text-xs">المستخدم</TableHead>
                <TableHead className="min-w-[150px] text-xs">العملية</TableHead>
                <TableHead className="min-w-[130px] text-xs">الكيان</TableHead>
                <TableHead className="min-w-[280px] text-xs">البيان</TableHead>
                <TableHead className="min-w-[110px] text-xs">البصمة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableState
                colSpan={6}
                loading={loading && !data}
                error={error}
                empty={!loading && pageRows.length === 0}
                emptyLabel="لا توجد سجلات تدقيق مطابقة للبحث أو التصفية الحالية."
                onRetry={reload}
              >
                {pageRows.map((log) => (
                  <TableRow key={log.id} className="transition-colors hover:bg-slate-50/70">
                    <TableCell className="font-mono text-xs text-[var(--ink-700)] py-2.5">
                      {formatDateTime(log.timestamp)}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-[var(--ink-900)] py-2.5">
                      <div className="truncate">{log.user_name || log.user_email || 'حساب محذوف'}</div>
                      <div className="font-mono text-xs font-normal text-[var(--ink-500)]">
                        {log.user_email || '—'}
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge className="border-gray-200 bg-[var(--paper-100)] font-mono text-xs text-[var(--ink-900)]">
                        {log.action || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-[var(--ink-700)] py-2.5">
                      <div className="truncate">{log.resource_type || '—'}</div>
                      <div className="truncate font-mono text-xs text-[var(--ink-500)]">
                        {log.resource_id || '—'}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[340px] text-xs leading-relaxed text-[var(--ink-700)] py-2.5">
                      <span className="line-clamp-2">{log.description || '—'}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[var(--ink-500)] py-2.5">
                      {log.checksum ? `${log.checksum.slice(0, 12)}…` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableState>
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-4 py-2.5 text-xs text-[var(--ink-500)]">
            <span>
              عرض {formatNumber(pageRows.length)} من أصل {formatNumber(filtered.length)} سجلاً — صفحة{' '}
              {formatNumber(currentPage)} من {formatNumber(totalPages)}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage <= 1}
                className="h-7 px-2 text-xs"
              >
                <ChevronRight className="size-3" aria-hidden="true" />
                السابق
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage >= totalPages}
                className="h-7 px-2 text-xs"
              >
                التالي
                <ChevronLeft className="size-3" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CentralPermissions;
