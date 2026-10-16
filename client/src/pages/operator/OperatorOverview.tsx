import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { PageHeader, KpiCard, EmptyState } from '@/shared/components';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Search,
  Building2,
  Calendar,
  FileText,
  Radio,
  BookOpen,
  Scale,
  Archive,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  estimatedBudget: string | null;
  authorityName: string;
  updatedAt: string;
  hasDocument: boolean;
}

interface OfferItem {
  id: string;
  status: 'draft' | 'submitted';
}

export function OperatorOverview() {
  const { t, lang } = useI18n();
  const [, setLocation] = useLocation();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/opportunities').then((res) => (res.ok ? res.json() : Promise.reject())),
      fetch('/api/offers').then((res) => (res.ok ? res.json() : Promise.reject())),
    ])
      .then(([oppsData, offersData]) => {
        if (oppsData.opportunities) setOpportunities(oppsData.opportunities);
        if (offersData.offers) setOffers(offersData.offers);
      })
      .catch((err) => {
        console.error('Overview data fetch error:', err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const submittedCount = offers.filter((o) => o.status === 'submitted').length;
  const draftsCount = offers.filter((o) => o.status === 'draft').length;
  const recentOpps = opportunities.slice(0, 4);

  return (
    <div className="font-sans flex flex-col gap-4">
      {/* 1. Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[26px] font-extrabold text-[#0B1F3A] leading-tight m-0">مساحة العمل</h1>
            <span className="inline-block px-2.5 py-0.5 rounded-full border border-[#EBDDB0] bg-[#FBF3DC] text-[#6B4F0E] text-[12px] font-bold">
              بيانات تجريبية
            </span>
          </div>
          <p className="text-[14.5px] leading-relaxed text-[#5B6B82] m-0">
            نظرة سريعة على فرصك وجاهزية ملف مشاركتك.
          </p>
        </div>
      </div>

      {/* 2. Large 4-Column KPIs Strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3" aria-label="مؤشرات الجاهزية">
        <div className="bg-[#E8EFFA] text-[#14325C] border border-[#CFDCF0] rounded-[12px] p-4 flex flex-col justify-center items-center text-center gap-0.5 shadow-xs">
          <span className="text-[32px] font-extrabold leading-tight">68%</span>
          <span className="text-[13px] font-bold">نسبة الجاهزية</span>
        </div>
        <div className="bg-white text-[#0B1F3A] border border-[#D5DDEA] rounded-[12px] p-4 flex flex-col justify-center items-center text-center gap-0.5 shadow-xs">
          <span className="text-[32px] font-extrabold leading-tight">12</span>
          <span className="text-[13px] font-bold">الوثائق المطلوبة</span>
        </div>
        <div className="bg-[#FCEBEA] text-[#B42318] border border-[#F4C9C5] rounded-[12px] p-4 flex flex-col justify-center items-center text-center gap-0.5 shadow-xs">
          <span className="text-[32px] font-extrabold leading-tight">1</span>
          <span className="text-[13px] font-bold">وثائق ناقصة</span>
        </div>
        <div className="bg-[#FBF3DC] text-[#6B4F0E] border border-[#EBDDB0] rounded-[12px] p-4 flex flex-col justify-center items-center text-center gap-0.5 shadow-xs">
          <span className="text-[32px] font-extrabold leading-tight">5</span>
          <span className="text-[13px] font-bold">قيد الإنجاز</span>
        </div>
      </section>

      {/* 3. Split: Shortcuts Stack + Calendar Deadlines Empty State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-start justify-center gap-2 p-5 border border-[#D5DDEA] rounded-[16px] bg-white shadow-xs">
            <h2 className="text-[18px] font-extrabold text-[#0B1F3A] m-0">الإعلانات وفرص الصفقات</h2>
            <p className="text-[14.5px] leading-relaxed text-[#5B6B82] m-0">
              اعرض الإعلانات المنشورة حسب نوع الإجراء، وأنشئ تنبيهًا يناسب نشاط مؤسستك.
            </p>
            <button
              type="button"
              onClick={() => setLocation('/operator/deals')}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 border-[1.5px] border-[#047857] rounded-[10px] bg-white text-[#065F46] hover:bg-[#ECFDF5] font-bold text-[14px] transition-colors cursor-pointer mt-1"
            >
              فتح الإعلانات
            </button>
          </div>
          <div className="flex flex-col items-start justify-center gap-2 p-5 border border-[#D5DDEA] rounded-[16px] bg-white shadow-xs">
            <h2 className="text-[18px] font-extrabold text-[#0B1F3A] m-0">إدارة العروض</h2>
            <p className="text-[14.5px] leading-relaxed text-[#5B6B82] m-0">
              تابع جاهزية وثائق الصفقة المختارة، وحدّد ما ينقص ملف مشاركتك.
            </p>
            <button
              type="button"
              onClick={() => setLocation('/operator/offers')}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 border-[1.5px] border-[#047857] rounded-[10px] bg-white text-[#065F46] hover:bg-[#ECFDF5] font-bold text-[14px] transition-colors cursor-pointer mt-1"
            >
              فتح إعداد العرض
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center text-center gap-2 p-6 border-[1.5px] border-dashed border-[#AEB9CB] rounded-[16px] bg-white shadow-xs min-h-[220px]">
          <div className="size-[52px] rounded-full bg-[#E8EFFA] text-[#14325C] flex items-center justify-center shrink-0">
            <Calendar className="size-[26px]" strokeWidth={1.8} />
          </div>
          <h3 className="text-[17px] font-extrabold text-[#0B1F3A] mt-1 m-0">لا توجد آجال إيداع قريبة</h3>
          <p className="text-[14.5px] leading-relaxed text-[#5B6B82] max-w-[460px] m-0">
            ستظهر هنا آجال إيداع العروض للصفقات التي اخترتها، لتُنبَّه قبل انتهائها.
          </p>
        </div>
      </div>

      {/* 4. Live Opportunities Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-[var(--color-border-subtle)] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border-subtle)]">
              <div>
                <h3 className="text-base font-bold text-[var(--ink-900)]">{t('overview.discovery.title')}</h3>
                <p className="text-xs text-[var(--ink-500)]">{t('overview.discovery.desc')}</p>
              </div>
              <Button
                variant="outline"
                className="border-[var(--color-border-subtle)] hover:bg-[var(--paper-100)] text-xs font-bold self-start sm:self-center rounded-xl"
                onClick={() => setLocation('/operator/deals')}
              >
                {t('overview.discovery.all')}
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-40 rounded-xl bg-[var(--paper-100)] animate-pulse" />
                ))}
              </div>
            ) : error || opportunities.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={t('overview.discovery.empty')}
                description={t('overview.discovery.desc')}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-xl"
                    onClick={() => setLocation('/operator/deals')}
                  >
                    <span>{t('overview.discovery.all')}</span>
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentOpps.map((opp) => (
                  <article
                    key={opp.id}
                    className="bg-white border border-[var(--color-border-subtle)] rounded-xl p-4 shadow-xs hover:border-[var(--stamp-green-700)] hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 truncate max-w-[200px]"
                          title={opp.authorityName}
                        >
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">{opp.authorityName}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--ink-500)] shrink-0">
                          <Calendar className="w-3 h-3" />
                          {new Date(opp.updatedAt).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR')}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[var(--ink-900)] line-clamp-1 group-hover:text-[var(--stamp-green-700)] transition-colors" title={opp.title}>
                        {opp.title}
                      </h4>
                      <p className="text-xs text-[var(--ink-500)] line-clamp-2 leading-relaxed">
                        {opp.description}
                      </p>
                    </div>

                    <div className="pt-2.5 flex items-center justify-between border-t border-[var(--color-border-subtle)]">
                      <span className="text-xs font-mono font-bold text-[var(--stamp-green-800)] bg-[var(--stamp-green-50)] px-2 py-0.5 rounded-md border border-[var(--stamp-green-200)]">
                        {opp.estimatedBudget ? `${Number(opp.estimatedBudget).toLocaleString()} د.ج` : '—'}
                      </span>
                      <Button
                        size="sm"
                        className="text-xs font-bold px-3 py-1.5 h-auto bg-[var(--stamp-green-700)] hover:bg-[var(--stamp-green-800)] text-white rounded-lg shadow-xs"
                        onClick={() => setLocation(`/operator/opportunities/${opp.id}`)}
                      >
                        {t('overview.discovery.view_detail')}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Column (1 col): Compliance status + Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Institutional Compliance Card */}
          <article className="bg-white border border-[var(--color-border-subtle)] rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-[var(--stamp-green-800)] border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>حساب معتمد</span>
              </span>
              <span className="text-[11px] font-mono text-[var(--ink-500)]">القانون 23-12</span>
            </div>
            <h3 className="text-sm font-bold text-[var(--ink-900)]">
              البوابة الوطنية للصفقات العمومية
            </h3>
            <p className="text-xs text-[var(--ink-500)] leading-relaxed">
              ملفك مسجل ومؤهل للمشاركة في الإعلانات التنافسية وإيداع الأظرفة الإلكترونية المؤمنة.
            </p>
          </article>

          {/* Quick Access Card */}
          <article className="bg-white border border-[var(--color-border-subtle)] rounded-xl shadow-sm p-5 space-y-3">
            <h3 className="m-0 text-sm font-bold text-[var(--ink-900)]">
              {t('authority.preview.nav_title')}
            </h3>
            <div className="space-y-2">
              <Link
                href="/operator/opening-sessions"
                className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--paper-50)] hover:bg-[var(--paper-100)] text-xs font-semibold text-[var(--ink-800)] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[var(--stamp-green-700)]" />
                  {t('nav.operator.opening_sessions')}
                </span>
                <ChevronLeft className="w-4 h-4 text-[var(--ink-400)]" />
              </Link>
              <Link
                href="/operator/smart-specs"
                className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--paper-50)] hover:bg-[var(--paper-100)] text-xs font-semibold text-[var(--ink-800)] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[var(--official-700)]" />
                  {t('nav.operator.smart_specs')}
                </span>
                <ChevronLeft className="w-4 h-4 text-[var(--ink-400)]" />
              </Link>
              <Link
                href="/operator/objections"
                className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--paper-50)] hover:bg-[var(--paper-100)] text-xs font-semibold text-[var(--ink-800)] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[var(--stamp-gold-700)]" />
                  {t('nav.operator.appeals')}
                </span>
                <ChevronLeft className="w-4 h-4 text-[var(--ink-400)]" />
              </Link>
              <Link
                href="/operator/archive"
                className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--paper-50)] hover:bg-[var(--paper-100)] text-xs font-semibold text-[var(--ink-800)] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-[var(--ink-600)]" />
                  {t('nav.operator.archive')}
                </span>
                <ChevronLeft className="w-4 h-4 text-[var(--ink-400)]" />
              </Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

export default OperatorOverview;
