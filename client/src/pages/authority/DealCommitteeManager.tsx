import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  ShieldCheck,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Briefcase,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface CommitteeMember {
  id: string;
  fullName: string;
  displayName?: string;
  role: 'president' | 'secretary' | 'rapporteur' | 'member' | 'controller';
  organization?: string;
  title?: string;
  email?: string;
  appointedAt: string;
  isActive: boolean;
}

interface DealOption {
  id: string;
  title: string;
  reference_number?: string;
  current_stage?: number;
  stage_display?: string;
}

export function DealCommitteeManager() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t, dir, lang } = useI18n();

  const [deals, setDeals] = useState<DealOption[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<string>(id || '');
  const [loadingDeals, setLoadingDeals] = useState(true);

  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [decreeRef, setDecreeRef] = useState<string>('');
  const [dealInfo, setDealInfo] = useState<{ title?: string; reference?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'president' | 'secretary' | 'rapporteur' | 'member' | 'controller'>('member');
  const [organization, setOrganization] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');

  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  // 1. Load Deals List for Authority
  useEffect(() => {
    let isMounted = true;
    setLoadingDeals(true);
    api.get('/procurements/deals/')
      .then((res) => {
        if (!isMounted) return;
        const list: DealOption[] = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setDeals(list);
        if (!selectedDealId && list.length > 0) {
          setSelectedDealId(list[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load deals for committee', err);
      })
      .finally(() => {
        if (isMounted) setLoadingDeals(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update selectedDealId if URL param id changes
  useEffect(() => {
    if (id) {
      setSelectedDealId(id);
    }
  }, [id]);

  // 2. Load Committee Members for Selected Deal
  const loadMembers = (targetDealId: string) => {
    if (!targetDealId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    fetch(`/api/authority/opportunities/${targetDealId}/committee/members/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('safaqat_access_token') || ''}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(t('authority.committee.fetch_error'));
        return res.json();
      })
      .then((data) => {
        setMembers(data.committee || data.members || []);
        setDecreeRef(data.decree_reference || `DEC-COPEM-${targetDealId.slice(0, 6).toUpperCase()}`);
        setDealInfo({
          title: data.deal_title,
          reference: data.deal_reference,
        });
      })
      .catch((err: any) => {
        setError(err.message || t('authority.committee.load_error'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedDealId) {
      loadMembers(selectedDealId);
    }
  }, [selectedDealId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !selectedDealId) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const assignedRole = (role === 'secretary' ? 'rapporteur' : role === 'controller' ? 'member' : role);
      const newMember = {
        displayName: fullName.trim(),
        fullName: fullName.trim(),
        role: assignedRole,
        appointmentReference: organization.trim() || t('authority.committee.default_appointment_ref'),
        organization: organization.trim() || t('authority.committee.default_appointment_ref'),
        title: title.trim() || undefined,
        email: email.trim() || undefined,
      };

      const res = await fetch(`/api/authority/opportunities/${selectedDealId}/committee/members/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('safaqat_access_token') || ''}`,
          'x-safaqat-csrf': '1',
        },
        body: JSON.stringify(newMember),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || t('authority.committee.assign_error'));
      }

      setSuccess(t('authority.committee.assign_success'));
      toast.success(lang === 'ar' ? 'تم إضافة عضو اللجنة وتحديث مقرر التعيين بنجاح' : 'Membre ajouté avec succès');
      setFullName('');
      setOrganization('');
      setTitle('');
      setEmail('');
      loadMembers(selectedDealId);
    } catch (err: any) {
      setError(err.message || t('authority.committee.generic_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintDecree = () => {
    window.print();
  };

  const hasPresident = members.some((m) => m.role === 'president');
  const isQuorumReady = members.length >= 3 && hasPresident;
  const currentDeal = deals.find((d) => d.id === selectedDealId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir={dir}>
      {/* Top Banner */}
      <section className="rounded-2xl p-6 md:p-8 bg-white border border-slate-200/90 text-slate-900 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-1.5 h-auto rounded-lg cursor-pointer"
              onClick={() => setLocation(selectedDealId ? `/authority/deals/${selectedDealId}` : '/authority/deals')}
            >
              <ArrowIcon className="w-4 h-4" />
            </Button>
            <span className="text-xs font-bold text-emerald-800">
              {decreeRef ? `${t('lifecycle.opening.decree_ref')}: ${decreeRef}` : t('lifecycle.opening.decree_ref')}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900">
            {t('lifecycle.committee.title')}
          </h1>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            {t('authority.committee.desc')}
          </p>
        </div>

        {/* Quorum Badge & Action */}
        <div className="flex items-center gap-3 self-end md:self-center flex-wrap">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-2xs">
            <div className={`p-2 rounded-xl border ${isQuorumReady ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold">{t('lifecycle.opening.quorum')}</div>
              <div className="text-xs font-bold text-slate-900">
                {isQuorumReady ? (
                  <span className="text-emerald-700 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('lifecycle.opening.quorum_met')} ({members.length})
                  </span>
                ) : (
                  <span className="text-amber-700 font-bold">
                    {members.length < 3 ? t('authority.committee.quorum_need_members', { count: 3 - members.length }) : t('authority.committee.quorum_need_president')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrintDecree}
            className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
            title={lang === 'ar' ? 'طباعة مقرر التعيين الرسمي (PDF)' : 'Imprimer la décision de nomination'}
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'مقرر التعيين' : 'Décision'}</span>
          </Button>
        </div>
      </section>

      {/* Deal Selector Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Briefcase className="size-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-muted-foreground block font-medium">
              {lang === 'ar' ? 'الصفقة المعنية باللجنة (المادة 78 من القانون 23-12)' : 'Marché concerné par la commission'}
            </span>
            <div className="font-bold text-sm text-foreground truncate">
              {currentDeal ? `${currentDeal.reference_number || ''} — ${currentDeal.title}` : (dealInfo?.title || '...')}
            </div>
          </div>
        </div>

        {deals.length > 0 && (
          <div className="shrink-0 flex items-center gap-2">
            <label htmlFor="deal-select" className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              {lang === 'ar' ? 'تبديل الصفقة:' : 'Changer :'}
            </label>
            <div className="relative">
              <select
                id="deal-select"
                value={selectedDealId}
                onChange={(e) => {
                  setSelectedDealId(e.target.value);
                  setLocation(`/authority/opportunities/${e.target.value}/committee`);
                }}
                className="appearance-none bg-background border border-border text-foreground text-xs font-semibold rounded-xl px-3 py-2 pe-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 max-w-[240px] truncate"
              >
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.reference_number ? `[${d.reference_number}] ` : ''}{d.title.slice(0, 45)}...
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {t('authority.committee.official_members')}
              </h3>
              <span className="text-xs text-muted-foreground">{t('authority.committee.members_count', { count: members.length })}</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                {t('authority.committee.loading')}
              </div>
            ) : members.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-xs space-y-2">
                <Users className="w-8 h-8 mx-auto text-muted-foreground/50" />
                <p>{t('authority.committee.empty_title')}</p>
                <p className="text-xs">{t('authority.committee.empty_desc')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="p-4 bg-background border border-border rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-navy-50 text-navy-900 font-extrabold flex items-center justify-center text-xs shrink-0 border border-navy-100">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy-900 text-sm">{m.displayName || m.fullName}</span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                              m.role === 'president'
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : m.role === 'secretary' || m.role === 'rapporteur'
                                ? 'bg-blue-50 text-blue-900 border-blue-200'
                                : m.role === 'controller'
                                ? 'bg-teal-50 text-teal-900 border-teal-200'
                                : 'bg-slate-50 text-slate-800 border-slate-200'
                            }`}
                          >
                            {m.role === 'president'
                              ? t('lifecycle.committee.role_president')
                              : m.role === 'secretary' || m.role === 'rapporteur'
                              ? t('lifecycle.committee.role_secretary')
                              : m.role === 'controller'
                              ? t('lifecycle.committee.role_controller')
                              : t('lifecycle.committee.role_member')}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {m.title && <span>{m.title} · </span>}
                          {m.organization || t('authority.topbar.default_org')}
                          {m.email && <span> · {m.email}</span>}
                        </div>
                      </div>
                    </div>
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Member Form */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 h-fit">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <UserPlus className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-navy-900">
              {t('lifecycle.committee.add_member')}
            </h3>
          </div>

          <form onSubmit={handleAddMember} className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t('lifecycle.committee.member_name')} *</Label>
              <Input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('authority.committee.name_placeholder')}
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t('authority.committee.role_label')}</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full text-xs rounded-xl border border-input bg-background px-3 py-2 focus:ring-1 focus:ring-primary"
              >
                <option value="president">{t('lifecycle.committee.role_president')}</option>
                <option value="secretary">{t('lifecycle.committee.role_secretary')}</option>
                <option value="member">{t('lifecycle.committee.role_member')}</option>
                <option value="controller">{t('lifecycle.committee.role_controller')}</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t('lifecycle.committee.dept')}</Label>
              <Input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder={t('authority.committee.dept_placeholder')}
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t('authority.committee.title_label')}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('authority.committee.title_placeholder')}
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">{t('authority.committee.email_label')}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@institution.dz"
                className="text-xs rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || !fullName.trim() || !selectedDealId}
              className="w-full rounded-xl text-xs font-bold gap-2 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              {submitting ? t('authority.committee.submitting') : t('lifecycle.committee.save')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DealCommitteeManager;
