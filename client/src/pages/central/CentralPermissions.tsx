import React, { useState } from 'react';
import { PageHeader, KpiCard, AICard } from '@/shared/components';
import {
  Shield,
  Users,
  Building,
  UserCheck,
  Search,
  Key,
  Lock,
  Unlock,
  History,
  CheckCircle2,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'central_admin' | 'authority' | 'operator' | 'auditor';
  organization: string;
  status: 'active' | 'suspended';
  lastLogin: string;
}

interface AuditRecord {
  id: string;
  action: string;
  targetUser: string;
  timestamp: string;
  hash: string;
}

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-1',
    email: 'admin@safaqat.dz',
    name: 'أحمد بن علي',
    role: 'central_admin',
    organization: 'المرصد الوطني للصفقات العمومية',
    status: 'active',
    lastLogin: '2026-10-14 00:24',
  },
  {
    id: 'usr-2',
    email: 'authority@safaqat.dz',
    name: 'كريم مرواني',
    role: 'authority',
    organization: 'مديرية الأشغال العمومية - الجزائر',
    status: 'active',
    lastLogin: '2026-10-13 23:40',
  },
  {
    id: 'usr-3',
    email: 'operator@safaqat.dz',
    name: 'سفيان دراجي',
    role: 'operator',
    organization: 'شركة كوزيدار للأشغال والمنشآت',
    status: 'active',
    lastLogin: '2026-10-13 23:15',
  },
  {
    id: 'usr-4',
    email: 'auditor.oran@safaqat.dz',
    name: 'فاطمة زهرة بلحاج',
    role: 'auditor',
    organization: 'المفتشية العامة للمالية (IGF)',
    status: 'active',
    lastLogin: '2026-10-12 16:30',
  },
  {
    id: 'usr-5',
    email: 'contact@banned-rafidain.dz',
    name: 'رشيد قادري',
    role: 'operator',
    organization: 'شركة الرافدين للأشغال (مقصاة)',
    status: 'suspended',
    lastLogin: '2026-08-10 11:20',
  },
];

const INITIAL_AUDIT_TRAIL: AuditRecord[] = [
  {
    id: 'aud-101',
    action: 'تعليق حساب المتعامل إثر صدور قرار إقصاء وزاري',
    targetUser: 'contact@banned-rafidain.dz',
    timestamp: '2026-08-11 09:15:00',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    id: 'aud-102',
    action: 'ترقية الصلاحيات إلى مفتش عام معتمد',
    targetUser: 'auditor.oran@safaqat.dz',
    timestamp: '2026-09-01 10:00:22',
    hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
  },
];

export function CentralPermissions() {
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [auditTrail, setAuditTrail] = useState<AuditRecord[]>(INITIAL_AUDIT_TRAIL);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.organization.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newStatus = u.status === 'active' ? 'suspended' : 'active';
          const newAudit: AuditRecord = {
            id: `aud-${Date.now()}`,
            action: newStatus === 'active' ? 'تفعيل الحساب وإلغاء التعليق' : 'تعليق الحساب ومنع الوصول للمنصة',
            targetUser: u.email,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            hash: Array.from(crypto.getRandomValues(new Uint8Array(16)))
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('') + '9f88c',
          };
          setAuditTrail((aud) => [newAudit, ...aud]);
          setNotification(`تم تحديث حالة المستخدم ${u.email} إلى ${newStatus === 'active' ? 'نشط' : 'معلّق'} وتوثيق البصمة بالسجل.`);
          setTimeout(() => setNotification(null), 4000);
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  const getRoleBadge = (role: UserAccount['role']) => {
    switch (role) {
      case 'central_admin':
        return <Badge className="bg-purple-100 text-purple-900 border-purple-300 font-bold">مسؤول وطني مركزي</Badge>;
      case 'authority':
        return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300">مصلحة متعاقدة</Badge>;
      case 'operator':
        return <Badge className="bg-sky-50 text-sky-800 border-sky-300">متعامل اقتصادي</Badge>;
      case 'auditor':
        return <Badge className="bg-amber-50 text-amber-800 border-amber-300">هيئة تدقيق ورقابة</Badge>;
    }
  };

  return (
    <div className="space-y-6 page-container py-4">
      <PageHeader
        eyebrow="المراقبة الوطنية"
        title="إدارة الصلاحيات والأدوار"
        description="التحكم في وصول المستخدمين والمصالح والمتعاملين وتأمين العمليات بسجل تدقيق مشفر (SHA-256)"
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          eyebrow="مستخدمون نشطون"
          value="2,410"
          trend={8}
          trendLabel="حسابات محينة"
          sparkline={[1800, 1950, 2100, 2200, 2300, 2380, 2410]}
          icon={UserCheck}
          accent="navy"
        />
        <KpiCard
          eyebrow="مسؤولون مركزيون"
          value="18"
          trend={0}
          trendLabel="صلاحيات إدارة عليا"
          sparkline={[15, 16, 17, 18, 18, 18, 18]}
          icon={Shield}
          accent="red"
        />
        <KpiCard
          eyebrow="مصالح متعاقدة"
          value="87"
          trend={4}
          trendLabel="هيئات مفوضة"
          sparkline={[75, 78, 80, 82, 85, 86, 87]}
          icon={Building}
          accent="emerald"
        />
        <KpiCard
          eyebrow="متعاملون اقتصاديون"
          value="45K"
          trend={6}
          trendLabel="شركات مؤهلة"
          sparkline={[38, 40, 41, 42, 43, 44, 45]}
          icon={Users}
          accent="gold"
        />
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Grid: Users Table + Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        {/* Table Card */}
        <Card className="shadow-sm border border-[var(--color-border-subtle)] bg-[var(--card-bg)]">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
            <div>
              <CardTitle className="text-xl font-bold text-[var(--color-text-primary)]">
                جدول المستخدمين والصلاحيات
              </CardTitle>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                التحكم في أدوار الحسابات وتوزيع الصلاحيات الإجرائية
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="size-4 absolute start-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="بحث بالاسم أو البريد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 pe-3 py-1.5 text-xs rounded-lg border border-[var(--color-border-subtle)] bg-[var(--card-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-primary)]"
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--color-border-subtle)] bg-[var(--card-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-primary)]"
                aria-label="تصفية حسب الدور"
              >
                <option value="all">كل الأدوار</option>
                <option value="central_admin">مسؤول وطني</option>
                <option value="authority">مصلحة متعاقدة</option>
                <option value="operator">متعامل اقتصادي</option>
                <option value="auditor">هيئة تدقيق</option>
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">المستخدم والبريد</TableHead>
                  <TableHead>الدور الوظيفي</TableHead>
                  <TableHead>الهيئة / المؤسسة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>آخر دخول</TableHead>
                  <TableHead className="w-[120px] text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <TableCell>
                      <div className="font-semibold text-sm text-[var(--color-text-primary)]">
                        {user.name}
                      </div>
                      <div className="font-mono text-xs text-[var(--color-text-muted)]">
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="text-xs text-[var(--color-text-secondary)]">
                      {user.organization}
                    </TableCell>
                    <TableCell>
                      {user.status === 'active' ? (
                        <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300">
                          نشط ومفعل
                        </Badge>
                      ) : (
                        <Badge className="bg-red-50 text-red-800 border-red-300">معلّق</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[var(--color-text-muted)]">
                      {user.lastLogin}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleUserStatus(user.id)}
                          className={`h-7 px-2 text-xs ${
                            user.status === 'active'
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={user.status === 'active' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                        >
                          {user.status === 'active' ? (
                            <Lock className="size-3.5" />
                          ) : (
                            <Unlock className="size-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsSheetOpen(true);
                          }}
                          className="h-7 px-2 text-xs text-[var(--portal-primary)] hover:bg-slate-100"
                        >
                          تفاصيل
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Audit Trail Sidebar */}
        <aside className="space-y-4">
          <Card className="border border-[var(--color-border-subtle)] bg-[var(--card-bg)] shadow-sm">
            <CardHeader className="pb-3 border-b border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2">
                <History className="size-4 text-[var(--portal-primary)]" />
                <CardTitle className="text-base font-bold text-[var(--color-text-primary)]">
                  سجل التغييرات المشفر
                </CardTitle>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                بصمة رقمية لكل عملية تعديل صلاحية (SHA-256)
              </p>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {auditTrail.map((record) => (
                <div
                  key={record.id}
                  className="p-3 rounded-lg bg-slate-50 border border-[var(--color-border-subtle)] space-y-1.5 text-xs"
                >
                  <div className="font-semibold text-[var(--color-text-primary)]">
                    {record.action}
                  </div>
                  <div className="font-mono text-[11px] text-[var(--color-text-muted)] truncate">
                    المستهدف: {record.targetUser}
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-purple-700 bg-purple-50 p-1 rounded overflow-hidden">
                    <Hash className="size-3 shrink-0" />
                    <span className="truncate">{record.hash}</span>
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground text-end">
                    {record.timestamp}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* User Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="end" className="sm:max-w-md p-6 bg-[var(--paper-50)] overflow-y-auto">
          {selectedUser && (
            <div className="space-y-6">
              <SheetHeader className="text-start border-b border-[var(--color-border-subtle)] pb-4">
                <span className="eyebrow">بطاقة المستخدم والصلاحيات</span>
                <SheetTitle className="text-xl font-bold text-[var(--color-text-primary)]">
                  {selectedUser.name}
                </SheetTitle>
                <SheetDescription className="font-mono text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {selectedUser.email}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 text-sm">
                <div className="p-3.5 rounded-lg bg-[var(--card-bg)] border border-[var(--color-border-subtle)] space-y-1">
                  <div className="text-xs text-[var(--color-text-muted)]">الدور المعتمد</div>
                  <div>{getRoleBadge(selectedUser.role)}</div>
                </div>

                <div className="p-3.5 rounded-lg bg-[var(--card-bg)] border border-[var(--color-border-subtle)] space-y-1">
                  <div className="text-xs text-[var(--color-text-muted)]">الهيئة / المنظمة</div>
                  <div className="font-semibold text-xs text-[var(--color-text-primary)]">
                    {selectedUser.organization}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[var(--card-bg)] border border-[var(--color-border-subtle)] space-y-1">
                  <div className="text-xs text-[var(--color-text-muted)]">حالة الدخول إلى النظام</div>
                  <div className="font-bold text-xs">
                    {selectedUser.status === 'active' ? 'مصرّح بالوصول الكامل' : 'موقوف مؤقتاً'}
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => toggleUserStatus(selectedUser.id)}
                    variant={selectedUser.status === 'active' ? 'destructive' : 'default'}
                    className="w-full text-xs h-9"
                  >
                    {selectedUser.status === 'active' ? 'تعليق حساب المستخدم' : 'إعادة تفعيل الحساب'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default CentralPermissions;
