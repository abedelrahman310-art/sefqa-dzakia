import { useMemo, useState, useEffect } from 'react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { PageHeader, KpiCard } from '@/shared/components';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  UserPlus,
  History,
  Activity,
  Search,
  RefreshCw,
  Lock,
  ChevronRight,
  ChevronLeft,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Copy,
  Check,
  Ban,
  UserCheck,
  Mail,
  X,
  ExternalLink,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  fetchCentralAuditLogs,
  fetchCentralStaff,
  inviteCentralStaff,
  revokeToggleCentralStaff,
  type CentralAuditLogRow,
  type CentralStaffMember,
  type CentralStaffInvitationRow,
  type CentralStaffResponse,
} from './centralApi';
import { TableState, formatDateTime, formatNumber } from './centralUi';

const AUDIT_PAGE_SIZE = 15;

const ROLE_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  inspector_general: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500/30',
  },
  inspector: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-500/30',
  },
  analyst: {
    bg: 'bg-sky-500/10',
    text: 'text-sky-700 dark:text-sky-400',
    border: 'border-sky-500/30',
  },
  financial_auditor: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/30',
  },
  system_admin: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-800 dark:text-slate-300',
    border: 'border-slate-500/30',
  },
};

export function CentralPermissions() {
  const { t, lang, dir } = useI18n();
  const { user: currentUser } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'staff' | 'invitations' | 'audit'>('staff');

  // Staff & Invitations State
  const [staffData, setStaffData] = useState<CentralStaffResponse | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [staffError, setStaffError] = useState('');

  // Search & Filters
  const [searchStaff, setSearchStaff] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');

  // Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('inspector');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Action status (toggle active/deactivate)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Copy token tracker for invitation rows
  const [copiedTokenRow, setCopiedTokenRow] = useState<string | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<CentralAuditLogRow[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [auditError, setAuditError] = useState('');
  const [searchAudit, setSearchAudit] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('all');
  const [auditPage, setAuditPage] = useState(1);

  // Load staff & invitations
  const loadStaff = async () => {
    setLoadingStaff(true);
    setStaffError('');
    try {
      const data = await fetchCentralStaff();
      setStaffData(data);
    } catch (err: any) {
      setStaffError(err.response?.data?.error || err.message || 'تعذر تحميل بيانات الموظفين.');
    } finally {
      setLoadingStaff(false);
    }
  };

  // Load audit logs
  const loadAudit = async () => {
    setLoadingAudit(true);
    setAuditError('');
    try {
      const data = await fetchCentralAuditLogs();
      setAuditLogs(data);
    } catch (err: any) {
      setAuditError(err.response?.data?.error || err.message || 'تعذر تحميل سجل التدقيق.');
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    loadStaff();
    loadAudit();
  }, []);

  // Handle Send Invite
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setGeneratedInviteUrl('');
    setCopiedUrl(false);

    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError(lang === 'ar' ? 'جميع الحقول مطلوبة.' : 'Tous les champs sont requis.');
      return;
    }

    setInviting(true);
    try {
      const res = await inviteCentralStaff({
        full_name: inviteName.trim(),
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });
      setGeneratedInviteUrl(res.invitation.invite_url);
      loadStaff();
      loadAudit();
    } catch (err: any) {
      setInviteError(err.response?.data?.error || 'تعذر إرسال الدعوة.');
    } finally {
      setInviting(false);
    }
  };

  // Handle Toggle Active/Inactive or Revoke Invitation
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const confirmText = currentActive
      ? t('central.permissions.confirm_deactivate')
      : t('central.permissions.confirm_activate');
    if (!window.confirm(confirmText)) return;

    setActionLoadingId(id);
    setActionMessage(null);
    try {
      const res = await revokeToggleCentralStaff(id, !currentActive);
      setActionMessage({ text: res.message, type: 'success' });
      await loadStaff();
      await loadAudit();
    } catch (err: any) {
      setActionMessage({
        text: err.response?.data?.error || 'تعذر تغيير حالة الحساب.',
        type: 'error',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Revoke Pending Invite
  const handleRevokeInvite = async (id: string) => {
    if (!window.confirm(t('central.permissions.confirm_revoke_invite'))) return;

    setActionLoadingId(id);
    setActionMessage(null);
    try {
      const res = await revokeToggleCentralStaff(id);
      setActionMessage({ text: res.message, type: 'success' });
      await loadStaff();
      await loadAudit();
    } catch (err: any) {
      setActionMessage({
        text: err.response?.data?.error || 'تعذر إلغاء الدعوة.',
        type: 'error',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const copyToClipboard = (text: string, rowId?: string) => {
    navigator.clipboard.writeText(text);
    if (rowId) {
      setCopiedTokenRow(rowId);
      setTimeout(() => setCopiedTokenRow(null), 2500);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  // Filtered staff
  const filteredStaff = useMemo(() => {
    if (!staffData?.staff) return [];
    return staffData.staff.filter((m) => {
      const matchesSearch =
        m.full_name.toLowerCase().includes(searchStaff.toLowerCase()) ||
        m.email.toLowerCase().includes(searchStaff.toLowerCase()) ||
        m.role_display.toLowerCase().includes(searchStaff.toLowerCase());
      const matchesRole =
        selectedRoleFilter === 'all' || m.role === selectedRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [staffData, searchStaff, selectedRoleFilter]);

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        (log.description || '').toLowerCase().includes(searchAudit.toLowerCase()) ||
        (log.user_name || '').toLowerCase().includes(searchAudit.toLowerCase()) ||
        (log.user_email || '').toLowerCase().includes(searchAudit.toLowerCase()) ||
        (log.action || '').toLowerCase().includes(searchAudit.toLowerCase());
      const matchesEntity =
        selectedEntity === 'all' || log.resource_type === selectedEntity;
      return matchesSearch && matchesEntity;
    });
  }, [auditLogs, searchAudit, selectedEntity]);

  const totalAuditPages = Math.max(1, Math.ceil(filteredAuditLogs.length / AUDIT_PAGE_SIZE));
  const paginatedAuditLogs = useMemo(() => {
    const start = (auditPage - 1) * AUDIT_PAGE_SIZE;
    return filteredAuditLogs.slice(start, start + AUDIT_PAGE_SIZE);
  }, [filteredAuditLogs, auditPage]);

  const canManage = staffData?.can_manage ?? false;

  return (
    <div className="space-y-6 pb-12" dir={dir}>
      
      {/* 1. ترويسة الصفحة السيادية الرسمية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>الجمهورية الجزائرية الديمقراطية الشعبية · المفتشية العامة للصفقات العمومية</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Shield className="size-6 text-emerald-600 dark:text-emerald-500" />
            <span>{t('central.permissions.title')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
            {t('central.permissions.description')}
          </p>
        </div>

        {/* زر إصدار دعوة موظف جديد */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {canManage && (
            <Button
              onClick={() => {
                setIsInviteModalOpen(true);
                setInviteError('');
                setGeneratedInviteUrl('');
                setInviteName('');
                setInviteEmail('');
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm gap-2"
            >
              <UserPlus className="size-4" />
              <span>{t('central.permissions.invite')}</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadStaff();
              loadAudit();
            }}
            disabled={loadingStaff || loadingAudit}
            className="text-xs rounded-xl font-bold gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${(loadingStaff || loadingAudit) ? 'animate-spin' : ''}`} />
            <span>{t('central.permissions.refresh')}</span>
          </Button>
        </div>
      </div>

      {/* رسالة إشعار بعد الإجراء */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-200'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-current opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. بطاقات المؤشرات الأساسية (KPI Matrix) */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={lang === 'ar' ? 'فريق عمل عين الصقر' : 'Équipe de contrôle central'}
          value={formatNumber(staffData?.total_staff ?? 0, lang)}
          subtext={lang === 'ar' ? 'موظف مسجل بالإدارة المركزية' : 'Agents officiels enregistrés'}
          icon={Users}
        />
        <KpiCard
          label={t('central.permissions.status.accepted')}
          value={formatNumber(staffData?.active_staff ?? 0, lang)}
          subtext={lang === 'ar' ? 'حسابات نشطة ومأذونة بالدخول' : 'Comptes actifs habilités'}
          icon={ShieldCheck}
        />
        <KpiCard
          label={t('central.permissions.status.pending')}
          value={formatNumber(staffData?.pending_invitations ?? 0, lang)}
          subtext={lang === 'ar' ? 'دعوات تفعيل قيد الانتظار' : 'Invitations en attente d’activation'}
          icon={Clock}
        />
        <KpiCard
          label={t('central.permissions.kpi_audit_logs')}
          value={formatNumber(auditLogs.length, lang)}
          subtext={t('central.permissions.kpi_audit_logs_sub')}
          icon={Fingerprint}
        />
      </div>

      {/* 3. شريط التبويبات الرئيسي */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'staff'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="size-4" />
          <span>{t('central.permissions.staff_tab')}</span>
          {staffData?.staff && (
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] tabular-nums">
              {staffData.staff.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invitations')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'invitations'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="size-4" />
          <span>{t('central.permissions.invitations_tab')}</span>
          {staffData && staffData.pending_invitations > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-black tabular-nums">
              {staffData.pending_invitations}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'audit'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Fingerprint className="size-4" />
          <span>{t('central.permissions.audit_tab')}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] tabular-nums">
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* 4. محتوى التبويب الأول: جدول الموظفين الفعليين */}
      {activeTab === 'staff' && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                {lang === 'ar' ? 'سجل الموظفين والمفتشين المعتمدين' : 'Registre des auditeurs et agents habilités'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                {lang === 'ar'
                  ? 'صلاحيات الرقابة، كشف التواطؤ، إصدار الإعذارات الإدارية، والتدقيق المالي'
                  : 'Habilitations de contrôle, d’injonction et d’audit financier'}
              </CardDescription>
            </div>

            {/* شريط البحث وتصفية الأدوار */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="size-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  value={searchStaff}
                  onChange={(e) => setSearchStaff(e.target.value)}
                  placeholder={lang === 'ar' ? 'بحث بالاسم أو البريد...' : 'Filtrer par nom ou email...'}
                  className="h-8 text-xs ps-8 pe-3 w-48 sm:w-64 rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>

              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="h-8 text-xs px-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="all">{lang === 'ar' ? 'كل الأدوار' : 'Tous les rôles'}</option>
                <option value="inspector_general">{t('central.permissions.roles.inspector_general')}</option>
                <option value="inspector">{t('central.permissions.roles.inspector')}</option>
                <option value="analyst">{t('central.permissions.roles.analyst')}</option>
                <option value="financial_auditor">{t('central.permissions.roles.financial_auditor')}</option>
                <option value="system_admin">{t('central.permissions.roles.system_admin')}</option>
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loadingStaff ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-slate-400" />
                {lang === 'ar' ? 'جاري تحميل الموظفين...' : 'Chargement des agents...'}
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Users className="size-8 mx-auto mb-2 opacity-30" />
                {lang === 'ar' ? 'لا يوجد موظفون مطابقون لبحثك.' : 'Aucun agent correspondant.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/70 dark:bg-slate-900/40 text-[11px]">
                      <TableHead className="font-bold">{lang === 'ar' ? 'الموظف' : 'Agent'}</TableHead>
                      <TableHead className="font-bold">{lang === 'ar' ? 'الدور الوظيفي والصلاحية' : 'Rôle & Habilitation'}</TableHead>
                      <TableHead className="font-bold">{lang === 'ar' ? 'الحالة' : 'Statut'}</TableHead>
                      <TableHead className="font-bold">{lang === 'ar' ? 'آخر نشاط' : 'Dernière activité'}</TableHead>
                      <TableHead className="font-bold text-end">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((staff) => {
                      const roleStyle = ROLE_COLOR_MAP[staff.role] || ROLE_COLOR_MAP.system_admin;
                      const isMe = currentUser?.id === staff.id || currentUser?.email === staff.email;
                      const isActionBusy = actionLoadingId === staff.id;

                      return (
                        <TableRow key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 text-xs">
                          {/* الموظف والبريد */}
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs">
                                {staff.full_name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                                  <span>{staff.full_name}</span>
                                  {isMe && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                                      {lang === 'ar' ? 'حسابك' : 'Vous'}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono truncate">{staff.email}</div>
                              </div>
                            </div>
                          </TableCell>

                          {/* الدور الوظيفي */}
                          <TableCell className="py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                            >
                              <span>{staff.role_display}</span>
                            </span>
                          </TableCell>

                          {/* الحالة */}
                          <TableCell className="py-3">
                            {staff.is_active ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                {t('central.permissions.status.accepted')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                                <span className="size-2 rounded-full bg-rose-500" />
                                {t('central.permissions.status.revoked')}
                              </span>
                            )}
                          </TableCell>

                          {/* آخر نشاط / آخر تسجيل دخول */}
                          <TableCell className="py-3 text-slate-500 text-[11px] font-mono">
                            {staff.last_login ? formatDateTime(staff.last_login, lang) : (lang === 'ar' ? 'لم يسجل دخول بعد' : 'Jamais connecté')}
                          </TableCell>

                          {/* زر الإجراء: تعطيل / تفعيل */}
                          <TableCell className="py-3 text-end">
                            {canManage ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isMe || isActionBusy}
                                onClick={() => handleToggleActive(staff.id, staff.is_active)}
                                className={`text-xs font-bold rounded-lg h-8 px-3 ${
                                  staff.is_active
                                    ? 'border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40'
                                    : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
                                }`}
                                title={isMe ? (lang === 'ar' ? 'لا يمكنك تعطيل حسابك الشخصي' : 'Action non autorisée') : undefined}
                              >
                                {isActionBusy ? (
                                  <RefreshCw className="size-3 animate-spin" />
                                ) : staff.is_active ? (
                                  <div className="flex items-center gap-1.5">
                                    <Ban className="size-3.5" />
                                    <span>{t('central.permissions.deactivate')}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <UserCheck className="size-3.5" />
                                    <span>{t('central.permissions.activate')}</span>
                                  </div>
                                )}
                              </Button>
                            ) : (
                              <span className="text-slate-400 text-xs italic">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 5. محتوى التبويب الثاني: سجل الدعوات المعلقة */}
      {activeTab === 'invitations' && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'ar' ? 'سجل الدعوات الرسمية وروابط التفعيل المشفرة' : 'Journal des invitations et jetons de scellement'}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              {lang === 'ar'
                ? 'تنتهي صلاحية كل دعوة تلقائياً بعد 7 أيام من تاريخ إنشائها لحماية سلامة النظام وفق المادة 18-07'
                : 'Chaque lien expire au bout de 7 jours conformément aux règles de sécurité de l’État'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {loadingStaff ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-slate-400" />
                {lang === 'ar' ? 'جاري تحميل الدعوات...' : 'Chargement...'}
              </div>
            ) : !staffData?.invitations || staffData.invitations.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Mail className="size-8 mx-auto mb-2 opacity-30" />
                {lang === 'ar' ? 'لا توجد دعوات مسجلة حالياً.' : 'Aucune invitation enregistrée.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/70 dark:bg-slate-900/40 text-[11px]">
                      <TableHead className="font-bold">{lang === 'ar' ? 'المرشح المدعو' : 'Candidat'}</TableHead>
                      <TableHead className="font-bold">{lang === 'ar' ? 'الدور الممنوح' : 'Rôle'}</TableHead>
                      <TableHead className="font-bold">{lang === 'ar' ? 'صاحب الدعوة وتاريخها' : 'Émis par'}</TableHead>
                      <TableHead className="font-bold">{lang === 'ar' ? 'الصلاحية والحالة' : 'Validité'}</TableHead>
                      <TableHead className="font-bold text-end">{lang === 'ar' ? 'رابط التفعيل والإجراء' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffData.invitations.map((inv) => {
                      const isPending = inv.status === 'pending';
                      const isAccepted = inv.status === 'accepted';
                      const isRevoked = inv.status === 'revoked';
                      const isExpired = inv.status === 'expired' || !inv.is_valid;
                      const isCopied = copiedTokenRow === inv.id;

                      return (
                        <TableRow key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 text-xs">
                          {/* المرشح */}
                          <TableCell className="py-3">
                            <div className="font-bold text-slate-900 dark:text-white">{inv.full_name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{inv.email}</div>
                          </TableCell>

                          {/* الدور */}
                          <TableCell className="py-3">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700">
                              {inv.role_display}
                            </span>
                          </TableCell>

                          {/* صاحب الدعوة */}
                          <TableCell className="py-3 text-slate-500 text-[11px]">
                            <div>{inv.invited_by_name || 'مسؤول النظام'}</div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {inv.created_at ? formatDateTime(inv.created_at, lang) : '—'}
                            </div>
                          </TableCell>

                          {/* الحالة والانتهاء */}
                          <TableCell className="py-3">
                            {isAccepted ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-3.5" />
                                {t('central.permissions.status.accepted')}
                              </span>
                            ) : isPending && inv.is_valid ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                                <Clock className="size-3.5" />
                                {t('central.permissions.status.pending')}
                              </span>
                            ) : isRevoked ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                                <Ban className="size-3.5" />
                                {t('central.permissions.status.revoked')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                <AlertTriangle className="size-3.5" />
                                {t('central.permissions.status.expired')}
                              </span>
                            )}
                          </TableCell>

                          {/* الإجراءات: نسخ الرابط / إلغاء */}
                          <TableCell className="py-3 text-end">
                            <div className="flex items-center justify-end gap-2">
                              {isPending && inv.is_valid && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(inv.invite_url, inv.id)}
                                    className="h-8 text-xs font-bold gap-1 border-slate-300 dark:border-slate-700"
                                    title={inv.invite_url}
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check className="size-3.5 text-emerald-600" />
                                        <span className="text-emerald-600">{t('central.permissions.copied')}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="size-3.5" />
                                        <span>{t('central.permissions.copy_link')}</span>
                                      </>
                                    )}
                                  </Button>

                                  {canManage && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRevokeInvite(inv.id)}
                                      className="h-8 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold"
                                      title={t('central.permissions.revoke_invite')}
                                    >
                                      <X className="size-3.5" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 6. محتوى التبويب الثالث: سجل التدقيق القانوني (AuditLog) */}
      {activeTab === 'audit' && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="size-4 text-emerald-600" />
                <span>{t('central.permissions.audit_log_title')}</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                {t('central.permissions.audit_log_subtitle')}
              </CardDescription>
            </div>

            {/* أدوات البحث في سجل التدقيق */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="size-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  value={searchAudit}
                  onChange={(e) => {
                    setSearchAudit(e.target.value);
                    setAuditPage(1);
                  }}
                  placeholder={t('central.permissions.search_placeholder')}
                  className="h-8 text-xs ps-8 pe-3 w-48 sm:w-64 rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
              </div>

              <select
                value={selectedEntity}
                onChange={(e) => {
                  setSelectedEntity(e.target.value);
                  setAuditPage(1);
                }}
                className="h-8 text-xs px-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="all">{t('central.permissions.all_entities')}</option>
                <option value="CustomUser">CustomUser</option>
                <option value="CentralStaffInvitation">CentralStaffInvitation</option>
                <option value="ProcurementDeal">ProcurementDeal</option>
                <option value="AdministrativeNotice">AdministrativeNotice</option>
                <option value="Offer">Offer</option>
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loadingAudit ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-slate-400" />
                {lang === 'ar' ? 'جاري تحميل سجل التدقيق...' : 'Chargement...'}
              </div>
            ) : paginatedAuditLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                {t('central.permissions.empty_logs')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/70 dark:bg-slate-900/40 text-[11px]">
                      <TableHead className="font-bold">{t('central.permissions.col_timestamp')}</TableHead>
                      <TableHead className="font-bold">{t('central.permissions.col_user')}</TableHead>
                      <TableHead className="font-bold">{t('central.permissions.col_action')}</TableHead>
                      <TableHead className="font-bold">{t('central.permissions.col_entity')}</TableHead>
                      <TableHead className="font-bold">{t('central.permissions.col_description')}</TableHead>
                      <TableHead className="font-bold text-end">{t('central.permissions.col_hash')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAuditLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 text-xs">
                        <TableCell className="py-2.5 text-[11px] font-mono text-slate-500 whitespace-nowrap">
                          {formatDateTime(log.timestamp, lang)}
                        </TableCell>
                        <TableCell className="py-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {log.user_name || log.user_email || t('central.permissions.unknown_account')}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5 text-slate-500 text-[11px] font-mono">
                          {log.resource_type}
                        </TableCell>
                        <TableCell className="py-2.5 text-slate-700 dark:text-slate-300 max-w-md truncate" title={log.description}>
                          {log.description}
                        </TableCell>
                        <TableCell className="py-2.5 font-mono text-[10px] text-slate-400 text-end">
                          {log.checksum ? `${log.checksum.slice(0, 8)}…` : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* التصفح Pagination */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {t('central.permissions.pagination_showing', {
                      count: paginatedAuditLogs.length,
                      total: filteredAuditLogs.length,
                      page: auditPage,
                      pages: totalAuditPages,
                    })}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={auditPage <= 1}
                      onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                      className="h-7 text-xs px-2"
                    >
                      {t('central.permissions.prev')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={auditPage >= totalAuditPages}
                      onClick={() => setAuditPage((p) => Math.min(totalAuditPages, p + 1))}
                      className="h-7 text-xs px-2"
                    >
                      {t('central.permissions.next')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 7. نافذة الحوار الرسمية: دعوة موظف جديد (Modal) */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5">
            
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="size-5 text-emerald-600" />
                  <span>{t('central.permissions.invite_modal_title')}</span>
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t('central.permissions.invite_modal_desc')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="size-5" />
              </button>
            </div>

            {inviteError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {inviteError}
              </div>
            )}

            {/* في حال تم توليد الرابط بنجاح */}
            {generatedInviteUrl ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="size-4" />
                  <span>{lang === 'ar' ? 'تم إنشاء الدعوة وإرسالها بنجاح!' : 'Invitation émise avec succès !'}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {lang === 'ar'
                    ? 'تم إرسال بريد رسمي للموظف، كما يمكنك نسخ رابط التفعيل المباشر أدناه:'
                    : 'Le lien d’activation sécurisé peut également être copié directement ci-dessous :'}
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={generatedInviteUrl}
                    className="h-8 text-xs font-mono bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(generatedInviteUrl)}
                    className="h-8 px-3 text-xs font-bold gap-1.5 shrink-0 bg-emerald-700 text-white hover:bg-emerald-800"
                  >
                    {copiedUrl ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    <span>{copiedUrl ? t('central.permissions.copied') : t('central.permissions.copy_link')}</span>
                  </Button>
                </div>
                <div className="pt-2 text-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="text-xs font-bold"
                  >
                    {lang === 'ar' ? 'إغلاق النافذة' : 'Fermer'}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                
                {/* الاسم الكامل */}
                <div className="space-y-1.5">
                  <Label htmlFor="inviteName" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('central.permissions.full_name')} *
                  </Label>
                  <Input
                    id="inviteName"
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: الأستاذ محمد بن سالم' : 'ex: Mohamed Ben Salem'}
                    className="text-xs h-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                  />
                </div>

                {/* البريد الرسمي */}
                <div className="space-y-1.5">
                  <Label htmlFor="inviteEmail" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('central.permissions.email')} *
                  </Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="agent.name@safaqat.gov.dz"
                    className="text-xs h-9 font-mono bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                  />
                </div>

                {/* اختيار الدور */}
                <div className="space-y-1.5">
                  <Label htmlFor="inviteRole" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('central.permissions.role')} *
                  </Label>
                  <select
                    id="inviteRole"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full h-9 text-xs px-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="inspector">
                      {t('central.permissions.roles.inspector')} — (التفتيش، التدقيق، وإصدار الإعذارات الإدارية)
                    </option>
                    <option value="analyst">
                      {t('central.permissions.roles.analyst')} — (التحليلات الإحصائية، رادار الشبهات، والتقارير)
                    </option>
                    <option value="financial_auditor">
                      {t('central.permissions.roles.financial_auditor')} — (مراقبة الميزانيات، أسعار الصفقات، والمدفوعات)
                    </option>
                    <option value="system_admin">
                      {t('central.permissions.roles.system_admin')} — (إدارة الحسابات التقنية والأمان والربط)
                    </option>
                    <option value="inspector_general">
                      {t('central.permissions.roles.inspector_general')} — (كامل الصلاحيات الرقابية والإشرافية العليا)
                    </option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="text-xs font-bold h-9"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Annuler'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={inviting}
                    className="text-xs font-bold h-9 bg-emerald-700 hover:bg-emerald-800 text-white gap-2"
                  >
                    {inviting ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin" />
                        <span>{lang === 'ar' ? 'جاري الإرسال والتشفير...' : 'Envoi en cours...'}</span>
                      </>
                    ) : (
                      <>
                        <Mail className="size-3.5" />
                        <span>{t('central.permissions.send_invite')}</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CentralPermissions;
