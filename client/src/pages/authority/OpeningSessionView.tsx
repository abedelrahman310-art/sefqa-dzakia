import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ShieldCheck,
  AlertCircle,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  FileText,
  BadgeCheck,
  Play,
  Lock,
} from 'lucide-react';

interface ReadoutItem {
  offerId: string;
  bidderName: string;
  financialAmount: string | null;
  durationDays: number | null;
  hasCandidatureEnvelope: boolean;
  hasTechnicalEnvelope: boolean;
  hasFinancialEnvelope: boolean;
  hasDocument: boolean;
  rebatePercent: number | null;
  submittedAt: string;
}

interface CommitteeMember {
  id: string;
  fullName: string;
  role: string;
  organization?: string;
}

export function OpeningSessionView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t, dir } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deal, setDeal] = useState<any>(null);
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [readout, setReadout] = useState<ReadoutItem[]>([]);
  const [pvInfo, setPvInfo] = useState<any>(null);

  // Convening form state
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [conveningNotes, setConveningNotes] = useState('');
  const [conveneLoading, setConveneLoading] = useState(false);

  // PV Sign state
  const [pvNotes, setPvNotes] = useState('');
  const [signLoading, setSignLoading] = useState(false);

  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError('');

    try {
      // 1. Fetch draft/deal info
      const draftRes = await fetch(`/api/drafts/${id}`);
      if (!draftRes.ok) throw new Error('فشل جلب تفاصيل الصفقة');
      const draftData = await draftRes.json();
      setDeal(draftData);

      // 2. Fetch committee members
      const commRes = await fetch(`/api/authority/opportunities/${id}/committee/members`);
      if (commRes.ok) {
        const commData = await commRes.json();
        const list = commData.committee || commData.members || [];
        setMembers(list);
        setAttendeeIds(list.map((m: any) => m.id));
      }

      // 3. If in progress or opened, fetch readout
      if (['opening_in_progress', 'opened_pv_signed', 'technical_evaluation', 'financial_evaluation', 'provisional_award'].includes(draftData.status)) {
        const roRes = await fetch(`/api/authority/opportunities/${id}/opening-readout`);
        if (roRes.ok) {
          const roData = await roRes.json();
          setReadout(roData.readoutBids || roData.readout || []);
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل الجلسة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleConvene = async () => {
    setConveneLoading(true);
    setError('');
    try {
      const attendeesPayload = members.map((m: any) => ({
        name: m.displayName || m.fullName || 'عضو لجنة',
        role: m.role || 'member',
        present: attendeeIds.includes(m.id),
      }));

      const res = await fetch(`/api/authority/opportunities/${id}/convene-opening`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-safaqat-csrf': '1',
        },
        body: JSON.stringify({
          attendees: attendeesPayload,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'فشل افتتاح جلسة الفتح');
      }

      await loadData();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء افتتاح الجلسة');
    } finally {
      setConveneLoading(false);
    }
  };

  const handleSignPv = async () => {
    setSignLoading(true);
    setError('');
    try {
      const signersPayload = members
        .filter((m: any) => attendeeIds.includes(m.id))
        .map((m: any) => ({
          name: m.displayName || m.fullName || 'عضو لجنة',
          role: m.role || 'member',
          signed: true,
        }));

      if (signersPayload.length === 0) {
        throw new Error('يجب حضور وتوقيع عضو واحد على الأقل على محضر الفتح.');
      }

      const res = await fetch(`/api/authority/opportunities/${id}/sign-opening-pv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-safaqat-csrf': '1',
        },
        body: JSON.stringify({
          observations: pvNotes.trim() || undefined,
          signers: signersPayload,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'فشل توقيع محضر فتح الأظرفة');
      }

      const pvResult = await res.json();
      setPvInfo(pvResult.pv || pvResult);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء توقيع المحضر');
    } finally {
      setSignLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-muted-foreground space-y-2">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">جاري تهيئة جلسة فتح الأظرفة...</span>
      </div>
    );
  }

  const isSessionOpen = ['opening_in_progress', 'opened_pv_signed', 'technical_evaluation', 'financial_evaluation', 'provisional_award'].includes(deal?.status);
  const isPvSigned = ['opened_pv_signed', 'technical_evaluation', 'financial_evaluation', 'provisional_award'].includes(deal?.status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <section className="rounded-2xl p-6 md:p-8 text-white bg-gradient-to-r from-navy-900 to-navy-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 p-1.5 h-auto rounded-lg"
              onClick={() => setLocation(`/authority/opportunities/${id}/received-offers`)}
            >
              <ArrowIcon className="w-4 h-4" />
            </Button>
            <span className="text-xs font-bold text-navy-100 uppercase tracking-wider">
              {t('lifecycle.opening.decree_ref')}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {t('lifecycle.opening.title')}
          </h2>
          <p className="text-xs text-navy-100">
            الصفقة: <span className="font-bold text-white">{deal?.title}</span>
          </p>
        </div>

        {/* Status Pill */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-5 py-3 flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${isPvSigned ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : isSessionOpen ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' : 'bg-amber-500/20 text-amber-300 border-amber-400/30'}`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-navy-100">حالة الإجراء</div>
            <div className="text-sm font-black text-white">
              {isPvSigned
                ? 'تم توقيع محضر الفتح'
                : isSessionOpen
                ? 'جلسة الفتح جارية'
                : 'بانتظار افتتاح الجلسة'}
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PV Signed Cryptographic Banner */}
      {isPvSigned && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl space-y-3 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <BadgeCheck className="w-5 h-5 text-emerald-600" />
              <span>{t('lifecycle.opening.pv_signed')}</span>
            </div>
            <Button
              className="rounded-xl text-xs font-bold gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
              onClick={() => setLocation(`/authority/opportunities/${id}/evaluation`)}
            >
              <FileCheck className="w-4 h-4" />
              {t('lifecycle.opening.proceed_to_eval')}
            </Button>
          </div>
          <div className="text-xs space-y-1 bg-white/70 p-3 rounded-xl border border-emerald-100 font-mono">
            <div className="text-[11px] text-emerald-800 font-sans font-bold flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              {t('lifecycle.opening.hash_label')}
            </div>
            <div className="text-xs break-all text-slate-700">
              {pvInfo?.digest || 'تم توثيق المحضر وتوليد البصمة المشفرة بنجاح'}
            </div>
            {pvInfo?.pvNumber && (
              <div className="text-[11px] text-slate-600 font-sans">
                رقم المحضر: <strong className="font-mono text-emerald-900">{pvInfo.pvNumber}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 1: Quorum & Convening (If session not open yet) */}
      {!isSessionOpen && (
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              التحقق من النصاب القانوني لجلسة الفتح (المادة 71)
            </h3>
            <span className="text-xs text-muted-foreground">
              {members.length} عضو مسجل في اللجنة
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              وفقاً لأحكام المادة 71 من المرسوم الرئاسي 15-247، تجتمع لجنة فتح الأظرفة في جلسة علنية بحضور الأغلبية المطلقة لأعضائها ورئيس اللجنة. يرجى تأكيد حضور الأعضاء:
            </p>

            {members.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between">
                <span>لم يتم تسجيل أعضاء لهذه اللجنة بعد.</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs"
                  onClick={() => setLocation(`/authority/opportunities/${id}/committee`)}
                >
                  إدارة أعضاء اللجنة
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {members.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background cursor-pointer hover:border-primary/40 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={attendeeIds.includes(m.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAttendeeIds([...attendeeIds, m.id]);
                        } else {
                          setAttendeeIds(attendeeIds.filter((aid) => aid !== m.id));
                        }
                      }}
                      className="rounded text-primary"
                    />
                    <div>
                      <strong className="block text-navy-900">{m.fullName}</strong>
                      <span className="text-[11px] text-muted-foreground">{m.role}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold">ملاحظات افتتاح الجلسة (اختياري)</label>
              <Textarea
                value={conveningNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConveningNotes(e.target.value)}
                placeholder="حضور العارضين، توقيت فتح الجلسة، ظروف الإيداع..."
                className="text-xs rounded-xl"
                rows={2}
              />
            </div>

            <Button
              onClick={handleConvene}
              disabled={conveneLoading || attendeeIds.length === 0}
              className="w-full sm:w-auto rounded-xl text-xs font-bold gap-2 bg-navy-900 text-white hover:bg-navy-800"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              {conveneLoading ? 'جاري الافتتاح...' : t('lifecycle.opening.convene_btn')}
            </Button>
          </div>
        </section>
      )}

      {/* Step 2: Article 72 Public Readout Table (Active Session) */}
      {isSessionOpen && (
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {t('lifecycle.opening.readout_title')}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                تُقرأ علناً مبالغ العروض المالية، آجال الإنجاز، والتخفيضات المحتملة (المادة 72 فقرة 2).
              </p>
            </div>
            <span className="text-xs bg-navy-50 text-navy-900 border border-navy-200 px-3 py-1 rounded-full font-bold">
              {readout.length} عروض مفتوحة
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-navy-900">
                  <th className="p-3 font-bold">#</th>
                  <th className="p-3 font-bold">المتعامل الاقتصادي</th>
                  <th className="p-3 font-bold">تاريخ وساعة الإيداع</th>
                  <th className="p-3 font-bold">مبلغ العرض المالي (دج)</th>
                  <th className="p-3 font-bold">مدة الإنجاز</th>
                  <th className="p-3 font-bold">الأظرفة المستلمة</th>
                  <th className="p-3 font-bold">التخفيض (Rabais)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {readout.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                      لا توجد عروض مودعة في هذه الجلسة.
                    </td>
                  </tr>
                ) : (
                  readout.map((item: any, idx) => (
                    <tr key={item.offerId || item.id || idx} className="hover:bg-muted/10">
                      <td className="p-3 font-mono font-bold">{idx + 1}</td>
                      <td className="p-3 font-bold text-navy-900">{item.operatorName || item.bidderName || 'متعامل اقتصادي'}</td>
                      <td className="p-3 text-muted-foreground font-mono">
                        {item.submittedAt ? new Date(item.submittedAt).toLocaleTimeString() : '—'}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-800">
                        {item.financialOffer || item.financialAmount
                          ? Number(item.financialOffer || item.financialAmount).toLocaleString() + ' دج'
                          : 'غير محدد'}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {item.deliveryTimeDays || item.durationDays ? `${item.deliveryTimeDays || item.durationDays} يوم` : '—'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 text-[10px] font-semibold border border-blue-200">
                            الترشح
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 text-[10px] font-semibold border border-emerald-200">
                            التقني
                          </span>
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-900 text-[10px] font-semibold border border-purple-200">
                            المالي
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {item.rebatePercent ? `${item.rebatePercent}%` : 'لا يوجد'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 bg-blue-50/60 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-blue-700" />
            <span>
              <strong>حماية المحتوى التقني:</strong> تبقى الملفات والوثائق التقنية والتفصيلية محفوظة ومشفرة علناً، ولا تُفتح للدراسة إلا للجنة التقييم في فضاء الفحص بعد توقيع هذا المحضر.
            </span>
          </div>

          {/* PV Sign Action Box */}
          {!isPvSigned && (
            <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-3 mt-4">
              <h4 className="text-xs font-bold text-navy-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                تحرير وتوقيع محضر فتح الأظرفة
              </h4>
              <Textarea
                value={pvNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPvNotes(e.target.value)}
                placeholder="تحفظات، ملاحظات العارضين الحاضرين، معاينات اللجنة..."
                className="text-xs rounded-xl"
                rows={2}
              />
              <Button
                onClick={handleSignPv}
                disabled={signLoading}
                className="w-full sm:w-auto rounded-xl text-xs font-bold gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                <BadgeCheck className="w-4 h-4" />
                {signLoading ? 'جاري التوقيع والتشفير...' : t('lifecycle.opening.sign_pv_btn')}
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
