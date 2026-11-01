import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useI18n } from '@/i18n';
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
} from 'lucide-react';

interface CommitteeMember {
  id: string;
  fullName: string;
  role: 'president' | 'secretary' | 'member' | 'controller';
  organization?: string;
  title?: string;
  email?: string;
  appointedAt: string;
  isActive: boolean;
}

export function DealCommitteeManager() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t, dir } = useI18n();

  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'president' | 'secretary' | 'member' | 'controller'>('member');
  const [organization, setOrganization] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');

  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const loadMembers = () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/authority/opportunities/${id}/committee/members`)
      .then((res) => {
        if (!res.ok) throw new Error(t('authority.committee.fetch_error'));
        return res.json();
      })
      .then((data) => {
        setMembers(data.committee || data.members || []);
      })
      .catch((err: any) => {
        setError(err.message || t('authority.committee.load_error'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMembers();
  }, [id]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const assignedRole = (role === 'secretary' ? 'rapporteur' : role === 'controller' ? 'member' : role) as 'president' | 'rapporteur' | 'member';
      const newMember = {
        displayName: fullName.trim(),
        role: assignedRole,
        appointmentReference: organization.trim() || t('authority.committee.default_appointment_ref'),
      };

      const existingPayload = members.map((m: any) => ({
        displayName: m.displayName || m.fullName || t('authority.committee.default_member_name'),
        role: (m.role === 'secretary' ? 'rapporteur' : m.role === 'controller' ? 'member' : m.role) as 'president' | 'rapporteur' | 'member',
        appointmentReference: m.appointmentReference || m.organization || t('authority.committee.default_appointment_internal'),
      }));

      const res = await fetch(`/api/authority/opportunities/${id}/committee/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-safaqat-csrf': '1',
        },
        body: JSON.stringify({
          members: [...existingPayload, newMember],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || t('authority.committee.assign_error'));
      }

      setSuccess(t('authority.committee.assign_success'));
      setFullName('');
      setOrganization('');
      setTitle('');
      setEmail('');
      loadMembers();
    } catch (err: any) {
      setError(err.message || t('authority.committee.generic_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const hasPresident = members.some((m) => m.role === 'president');
  const isQuorumReady = members.length >= 3 && hasPresident;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <section className="rounded-2xl p-6 md:p-8 text-white bg-navy-900 border border-navy-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 p-1.5 h-auto rounded-lg"
              onClick={() => setLocation(id ? `/authority/opportunities/${id}/received-offers` : '/authority/offers')}
            >
              <ArrowIcon className="w-4 h-4" />
            </Button>
            <span className="text-xs font-semibold text-navy-100">
              {t('lifecycle.opening.decree_ref')}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white">
            {t('lifecycle.committee.title')}
          </h2>
          <p className="text-xs text-navy-100">
            {t('authority.committee.desc')}
          </p>
        </div>

        {/* Quorum Badge */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-5 py-3 flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${isQuorumReady ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : 'bg-amber-500/20 text-amber-300 border-amber-400/30'}`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-navy-100">{t('lifecycle.opening.quorum')}</div>
            <div className="text-sm font-black text-white">
              {isQuorumReady ? (
                <span className="text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('lifecycle.opening.quorum_met')} ({members.length})
                </span>
              ) : (
                <span className="text-amber-300">
                  {members.length < 3 ? t('authority.committee.quorum_need_members', { count: 3 - members.length }) : t('authority.committee.quorum_need_president')}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

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
                <p className="text-[11px]">{t('authority.committee.empty_desc')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((m, idx) => (
                  <div
                    key={m.id}
                    className="p-4 bg-background border border-border rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-navy-50 text-navy-900 font-extrabold flex items-center justify-center text-xs shrink-0 border border-navy-100">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy-900 text-sm">{(m as any).displayName || m.fullName}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              m.role === 'president'
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : m.role === 'secretary'
                                ? 'bg-blue-50 text-blue-900 border-blue-200'
                                : m.role === 'controller'
                                ? 'bg-teal-50 text-teal-900 border-teal-200'
                                : 'bg-slate-50 text-slate-800 border-slate-200'
                            }`}
                          >
                            {m.role === 'president'
                              ? t('lifecycle.committee.role_president')
                              : m.role === 'secretary'
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
              disabled={submitting || !fullName.trim()}
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
