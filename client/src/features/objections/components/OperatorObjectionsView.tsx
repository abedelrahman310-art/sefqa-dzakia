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
} from 'lucide-react';
import { toast } from 'sonner';
import { objectionsApi } from '../api/objections';
import type { ObjectionListItem, ObjectionDetailItem } from '../types';
import { GROUND_LABELS, TYPE_LABELS } from '../types';
import { ObjectionSubmissionModal } from './ObjectionSubmissionModal';
import { ObjectionDetailModal } from './ObjectionDetailModal';

export function OperatorObjectionsView() {
  const [objections, setObjections] = useState<ObjectionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--op-gold-dark)]">
                          <Clock className="size-3.5" aria-hidden="true" />
                          <span>{item.days_remaining} يوم</span>
                        </span>
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
