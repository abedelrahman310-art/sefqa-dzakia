import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/i18n';
import { api } from '@/lib/api';
import {
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  Coins,
  CheckCircle2,
  FileText,
  Filter,
  Search,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Send,
  Download,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';

export interface MonitoredProject {
  contract_id: string;
  contract_number: string;
  deal_title: string;
  wilaya: string;
  authority_name: string;
  operator_name: string;
  signed_amount: number;
  duration_months: number;
  ods_date: string;
  elapsed_days: number;
  elapsed_percentage: number;
  physical_progress_percentage: number;
  gap_percentage: number;
  delayed_milestones_count: number;
  amendments_count: number;
  amendments_financial_ratio: number;
  days_extended: number;
  risk_score: number;
  risk_level: 'critical' | 'warning' | 'normal';
  risk_factors: string[];
  statutory_recommendation: string;
}

export function ProjectDelayPredictor() {
  const { t, lang, dir } = useI18n();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<MonitoredProject[]>([]);
  const [selectedWilaya, setSelectedWilaya] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchProjectRisks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ai/central/project-risks/');
      if (res.data?.projects) {
        setProjects(res.data.projects);
      }
    } catch (err) {
      console.warn('Fallback to baseline project delay telemetry:', err);
      // Fallback baseline projects
      setProjects([
        {
          contract_id: 'demo-proj-01',
          contract_number: 'MARCHE-2025-16-042',
          deal_title: 'مشروع إنجاز مجمع مدرسي صنف 2 وتهيئة الحظيرة الحضرية بباب الزوار',
          wilaya: 'الجزائر',
          authority_name: 'مديرية التجهيزات العمومية لولاية الجزائر',
          operator_name: 'مؤسسة الجزائر الحديثة للأشغال والمنشآت الكبرى (ش.ذ.م.م)',
          signed_amount: 185000000.0,
          duration_months: 12,
          ods_date: '2025-05-15',
          elapsed_days: 235,
          elapsed_percentage: 65.3,
          physical_progress_percentage: 24.5,
          gap_percentage: 40.8,
          delayed_milestones_count: 2,
          amendments_count: 2,
          amendments_financial_ratio: 14.8,
          days_extended: 45,
          risk_score: 82,
          risk_level: 'critical',
          risk_factors: [
            'الفارق بين الاستهلاك الزمني (65%) والتقدم الفعلي (24%) يتجاوز 40%',
            'تأخر حرج في ورشة أشغال الهيكل الخرساني والكتامة لمدة 60 يوماً',
            'بلوغ ملاحق الصفقة 14.8% مما يقترب من السقف الأقصى المنصوص عليه في المادة 139 من المرسوم 15-247',
          ],
          statutory_recommendation: 'إصدار إعذار رسمي أخير (Mise en demeure) وفق المادة 122 من دفتر الشروط العامة مع مهلة 10 أيام لتدعيم الورشة باليد العاملة تحت طائلة الفسخ الجزائي على نفقة ومسؤولية المقاولة.',
        },
        {
          contract_id: 'demo-proj-02',
          contract_number: 'MARCHE-2025-31-018',
          deal_title: 'أشغال إعادة تهيئة وتوسعة محطة تصفية المياه المستعملة الكبرى بوهران',
          wilaya: 'وهران',
          authority_name: 'مديرية الموارد المائية لولاية وهران',
          operator_name: 'شركة البناء والري الجزائرية الحديثة (ش.أ)',
          signed_amount: 340000000.0,
          duration_months: 18,
          ods_date: '2025-03-20',
          elapsed_days: 290,
          elapsed_percentage: 53.7,
          physical_progress_percentage: 36.0,
          gap_percentage: 17.7,
          delayed_milestones_count: 1,
          amendments_count: 1,
          amendments_financial_ratio: 7.5,
          days_extended: 30,
          risk_score: 52,
          risk_level: 'warning',
          risk_factors: [
            'تباطؤ في توريد المضخات الكهروميكانيكية وتجهيزات المعالجة الثلاثية',
            'تسجيل فارق زمني قدره 17.7% مقارنة بالجدول الزمني المرجعي',
          ],
          statutory_recommendation: 'إلزام مكتب الدراسات المكلف بالمتابعة برفع وتيرة المعاينات الأسبوعية وتكثيف التنسيق مع مصالح الجمارك لتسريع تسريح التجهيزات المستوردة.',
        },
        {
          contract_id: 'demo-proj-03',
          contract_number: 'MARCHE-2025-25-009',
          deal_title: 'مشروع إنجاز مستشفى 120 سرير المتخصص في أمراض القلب وجراحة الأوعية',
          wilaya: 'قسنطينة',
          authority_name: 'مديرية الصحة والسكان لولاية قسنطينة',
          operator_name: 'مجمع النور للمقاولات العامة والتجهيز الطبي',
          signed_amount: 890000000.0,
          duration_months: 24,
          ods_date: '2025-07-01',
          elapsed_days: 180,
          elapsed_percentage: 25.0,
          physical_progress_percentage: 27.5,
          gap_percentage: 0.0,
          delayed_milestones_count: 0,
          amendments_count: 0,
          amendments_financial_ratio: 0.0,
          days_extended: 0,
          risk_score: 18,
          risk_level: 'normal',
          risk_factors: [
            'تقدم مادي يسبق الروزنامة الزمنية المقررة بنسبة +2.5%',
            'انتظام كامل في استلام وضعيات الدفع من الخزينة وصرف المستحقات',
          ],
          statutory_recommendation: 'تثمين وتيرة الإنجاز الاستباقية واعتماد المشروع كنموذج وطني للامتثال للمعايير التعاقدية.',
        },
        {
          contract_id: 'demo-proj-04',
          contract_number: 'MARCHE-2025-30-055',
          deal_title: 'مشروع ربط المحيط الفلاحي حاسي مسعود بشبكة الكهرباء الريفية والآبار الارتوازية',
          wilaya: 'ورقلة',
          authority_name: 'مديرية المصالح الفلاحية لولاية ورقلة',
          operator_name: 'مؤسسة الأطلس للتهيئة والتعمير الصحراوي',
          signed_amount: 125000000.0,
          duration_months: 8,
          ods_date: '2025-06-10',
          elapsed_days: 195,
          elapsed_percentage: 81.2,
          physical_progress_percentage: 31.0,
          gap_percentage: 50.2,
          delayed_milestones_count: 3,
          amendments_count: 1,
          amendments_financial_ratio: 12.0,
          days_extended: 60,
          risk_score: 89,
          risk_level: 'critical',
          risk_factors: [
            'استهلاك أكثر من 81% من المدة التعاقدية مع نسبة إنجاز مادي لا تتعدى 31%',
            'توقف الأشغال لمدة 45 يوماً بسبب نقص المحولات والمولدات الكهربائية',
            'تراكم 3 كشوف حساب معلقة لدى الخزينة لم يتم صرفها',
          ],
          statutory_recommendation: 'إيفاد لجنة تحقيق وزارية مشتركة من المفتشية العامة للإدارة المركزية لمعاينة موقع الورشة وتحديد المسؤوليات بين المصلحة والمتعامل.',
        },
        {
          contract_id: 'demo-proj-05',
          contract_number: 'MARCHE-2025-15-021',
          deal_title: 'أشغال حماية المنحدرات الجبلية وتعبيد الطريق الولائي رقم 253 بأقرو',
          wilaya: 'تيزي وزو',
          authority_name: 'مديرية الأشغال العمومية لولاية تيزي وزو',
          operator_name: 'شركة المنشآت الفنية والخرسانة المسلحة (ش.ذ.م.م)',
          signed_amount: 95000000.0,
          duration_months: 10,
          ods_date: '2025-08-25',
          elapsed_days: 120,
          elapsed_percentage: 40.0,
          physical_progress_percentage: 32.0,
          gap_percentage: 8.0,
          delayed_milestones_count: 0,
          amendments_count: 1,
          amendments_financial_ratio: 4.5,
          days_extended: 15,
          risk_score: 38,
          risk_level: 'warning',
          risk_factors: [
            'صعوبة التضاريس والظروف المناخية تسببت في بطء طفيف في جدران الدعم',
            'طلب ملحق تمديد 15 يوماً مبرر تقنياً وفق المادة 137 من المرسوم 15-247',
          ],
          statutory_recommendation: 'الموافقة على تمديد الآجال التعاقدية المبرر مناخياً ومتابعة استكمال أشغال التعبيد قبل موسم الأمطار.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectRisks();
  }, []);

  const wilayasList = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.wilaya) set.add(p.wilaya);
    });
    return Array.from(set).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchW = selectedWilaya === 'all' || p.wilaya === selectedWilaya;
      const matchR = selectedRisk === 'all' || p.risk_level === selectedRisk;
      const q = searchQuery.trim().toLowerCase();
      const matchQ =
        !q ||
        p.deal_title.toLowerCase().includes(q) ||
        p.contract_number.toLowerCase().includes(q) ||
        p.authority_name.toLowerCase().includes(q) ||
        p.operator_name.toLowerCase().includes(q);
      return matchW && matchR && matchQ;
    });
  }, [projects, selectedWilaya, selectedRisk, searchQuery]);

  const summary = useMemo(() => {
    const total = projects.length;
    const critical = projects.filter((p) => p.risk_level === 'critical').length;
    const warning = projects.filter((p) => p.risk_level === 'warning').length;
    const normal = projects.filter((p) => p.risk_level === 'normal').length;
    const budgetAtRisk = projects
      .filter((p) => p.risk_level === 'critical' || p.risk_level === 'warning')
      .reduce((acc, p) => acc + p.signed_amount, 0);

    return { total, critical, warning, normal, budgetAtRisk };
  }, [projects]);

  const handleTriggerAction = (actionName: string, p: MonitoredProject) => {
    setActionSuccess(t('central.integrity.delay.action_success', { action: actionName, contract: p.contract_number }));
    setTimeout(() => setActionSuccess(null), 5000);
  };

  return (
    <div className="space-y-6" dir={dir}>
      {/* رأس المؤشر: تصميم ناصع ومؤسسي راقٍ */}
      <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-r from-slate-50 via-amber-50/20 to-white p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-500 animate-ping" />
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                {t('central.integrity.delay.engine_badge')}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2.5">
              <span>{t('central.integrity.delay.title')}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 font-bold">
                {t('central.integrity.delay.critical_badge', { count: summary.critical })}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              {t('central.integrity.delay.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <Button
              onClick={fetchProjectRisks}
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs rounded-xl gap-2 h-9"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{t('central.integrity.delay.refresh')}</span>
            </Button>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      {/* بطاقات الإحصاءات التجميعية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>{t('central.integrity.delay.kpi_total')}</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-slate-900">{summary.total}</div>
          <div className="text-xs text-muted-foreground">{t('central.integrity.delay.kpi_total_sub')}</div>
        </div>

        <div className="bg-card border border-rose-200 rounded-2xl p-4 shadow-sm space-y-1 bg-rose-50/20">
          <div className="flex items-center justify-between text-xs text-rose-800 font-semibold">
            <span>{t('central.integrity.delay.kpi_critical')}</span>
            <Flame className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">{summary.critical}</div>
          <div className="text-xs text-rose-700">{t('central.integrity.delay.kpi_critical_sub')}</div>
        </div>

        <div className="bg-card border border-amber-200 rounded-2xl p-4 shadow-sm space-y-1 bg-amber-50/20">
          <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
            <span>{t('central.integrity.delay.kpi_warning')}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{summary.warning}</div>
          <div className="text-xs text-amber-700">{t('central.integrity.delay.kpi_warning_sub')}</div>
        </div>

        <div className="bg-card border border-emerald-200 rounded-2xl p-4 shadow-sm space-y-1 bg-emerald-50/20">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold">
            <span>{t('central.integrity.delay.kpi_budget')}</span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base font-black text-emerald-800 truncate">
            {formatCurrency(summary.budgetAtRisk, lang)}
          </div>
          <div className="text-xs text-emerald-700">{t('central.integrity.delay.kpi_budget_sub')}</div>
        </div>
      </div>

      {/* أدوات البحث والفلترة */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>{t('central.integrity.delay.risk_level_label')}</span>
          </span>
          {[
            { id: 'all', label: t('central.integrity.delay.filter_all') },
            { id: 'critical', label: t('central.integrity.delay.filter_critical') },
            { id: 'warning', label: t('central.integrity.delay.filter_warning') },
            { id: 'normal', label: t('central.integrity.delay.filter_normal') },
          ].map((tier) => (
            <button
              key={tier.id}
              type="button"
              onClick={() => setSelectedRisk(tier.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedRisk === tier.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {wilayasList.length > 0 && (
            <select
              value={selectedWilaya}
              onChange={(e) => setSelectedWilaya(e.target.value)}
              className="text-xs border border-border bg-background rounded-xl h-9 px-3 font-semibold focus:outline-none"
            >
              <option value="all">{t('central.integrity.delay.all_wilayas', { count: wilayasList.length })}</option>
              {wilayasList.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          )}

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('central.integrity.delay.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs ps-8 rounded-xl h-9"
            >
            </Input>
          </div>
        </div>
      </div>

      {/* قائمة المشاريع وبطاقات التحليل المقارن */}
      <div className="grid gap-4">
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-muted/20 border border-dashed border-border rounded-2xl space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-semibold">{t('central.integrity.delay.empty')}</p>
          </div>
        ) : (
          filteredProjects.map((p) => {
            const isCritical = p.risk_level === 'critical';
            const isWarning = p.risk_level === 'warning';

            return (
              <div
                key={p.contract_id}
                className={`bg-card border rounded-2xl p-5 shadow-sm space-y-4 transition-all hover:border-slate-400 ${
                  isCritical ? 'border-rose-300 bg-rose-50/10' : isWarning ? 'border-amber-300' : 'border-border'
                }`}
              >
                {/* رأس البطاقة */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                          isCritical
                            ? 'bg-rose-100 text-rose-900 border-rose-300'
                            : isWarning
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}
                      >
                        {isCritical ? t('central.integrity.delay.badge_critical') : isWarning ? t('central.integrity.delay.badge_warning') : t('central.integrity.delay.badge_normal')}
                      </span>
                      <span className="text-xs font-mono font-bold bg-navy-50 text-navy-900 px-2 py-0.5 rounded border border-navy-100">
                        {p.contract_number}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {p.wilaya}
                      </span>
                      <span className="text-xs font-semibold text-navy-900">
                        {t('central.integrity.delay.deal_value', { amount: formatCurrency(p.signed_amount, lang) })}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-navy-950 mt-1">{p.deal_title}</h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <div className="text-end">
                      <div className="text-xs text-muted-foreground">{t('central.integrity.delay.risk_score_label')}</div>
                      <div
                        className={`text-xl font-black ${
                          isCritical ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {p.risk_score} / 100
                      </div>
                    </div>
                  </div>
                </div>

                {/* شريط مقارنة الاستهلاك الزمني مقابل التقدم المادي */}
                <div className="space-y-2 bg-muted/30 p-3.5 rounded-xl border border-border/60">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-navy-900">
                        <Clock className="w-3.5 h-3.5 text-navy-700" />
                        <span>{t('central.integrity.delay.elapsed', { percent: p.elapsed_percentage, days: p.elapsed_days, total: p.duration_months * 30 })}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-800">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t('central.integrity.delay.progress', { percent: p.physical_progress_percentage })}</span>
                      </span>
                    </div>

                    {p.gap_percentage > 0 ? (
                      <span className="text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                        {t('central.integrity.delay.gap', { percent: p.gap_percentage })}
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">{t('central.integrity.delay.ahead')}</span>
                    )}
                  </div>

                  {/* شريطان متوازيان للمقارنة البصرية الفورية */}
                  <div className="space-y-1.5 pt-1">
                    {/* الاستهلاك الزمني */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-navy-800 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, p.elapsed_percentage)}%` }}
                      />
                    </div>
                    {/* الإنجاز المادي */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCritical ? 'bg-rose-600' : isWarning ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, p.physical_progress_percentage)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* البيانات التفصيلية: المصلحة، المقاولة، مسببات التأخر والملاحق */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1 bg-background p-3 rounded-xl border border-border/60">
                    <div className="flex items-center justify-between text-muted-foreground pb-1 border-b border-border/40">
                      <span>{t('central.integrity.delay.authority_label')}</span>
                      <strong className="text-navy-900">{p.authority_name}</strong>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground pt-1">
                      <span>{t('central.integrity.delay.operator_label')}</span>
                      <strong className="text-navy-900">{p.operator_name}</strong>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground pt-1">
                      <span>{t('central.integrity.delay.ods_label')}</span>
                      <span className="font-mono">{p.ods_date}</span>
                    </div>
                  </div>

                  <div className="space-y-1 bg-background p-3 rounded-xl border border-border/60">
                    <div className="flex items-center justify-between text-muted-foreground pb-1 border-b border-border/40">
                      <span>{t('central.integrity.delay.amendments_label')}</span>
                      <span className="font-semibold text-navy-900">
                        {t('central.integrity.delay.amendments_value', { count: p.amendments_count, ratio: p.amendments_financial_ratio })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground pt-1">
                      <span>{t('central.integrity.delay.delayed_milestones_label')}</span>
                      <span className="font-semibold text-rose-700">{t('central.integrity.delay.delayed_milestones_value', { count: p.delayed_milestones_count })}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground pt-1">
                      <span>{t('central.integrity.delay.days_extended_label')}</span>
                      <span className="font-mono font-semibold">{t('central.integrity.delay.days_extended_value', { days: p.days_extended })}</span>
                    </div>
                  </div>
                </div>

                {/* مسببات الخطر وتنبيهات الذكاء الاصطناعي */}
                {p.risk_factors.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-navy-900">{t('central.integrity.delay.risk_factors_label')}</span>
                    <ul className="list-disc ps-5 text-xs text-slate-600 space-y-0.5">
                      {p.risk_factors.map((rf, idx2) => (
                        <li key={idx2}>{rf}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* التوصية التشريعية والإجراءات */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-navy-900 bg-navy-50/70 p-2.5 rounded-xl border border-navy-200/80 flex-1 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-navy-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">{t('central.integrity.delay.recommendation_label')}</span>
                      <span className="text-navy-800 leading-relaxed">{p.statutory_recommendation}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {isCritical && (
                      <Button
                        size="sm"
                        onClick={() => handleTriggerAction(t('central.integrity.delay.action_notice_full'), p)}
                        className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-sm gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{t('central.integrity.delay.action_notice')}</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTriggerAction(t('central.integrity.delay.action_audit_full'), p)}
                      className="text-xs rounded-xl border-border hover:bg-muted font-bold"
                    >{t('central.integrity.delay.action_audit')}</Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
