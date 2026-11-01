import { useI18n } from "@/i18n";
import { useState, useEffect } from 'react';
import {
  Gavel,
  Clock,
  Eye,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Lock,
  PlayCircle,
  Scale,
  RefreshCw,
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
import { getGroundLabel } from '../types';
import { ObjectionDecisionModal } from './ObjectionDecisionModal';
import { ObjectionDetailModal } from './ObjectionDetailModal';

export function AuthorityObjectionsView() {
  const { t, lang, dir } = useI18n();
  const [objections, setObjections] = useState<ObjectionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedForDecision, setSelectedForDecision] = useState<ObjectionListItem | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<ObjectionDetailItem | null>(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchObjections = async () => {
    setLoading(true);
    try {
      const data = await objectionsApi.list();
      setObjections(data || []);
    } catch (err) {
      toast.error(t('objections.auth_load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjections();
  }, []);

  const handleStartReview = async (id: string) => {
    setActionInProgress(id);
    try {
      await objectionsApi.startReview(id);
      toast.success(t('objections.auth_start_review_success'));
      fetchObjections();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t('objections.auth_start_review_error'));
    } finally {
      setActionInProgress(null);
    }
  };

  const handleOpenDecision = (item: ObjectionListItem) => {
    setSelectedForDecision(item);
    setDecisionModalOpen(true);
  };

  const handleViewDetail = async (id: string) => {
    setFetchingDetail(true);
    try {
      const detail = await objectionsApi.get(id);
      setSelectedDetail(detail);
      setDetailModalOpen(true);
    } catch (err) {
      toast.error(t('objections.auth_load_detail_error'));
    } finally {
      setFetchingDetail(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-blue-50 text-blue-800 border-blue-200">{t("objections.badge_new_submitted")}</Badge>;
      case 'under_review':
        return <Badge className="bg-amber-50 text-amber-800 border-amber-300">{t("objections.badge_under_review")}</Badge>;
      case 'accepted':
        return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300">{t("objections.badge_accepted_cancel")}</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-50 text-rose-800 border-rose-300">{t("objections.badge_rejected_confirm")}</Badge>;
      case 'withdrawn':
        return <Badge className="bg-slate-100 text-slate-700 border-slate-300">{t("objections.badge_withdrawn_by_objector")}</Badge>;
      case 'escalated':
        return <Badge className="bg-purple-50 text-purple-800 border-purple-200">{t("objections.badge_escalated_judicial")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // KPIs
  const totalCount = objections.length;
  const submittedCount = objections.filter((o) => o.status === 'submitted').length;
  const underReviewCount = objections.filter((o) => o.status === 'under_review').length;
  const decidedCount = objections.filter((o) => o.status === 'accepted' || o.status === 'rejected').length;

  // Filtered List
  const filteredObjections = objections.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      item.reference.toLowerCase().includes(q) ||
      item.tender_title?.toLowerCase().includes(q) ||
      item.tender_reference?.toLowerCase().includes(q) ||
      item.objector_name?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <Scale className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("objections.auth_page_title")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("objections.auth_page_desc")}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchObjections}
          disabled={loading}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t("objections.auth_btn_refresh")}
        </Button>
      </div>

      {/* Legal Notification Banner */}
      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm leading-relaxed">
          <p className="font-semibold mb-1">
            {t("objections.auth_suspensive_title")}
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            {t("objections.auth_suspensive_p1")}
            {t("objections.auth_suspensive_p2")}
          </p>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("objections.auth_stat_total")}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">{t("objections.auth_stat_total_sub")}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-blue-700 dark:text-blue-400">
              {t("objections.auth_stat_new")}
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {submittedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("objections.auth_stat_new_sub")}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400">
              {t("objections.auth_stat_under_review")}
            </CardTitle>
            <PlayCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {underReviewCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("objections.auth_stat_under_review_sub")}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {t("objections.auth_stat_resolved")}
            </CardTitle>
            <Gavel className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {decidedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("objections.auth_stat_resolved_sub")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/60 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("objections.auth_search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-9 pe-3 py-1.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex gap-1">
            {[
              { id: 'all', label: t('objections.filter_all_label') },
              { id: 'submitted', label: t('objections.filter_submitted_label') },
              { id: 'under_review', label: t('objections.filter_under_review_label') },
              { id: 'accepted', label: t('objections.filter_accepted_label') },
              { id: 'rejected', label: t('objections.filter_rejected_label') },
            ].map((f) => (
              <Button
                key={f.id}
                variant={statusFilter === f.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(f.id)}
                className="text-xs h-8"
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Objections List Table */}
      <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm">{t("objections.auth_loading")}</p>
          </div>
        ) : filteredObjections.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <h3 className="text-base font-semibold text-foreground mb-1">{t("objections.auth_empty_filtered")}</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? t('objections.auth_empty_filtered_desc')
                : t('objections.auth_empty_desc')}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-start font-semibold">{t("objections.auth_table_ref")}</TableHead>
                <TableHead className="text-start font-semibold">{t("objections.auth_table_deal")}</TableHead>
                <TableHead className="text-start font-semibold">{t("objections.auth_table_objector")}</TableHead>
                <TableHead className="text-start font-semibold">{t("objections.auth_table_ground")}</TableHead>
                <TableHead className="text-start font-semibold">{t("objections.auth_table_deadline")}</TableHead>
                <TableHead className="text-start font-semibold">{t("objections.auth_table_status")}</TableHead>
                <TableHead className="text-end font-semibold">{t("objections.auth_table_actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredObjections.map((item) => {
                const isUnderReview = item.status === 'under_review';
                const isSubmitted = item.status === 'submitted';
                const canDecide = isSubmitted || isUnderReview;

                return (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span>{item.reference}</span>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-[200px]">
                      <div className="font-medium text-sm text-foreground truncate" title={item.tender_title}>
                        {item.tender_title}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {item.tender_reference}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm font-medium text-foreground">
                        {item.objector_name || t('objections.default_registered_operator')}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {item.submitted_at
                          ? new Date(item.submitted_at).toLocaleDateString('ar-DZ')
                          : '—'}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {item.grounds?.slice(0, 2).map((g) => (
                          <Badge
                            key={g}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 font-normal"
                          >
                            {getGroundLabel(g, t)}
                          </Badge>
                        ))}
                        {item.grounds && item.grounds.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{item.grounds.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        {item.is_within_deadline ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-300 text-emerald-800 bg-emerald-50 text-[11px]"
                          >
                            {t('objections.days_remaining_label', { days: item.days_remaining })}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-rose-300 text-rose-800 bg-rose-50 text-[11px]"
                          >
                            {t("objections.deadline_expired_badge")}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>{getStatusBadge(item.status)}</TableCell>

                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Start Review Button if submitted */}
                        {isSubmitted && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1 text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-200"
                            onClick={() => handleStartReview(item.id)}
                            disabled={actionInProgress === item.id}
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            {t('objections.auth_btn_start_review')}
                          </Button>
                        )}

                        {/* Decide Button if submitted or under review */}
                        {canDecide && (
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => handleOpenDecision(item)}
                          >
                            <Gavel className="h-3.5 w-3.5" />
                            {t('objections.auth_btn_decide')}
                          </Button>
                        )}

                        {/* View Detail Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs gap-1"
                          onClick={() => handleViewDetail(item.id)}
                          disabled={fetchingDetail}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {t('objections.auth_btn_view')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Decision Modal */}
      <ObjectionDecisionModal
        objection={selectedForDecision}
        open={decisionModalOpen}
        onOpenChange={setDecisionModalOpen}
        onSuccess={() => {
          fetchObjections();
          setSelectedForDecision(null);
        }}
      />

      {/* Detail Modal */}
      <ObjectionDetailModal
        objection={selectedDetail}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        canWithdraw={false}
      />
    </div>
  );
}
