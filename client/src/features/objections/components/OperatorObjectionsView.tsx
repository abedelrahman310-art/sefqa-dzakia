import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  Clock,
  Eye,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Filter,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
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

  // Modals
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
        return <Badge className="bg-blue-50 text-blue-800 border-blue-200">مُودع</Badge>;
      case 'under_review':
        return <Badge className="bg-amber-50 text-amber-800 border-amber-300">قيد الدراسة</Badge>;
      case 'accepted':
        return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300">مقبول</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-50 text-rose-800 border-rose-300">مرفوض</Badge>;
      case 'withdrawn':
        return <Badge className="bg-slate-100 text-slate-700 border-slate-300">مسحوب</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  return (
    <div className="space-y-6 text-start font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inst-badge bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
              المادة 72 — القانون 23-12
            </span>
            <span className="text-xs text-slate-500 font-mono">حماية حقوق المتنافسين</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            سجل الطعون على قرارات الإسناد المؤقت
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            يحق لكل عارض يرى مساساً بحقوقه أو خرقاً لدفتر الشروط أو معايير التقييم تقديم طعن إداري أمام لجنة الصفقات خلال أجل 10 أيام من نشر الإسناد.
          </p>
        </div>

        <Button
          onClick={() => setSubmitModalOpen(true)}
          className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold h-10 px-4 text-xs sm:text-sm shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 me-1.5" />
          إيداع طعن جديد
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 text-start">
            <div className="text-xs font-semibold text-slate-500">إجمالي طعوني</div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{totalCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">موثقة برقم مرجعي وبصمة</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 text-start">
            <div className="text-xs font-semibold text-amber-700">قيد المعالجة والدراسة</div>
            <div className="text-2xl font-black text-amber-900 mt-1 font-mono">{underReviewCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">أمام لجان الصفقات</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 text-start">
            <div className="text-xs font-semibold text-emerald-700">طعون مقبولة</div>
            <div className="text-2xl font-black text-emerald-900 mt-1 font-mono">{acceptedCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">ألغي فيها الإسناد المؤقت</div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 text-start">
            <div className="text-xs font-semibold text-rose-700">طعون مرفوضة</div>
            <div className="text-2xl font-black text-rose-900 mt-1 font-mono">{rejectedCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">مع تبرير معلل من اللجنة</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث برقم الطعن أو الصفقة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-9 pe-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
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

      {/* Table of Objections */}
      <Card className="bg-white border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 text-xs">
                <TableRow>
                  <TableHead className="text-start">رقم الطعن</TableHead>
                  <TableHead className="text-start">الصفقة</TableHead>
                  <TableHead className="text-start">نوع الطعن</TableHead>
                  <TableHead className="text-start">أبرز الأسباب</TableHead>
                  <TableHead className="text-start">الحالة</TableHead>
                  <TableHead className="text-start">المهلة المتبقية</TableHead>
                  <TableHead className="text-start">تاريخ الإيداع</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-slate-400">
                      جاري تحميل الطعون...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShieldAlert className="w-8 h-8 text-slate-300" />
                        <span className="font-semibold">لا توجد طعون مسجلة حالياً.</span>
                        <span className="text-[11px] text-slate-400">
                          يمكنك إيداع طعن على أي صفقة مؤهلة خلال 10 أيام من إعلان الإسناد المؤقت.
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <TableCell className="font-mono font-bold text-slate-900">
                        {item.reference}
                      </TableCell>
                      <TableCell className="font-mono text-slate-700">
                        {item.tender_reference}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {TYPE_LABELS[item.objection_type] || item.objection_type}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {item.grounds.slice(0, 2).map((g, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {GROUND_LABELS[g] || g}
                            </span>
                          ))}
                          {item.grounds.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              +{item.grounds.length - 2}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        {item.status === 'submitted' || item.status === 'under_review' ? (
                          <div className="flex items-center gap-1.5 text-amber-700 font-bold font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{item.days_remaining} يوم</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500 font-mono text-[11px]">
                        {new Date(item.created_at).toLocaleDateString('ar-DZ')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetail(item.id)}
                          className="h-8 text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:bg-emerald-50"
                        >
                          <Eye className="w-3.5 h-3.5 me-1" />
                          عرض الملف
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Submission Modal */}
      <ObjectionSubmissionModal
        open={submitModalOpen}
        onOpenChange={setSubmitModalOpen}
        onSuccess={fetchObjections}
      />

      {/* Detail Modal */}
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
