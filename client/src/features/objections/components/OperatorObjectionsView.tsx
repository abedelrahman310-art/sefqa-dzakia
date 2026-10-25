import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  Clock,
  Eye,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Timer,
} from 'lucide-react';
import { toast } from 'sonner';
import { objectionsApi } from '../api/objections';
import type { ObjectionListItem, ObjectionDetailItem } from '../types';
import { GROUND_LABELS, TYPE_LABELS } from '../types';
import { ObjectionSubmissionModal } from './ObjectionSubmissionModal';
import { ObjectionDetailModal } from './ObjectionDetailModal';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

const getRemainingMs = (deadlineAt: string, now: number): number => {
  const deadline = new Date(deadlineAt).getTime();
  return Number.isFinite(deadline) ? deadline - now : 0;
};

const formatRemaining = (remainingMs: number): string => {
  if (remainingMs <= 0) return 'انقضى الأجل';

  const totalMinutes = Math.floor(remainingMs / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days} يوم${hours > 0 ? ` و${hours} ساعة` : ''}`;
  if (hours > 0) return `${hours} ساعة${minutes > 0 ? ` و${minutes} دقيقة` : ''}`;
  return `${Math.max(minutes, 1)} دقيقة`;
};

const formatDeadline = (deadlineAt: string): string =>
  new Date(deadlineAt).toLocaleString('ar-DZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

function ObjectionCountdown({ deadlineAt, now }: { deadlineAt: string; now: number }) {
  const remaining = getRemainingMs(deadlineAt, now);
  const isExpired = remaining <= 0;
  const isUrgent = !isExpired && remaining < THREE_DAYS_MS;

  return (
    <span
      className={`flex items-center gap-1.5 text-xs font-bold ${
        isExpired || isUrgent ? 'text-rose-700' : 'text-[var(--op-gold-dark)]'
      }`}
      title={`آخر أجل: ${formatDeadline(deadlineAt)}`}
    >
      <Clock className="size-3.5" aria-hidden="true" />
      <span>{formatRemaining(remaining)}</span>
    </span>
  );
}

export function OperatorObjectionsView() {
  const [objections, setObjections] = useState<ObjectionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [now, setNow] = useState(() => Date.now());

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<ObjectionDetailItem | null>(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);

  const fetchObjections = async () => {
    setLoading(true);
    try {
      const data = await objectionsApi.list();
      setObjections(data || []);
    } catch (err) {
      toast.error('تعذر تحميل قائمة الطعون الخاصة بك.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjections();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const handleViewDetail = async (id: string) => {
    setFetchingDetail(true);
    try {
      const detail = await objectionsApi.get(id);
      setSelectedDetail(detail);
      setDetailModalOpen(true);
    } catch (err) {
      toast.error('تعذر تحميل تفاصيل الطعن.');
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleWithdraw = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في سحب هذا الطعن؟ الإجراء نهائي ولا يمكن التراجع عنه.')) {
      return;
    }
    try {
      await objectionsApi.withdraw(id);
      toast.success('تم سحب الطعن وتوثيق الإجراء.');
      setDetailModalOpen(false);
      fetchObjections();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'تعذر سحب الطعن.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <span className="op-chip blue">مُودع</span>;
      case 'under_review':
        return <span className="op-chip gold">قيد الدراسة</span>;
      case 'accepted':
        return <span className="op-chip green">مقبول</span>;
      case 'rejected':
        return <span className="op-chip red">مرفوض</span>;
      case 'withdrawn':
        return <span className="op-chip">مسحوب</span>;
      default:
        return <span className="op-chip">{status}</span>;
    }
  };

  const filtered = objections.filter((item) => {
    const matchQuery =
      item.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tender_reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchQuery && matchStatus;
  });

  const totalCount = objections.length;
  const underReviewCount = objections.filter((o) => o.status === 'under_review' || o.status === 'submitted').length;
  const acceptedCount = objections.filter((o) => o.status === 'accepted').length;
  const rejectedCount = objections.filter((o) => o.status === 'rejected').length;

  const nextObjection = objections
    .filter(
      (item) =>
        (item.status === 'submitted' || item.status === 'under_review') &&
        getRemainingMs(item.deadline_at, now) > 0,
    )
    .sort(
      (left, right) =>
        new Date(left.deadline_at).getTime() - new Date(right.deadline_at).getTime(),
    )[0];

  const nextRemaining = nextObjection ? getRemainingMs(nextObjection.deadline_at, now) : null;
  const isNextUrgent = nextRemaining !== null && nextRemaining > 0 && nextRemaining < THREE_DAYS_MS;

  const kpiValue = (value: number) => (value > 0 ? value : '—');

  return (
    <div className="op-page">
      <div className="op-page-head">
        <div>
          <span className="op-chip gold mb-2">المادة 72 — القانون 23-12</span>
          <h1>الطعون والتظلمات</h1>
          <p>
            يحق لكل عارض يرى مساساً بحقوقه أو خرقاً لدفتر الشروط أو معايير التقييم تقديم طعن إداري
            أمام لجنة الصفقات خلال أجل 10 أيام من نشر الإسناد.
          </p>
        </div>
        <div className="op-page-actions">
          <button
            type="button"
            className="op-btn op-btn-gold"
            onClick={() => setSubmitModalOpen(true)}
          >
            <Plus aria-hidden="true" />
            <span>إيداع طعن جديد</span>
          </button>
        </div>
      </div>

      <section
        className={`op-card overflow-hidden ${isNextUrgent ? 'border-rose-300' : ''}`}
        aria-labelledby="objection-countdown-title"
      >
        <div className={`h-1 ${isNextUrgent ? 'bg-rose-500' : 'bg-[var(--op-gold)]'}`} />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                isNextUrgent
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-[#1B4332]/10 text-[#1B4332]'
              }`}
              aria-hidden="true"
            >
              <Timer className="size-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="objection-countdown-title"
                  className="text-sm font-extrabold text-[var(--op-ink)]"
                >
                  العد التنازلي لأقرب أجل طعن
                </h2>
                {isNextUrgent ? <span className="op-chip red">أقل من 3 أيام</span> : null}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--op-muted)]">
                {nextObjection ? (
                  <>
                    الطعن <span className="op-mono font-bold">{nextObjection.reference}</span> —
                    آخر أجل: {formatDeadline(nextObjection.deadline_at)}
                  </>
                ) : (
                  'لا توجد آجال طعن مفتوحة حالياً. تُحسب المهلة من تاريخ نشر الإسناد المؤقت.'
                )}
              </p>
            </div>
          </div>

          <div
            className={`rounded-xl border px-4 py-3 text-center sm:min-w-44 ${
              isNextUrgent
                ? 'border-rose-200 bg-rose-50'
                : 'border-[var(--op-line)] bg-[var(--op-surface-2)]'
            }`}
          >
            <span className="block text-[10px] font-bold text-[var(--op-muted)]">المتبقي</span>
            <div
              role="timer"
              aria-live="polite"
              className={`mt-1 text-base font-extrabold ${
                isNextUrgent ? 'text-rose-700' : 'text-[var(--op-ink)]'
              }`}
            >
              {nextRemaining !== null ? formatRemaining(nextRemaining) : '—'}
            </div>
          </div>
        </div>
        {isNextUrgent ? (
          <p className="border-t border-rose-100 bg-rose-50/70 px-5 py-2.5 text-[11px] font-semibold text-rose-800">
            تنبيه: بقي أقل من 3 أيام على انقضاء الأجل. بادر باستكمال الإجراء أو مراجعة ملف
            الطعن قبل انتهاء المهلة.
          </p>
        ) : null}
      </section>

      <section className="op-kpi-grid" aria-label="مؤشرات الطعون">
        <article className="op-kpi">
          <div className="op-kpi-icon gold">
            <FileText aria-hidden="true" />
          </div>
          <div className="op-kpi-label">إجمالي طعوني</div>
          <div className={`op-kpi-value${totalCount === 0 ? ' empty' : ''}`}>{kpiValue(totalCount)}</div>
          <div className="op-kpi-sub">موثقة برقم مرجعي وبصمة</div>
        </article>

        <article className="op-kpi">
          <div className="op-kpi-icon blue">
            <Clock aria-hidden="true" />
          </div>
          <div className="op-kpi-label">قيد المعالجة والدراسة</div>
          <div className={`op-kpi-value${underReviewCount === 0 ? ' empty' : ''}`}>
            {kpiValue(underReviewCount)}
          </div>
          <div className="op-kpi-sub">أمام لجان الصفقات</div>
        </article>

        <article className="op-kpi">
          <div className="op-kpi-icon green">
            <CheckCircle2 aria-hidden="true" />
          </div>
          <div className="op-kpi-label">طعون مقبولة</div>
          <div className={`op-kpi-value${acceptedCount === 0 ? ' empty' : ''}`}>
            {kpiValue(acceptedCount)}
          </div>
          <div className="op-kpi-sub">ألغي فيها الإسناد المؤقت</div>
        </article>

        <article className="op-kpi">
          <div className="op-kpi-icon rose">
            <XCircle aria-hidden="true" />
          </div>
          <div className="op-kpi-label">طعون مرفوضة</div>
          <div className={`op-kpi-value${rejectedCount === 0 ? ' empty' : ''}`}>
            {kpiValue(rejectedCount)}
          </div>
          <div className="op-kpi-sub">مع تبرير معلل من اللجنة</div>
        </article>
      </section>

      <section className="op-card" aria-labelledby="objections-list-title">
        <div className="op-card-head">
          <div>
            <h3 id="objections-list-title">سجل الطعون</h3>
            <p className="mt-0.5 text-xs text-[var(--op-muted)]">
              تابع حالة طعونك والآجال المرتبطة بها.
            </p>
          </div>
          <div className="op-toolbar w-full sm:w-auto">
            <div className="op-search-lg sm:w-72">
              <Search aria-hidden="true" />
              <input
                type="text"
                placeholder="بحث برقم الطعن أو الصفقة..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="بحث في الطعون"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-[var(--op-muted)]" aria-hidden="true" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="op-select"
                aria-label="تصفية حسب الحالة"
              >
                <option value="all">كافة الحالات</option>
                <option value="submitted">مُودع</option>
                <option value="under_review">قيد الدراسة</option>
                <option value="accepted">مقبول</option>
                <option value="rejected">مرفوض</option>
                <option value="withdrawn">مسحوب</option>
              </select>
            </div>
          </div>
        </div>

        <div className="op-table-scroll">
          <table className="op-table op-table-wide">
            <thead>
              <tr>
                <th>رقم الطعن</th>
                <th>الصفقة</th>
                <th>نوع الطعن</th>
                <th>أبرز الأسباب</th>
                <th>الحالة</th>
                <th>المهلة المتبقية</th>
                <th>تاريخ الإيداع</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="space-y-3 p-5">
                      {[1, 2, 3, 4].map((row) => (
                        <div key={row} className="op-skeleton h-12" />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr className="op-empty-row">
                  <td colSpan={8}>
                    <div className="op-empty-state">
                      <ShieldAlert aria-hidden="true" />
                      <h4>لا توجد طعون مسجلة حالياً</h4>
                      <p>
                        يمكنك إيداع طعن على أي صفقة مؤهلة خلال 10 أيام من إعلان الإسناد المؤقت.
                      </p>
                      <button
                        type="button"
                        className="op-btn op-btn-outline op-btn-sm mt-2"
                        onClick={() => setSubmitModalOpen(true)}
                      >
                        <Plus aria-hidden="true" />
                        <span>إيداع طعن جديد</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="op-mono text-xs font-bold text-[var(--op-ink)]">
                        {item.reference}
                      </span>
                    </td>
                    <td>
                      <span className="op-mono text-xs">{item.tender_reference}</span>
                    </td>
                    <td className="text-xs">{TYPE_LABELS[item.objection_type] || item.objection_type}</td>
                    <td>
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        {item.grounds.slice(0, 2).map((ground, index) => (
                          <span key={index} className="op-chip text-[10px]">
                            {GROUND_LABELS[ground] || ground}
                          </span>
                        ))}
                        {item.grounds.length > 2 && (
                          <span className="self-center text-[10px] font-mono text-[var(--op-muted)]">
                            +{item.grounds.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>
                      {item.status === 'submitted' || item.status === 'under_review' ? (
                        <ObjectionCountdown deadlineAt={item.deadline_at} now={now} />
                      ) : (
                        <span className="text-xs text-[var(--op-muted)]">—</span>
                      )}
                    </td>
                    <td>
                      <span className="font-mono text-[11px] text-[var(--op-muted)]">
                        {new Date(item.created_at).toLocaleDateString('ar-DZ')}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(item.id)}
                          disabled={fetchingDetail}
                          className="op-btn op-btn-outline op-btn-sm"
                        >
                          <Eye aria-hidden="true" />
                          <span>{fetchingDetail ? 'جارٍ التحميل...' : 'عرض الملف'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ObjectionSubmissionModal
        open={submitModalOpen}
        onOpenChange={setSubmitModalOpen}
        onSuccess={fetchObjections}
      />

      <ObjectionDetailModal
        objection={selectedDetail}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onWithdraw={handleWithdraw}
        canWithdraw={true}
      />
    </div>
  );
}
