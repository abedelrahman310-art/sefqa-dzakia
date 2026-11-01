# -*- coding: utf-8 -*-

# 1. AIInsightsPanel.tsx
def transform_ai_insights_panel():
    path = 'client/src/features/ai/components/AIInsightsPanel.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    c = c.replace(
        "import type { SeverityLevel } from '../types';",
        "import type { SeverityLevel } from '../types';\nimport { useI18n } from '@/i18n';"
    )

    c = c.replace(
        "export function AIInsightsPanel({ className = '' }: AIInsightsPanelProps) {",
        "export function AIInsightsPanel({ className = '' }: AIInsightsPanelProps) {\n  const { t } = useI18n();"
    )

    c = c.replace(
        "التوصيات الذكية للرقابة الوطنية (AI Insights)",
        "{t('ai.insights_panel_title')}"
    )

    c = c.replace(
        "توصيات استشارية فقط — القرار النهائي للمفتش البشري وفقاً للقانون 23-12.",
        "{t('ai.insights_advisory_note')}"
    )

    c = c.replace(
        'title="تحديث البيانات"',
        'title={t(\'ai.refresh_title\')}'
    )

    c = c.replace(
        "<span>تحديث</span>",
        "<span>{t('ai.refresh')}</span>"
    )

    c = c.replace(
        "? 'جاري التحليل والتوليد...'\n                : 'توليد توصيات جديدة'}",
        "? t('ai.generating')\n                : t('ai.generate_new')}"
    )

    c = c.replace(
        "<span>الكل</span>",
        "<span>{t('common.all')}</span>"
    )

    c = c.replace(
        "<span>حرجة</span>",
        "<span>{t('ai.severity.critical')}</span>"
    )

    c = c.replace(
        "<span>عالية</span>",
        "<span>{t('ai.severity.high')}</span>"
    )

    c = c.replace(
        "<span>متوسطة</span>",
        "<span>{t('ai.severity.medium')}</span>"
    )

    c = c.replace(
        "<span>منخفضة</span>",
        "<span>{t('ai.severity.low')}</span>"
    )

    c = c.replace(
        "لا توجد توصيات نشطة في هذا المستوى",
        "{t('ai.insights_empty_title')}"
    )

    c = c.replace(
        "مؤشرات المنصة تظهر التزاماً إجرائياً، أو تمت معالجة كافة التوصيات السابقة.",
        "{t('ai.insights_empty_desc')}"
    )

    c = c.replace(
        "<span>تشغيل فحص جديد</span>",
        "<span>{t('ai.run_new_scan')}</span>"
    )

    c = c.replace(
        "<span>توصيات ذات خطورة حرجة ({groupedInsights.critical.length})</span>",
        "<span>{t('ai.critical_recommendations', { count: groupedInsights.critical.length })}</span>"
    )

    c = c.replace(
        "<span>توصيات ذات أولوية عالية ({groupedInsights.high.length})</span>",
        "<span>{t('ai.high_recommendations', { count: groupedInsights.high.length })}</span>"
    )

    c = c.replace(
        "<span>توصيات متوسطة ({groupedInsights.medium.length})</span>",
        "<span>{t('ai.medium_recommendations', { count: groupedInsights.medium.length })}</span>"
    )

    c = c.replace(
        "<span>{collapseMedium ? 'عرض' : 'طي'}</span>",
        "<span>{collapseMedium ? t('common.show') : t('common.collapse')}</span>"
    )

    c = c.replace(
        """                      <span>
                        توصيات منخفضة وإرشادية (
                        {groupedInsights.low.length + groupedInsights.info.length})
                      </span>""",
        """                      <span>
                        {t('ai.low_recommendations', { count: groupedInsights.low.length + groupedInsights.info.length })}
                      </span>"""
    )

    c = c.replace(
        "<span>{collapseLow ? 'عرض' : 'طي'}</span>",
        "<span>{collapseLow ? t('common.show') : t('common.collapse')}</span>"
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Transformed AIInsightsPanel.tsx")

# 2. InsightCard.tsx
def transform_insight_card():
    path = 'client/src/features/ai/components/InsightCard.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    c = c.replace(
        "import { Textarea } from '@/components/ui/textarea';",
        "import { Textarea } from '@/components/ui/textarea';\nimport { useI18n } from '@/i18n';"
    )

    # Replace CATEGORY_CONFIG and SEVERITY_CONFIG and formatRelativeTime with functions
    old_configs = """const CATEGORY_CONFIG: Record<
  InsightCategory,
  { label: string; icon: React.ElementType; color: string }
> = {
  fraud_suspicion: {
    label: 'شبهة فساد وتواطؤ',
    icon: ShieldAlert,
    color: 'text-rose-600',
  },
  price_anomaly: {
    label: 'شذوذ في الأسعار',
    icon: TrendingUp,
    color: 'text-orange-600',
  },
  delay: {
    label: 'تأخير إجرائي',
    icon: Clock,
    color: 'text-amber-600',
  },
  compliance: {
    label: 'عدم امتثال نظامي',
    icon: CheckCircle,
    color: 'text-purple-600',
  },
  pattern: {
    label: 'نمط تكرار مشبوه',
    icon: Activity,
    color: 'text-indigo-600',
  },
  recommendation: {
    label: 'توصية تدقيق استباقية',
    icon: Lightbulb,
    color: 'text-emerald-600',
  },
};

const SEVERITY_CONFIG: Record<
  SeverityLevel,
  { label: string; badgeClass: string; cardClass: string }
> = {
  critical: {
    label: 'حرجة',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    cardClass: 'bg-rose-50/40 border-rose-300 hover:border-rose-400',
  },
  high: {
    label: 'عالية',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300 font-bold',
    cardClass: 'bg-orange-50/40 border-orange-300 hover:border-orange-400',
  },
  medium: {
    label: 'متوسطة',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
    cardClass: 'bg-amber-50/40 border-amber-300 hover:border-amber-400',
  },
  low: {
    label: 'منخفضة',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 font-semibold',
    cardClass: 'bg-blue-50/40 border-blue-300 hover:border-blue-400',
  },
  info: {
    label: 'إرشادية',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-medium',
    cardClass: 'bg-slate-50/40 border-slate-300 hover:border-slate-400',
  },
};

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffHours < 1) return 'منذ دقائق معدودة';
    if (diffHours === 1) return 'منذ ساعة واحدة';
    if (diffHours === 2) return 'منذ ساعتين';
    if (diffHours <= 10) return `منذ ${diffHours} ساعات`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'منذ يوم واحد';
    return `منذ ${diffDays} أيام`;
  } catch {
    return dateString;
  }
}"""

    new_configs = """const CATEGORY_ICONS: Record<InsightCategory, { icon: React.ElementType; color: string }> = {
  fraud_suspicion: { icon: ShieldAlert, color: 'text-rose-600' },
  price_anomaly: { icon: TrendingUp, color: 'text-orange-600' },
  delay: { icon: Clock, color: 'text-amber-600' },
  compliance: { icon: CheckCircle, color: 'text-purple-600' },
  pattern: { icon: Activity, color: 'text-indigo-600' },
  recommendation: { icon: Lightbulb, color: 'text-emerald-600' },
};

const SEVERITY_STYLES: Record<SeverityLevel, { badgeClass: string; cardClass: string }> = {
  critical: {
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    cardClass: 'bg-rose-50/40 border-rose-300 hover:border-rose-400',
  },
  high: {
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300 font-bold',
    cardClass: 'bg-orange-50/40 border-orange-300 hover:border-orange-400',
  },
  medium: {
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
    cardClass: 'bg-amber-50/40 border-amber-300 hover:border-amber-400',
  },
  low: {
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 font-semibold',
    cardClass: 'bg-blue-50/40 border-blue-300 hover:border-blue-400',
  },
  info: {
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-medium',
    cardClass: 'bg-slate-50/40 border-slate-300 hover:border-slate-400',
  },
};

const getCategoryLabel = (cat: InsightCategory, t: (k: string, v?: any) => string): string => {
  switch (cat) {
    case 'fraud_suspicion': return t('ai.cat_fraud_collusion');
    case 'price_anomaly': return t('ai.cat_price_anomaly');
    case 'delay': return t('ai.cat_procedural_delay');
    case 'compliance': return t('ai.cat_non_compliance');
    case 'pattern': return t('ai.cat_suspicious_pattern');
    case 'recommendation': return t('ai.cat_proactive_audit');
    default: return t('ai.cat_proactive_audit');
  }
};

const getSeverityLabel = (sev: SeverityLevel, t: (k: string, v?: any) => string): string => {
  switch (sev) {
    case 'critical': return t('ai.severity.critical');
    case 'high': return t('ai.severity.high');
    case 'medium': return t('ai.severity.medium');
    case 'low': return t('ai.severity.low');
    case 'info': return t('ai.severity.info');
    default: return t('ai.severity.info');
  }
};

function formatRelativeTime(dateString: string, t: (k: string, v?: any) => string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffHours < 1) return t('ai.time_few_minutes');
    if (diffHours === 1) return t('ai.time_one_hour');
    if (diffHours === 2) return t('ai.time_two_hours');
    if (diffHours <= 10) return t('ai.time_hours', { count: diffHours });
    if (diffHours < 24) return t('ai.time_hours', { count: diffHours });
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return t('ai.time_one_day');
    return t('ai.time_days', { count: diffDays });
  } catch {
    return dateString;
  }
}"""

    assert old_configs in c, "old_configs not found in InsightCard.tsx"
    c = c.replace(old_configs, new_configs)

    # Component setup
    c = c.replace(
        "export function InsightCard({\n  insight,\n  onResolve,\n  isResolving = false,\n}: InsightCardProps) {\n  const [isExpanded, setIsExpanded] = useState(false);",
        "export function InsightCard({\n  insight,\n  onResolve,\n  isResolving = false,\n}: InsightCardProps) {\n  const { t, dir } = useI18n();\n  const [isExpanded, setIsExpanded] = useState(false);"
    )

    c = c.replace(
        "const catMeta = CATEGORY_CONFIG[insight.category] || CATEGORY_CONFIG.recommendation;\n  const sevMeta = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.info;\n  const CategoryIcon = catMeta.icon;",
        "const catMeta = CATEGORY_ICONS[insight.category] || CATEGORY_ICONS.recommendation;\n  const sevMeta = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.info;\n  const CategoryIcon = catMeta.icon;\n  const categoryLabel = getCategoryLabel(insight.category, t);\n  const severityLabel = getSeverityLabel(insight.severity, t);"
    )

    c = c.replace(
        "setErrorMsg('يجب كتابة مبرر أو ملاحظات معالجة لا تقل عن 10 أحرف (إلزامي للتدقيق القانوني).');",
        "setErrorMsg(t('ai.err_notes_min_length'));"
    )

    c = c.replace(
        "{sevMeta.label}",
        "{severityLabel}"
    )

    c = c.replace(
        "<span>{catMeta.label}</span>",
        "<span>{categoryLabel}</span>"
    )

    c = c.replace(
        'title="مبدأ القانون 23-12: الذكاء الاصطناعي أداة مساعدة ورقابية استشارية ولا يتخذ قرارات تلقائية"',
        'title={t(\'ai.advisory_legal_principle\')}'
    )

    c = c.replace(
        "<span>استشاري فقط</span>",
        "<span>{t('ai.advisory_badge')}</span>"
    )

    c = c.replace(
        "formatRelativeTime(insight.generated_at)",
        "formatRelativeTime(insight.generated_at, t)"
    )

    c = c.replace(
        'title="مستوى الثقة الإحصائي للمؤشر"',
        'title={t(\'ai.confidence_metric_title\')}'
    )

    c = c.replace(
        "<span>الثقة:</span>",
        "<span>{t('ai.price_confidence')}</span>"
    )

    c = c.replace(
        "🎯 الإجراء المقترح للمفتش:",
        "{t('ai.proposed_action_title')}"
    )

    c = c.replace(
        "صفقة: {tRef}",
        "{t('ai.deal_ref')}: {tRef}"
    )

    c = c.replace(
        "مصلحة: {auth}",
        "{t('ai.authority_ref')}: {auth}"
    )

    c = c.replace(
        "متعامل: {op}",
        "{t('ai.operator_ref')}: {op}"
    )

    c = c.replace(
        "<span>إخفاء التفاصيل</span>",
        "<span>{t('common.hide_details')}</span>"
    )

    c = c.replace(
        "<span>عرض التفاصيل والتوصيات</span>",
        "<span>{t('ai.show_details_recommendations')}</span>"
    )

    c = c.replace(
        "<span>معاينة الصفقة</span>",
        "<span>{t('ai.preview_deal')}</span>"
    )

    c = c.replace(
        "<span>تحديد كمعالج</span>",
        "<span>{t('ai.resolve')}</span>"
    )

    c = c.replace(
        '<DialogContent className="sm:max-w-md" dir="rtl">',
        '<DialogContent className="sm:max-w-md" dir={dir}>'
    )

    c = c.replace(
        "<span>معالجة التوصية الرقابية وإغلاقها</span>",
        "<span>{t('ai.resolve_modal_title')}</span>"
    )

    c = c.replace(
        "التوصية: <span className=\"font-bold text-navy-900\">{insight.title}</span>",
        "{t('ai.recommendation_label')}: <span className=\"font-bold text-navy-900\">{insight.title}</span>"
    )

    c = c.replace(
        "<span>توثيق قانوني إلزامي (Audit Trail):</span>",
        "<span>{t('ai.audit_trail_mandatory')}</span>"
    )

    c = c.replace(
        """              <p className="text-amber-800 text-[11px] leading-relaxed">
                سيُسجَّل هذا الإجراء مع هويتك وتاريخه في سجل التدقيق الرقمي غير القابل للتعديل
                تطبيقاً للمرسوم 15-247 والقانون 23-12.
              </p>""",
        """              <p className="text-amber-800 text-[11px] leading-relaxed">
                {t('ai.audit_trail_notice')}
              </p>"""
    )

    c = c.replace(
        "ملاحظات ومبررات المعالجة البشرية",
        "{t('ai.human_notes_label')}"
    )

    c = c.replace(
        'placeholder="اكتب الإجراء المتخذ (مثال: تم تدقيق الأسعار ومقارنتها مع الصفقات المماثلة وتبين مطابقتها للأسعار المرجعية...)"',
        'placeholder={t(\'ai.notes_placeholder\')}'
    )

    c = c.replace(
        "{notes.length} / 10 أحرف كحد أدنى",
        "{notes.length} / {t('ai.min_chars_suffix')}"
    )

    c = c.replace(
        ">إلغاء<",
        ">{t('common.cancel')}<"
    )

    c = c.replace(
        "{isResolving ? 'جاري الحفظ...' : 'تأكيد المعالجة وإغلاق التوصية'}",
        "{isResolving ? t('common.saving') : t('ai.confirm_resolution')}"
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Transformed InsightCard.tsx")

# 3. OperatorRecommendationsCard.tsx
def transform_operator_rec():
    path = 'client/src/features/ai/components/OperatorRecommendationsCard.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    c = c.replace(
        "<span>إعادة المحاولة</span>",
        "<span>{t('common.retry')}</span>"
    )

    c = c.replace(
        "تحديث ملف المؤسسة",
        "{t('ai.update_company_profile')}"
    )

    c = c.replace(
        'title="تحديث التوصيات"',
        'title={t(\'ai.refresh_recommendations\')}'
    )

    c = c.replace(
        '<span className="font-bold text-navy-900">الأشغال العمومية والبناء</span>',
        '<span className="font-bold text-navy-900">{t(\'operator.sector.btph\')}</span>'
    )

    c = c.replace(
        '<span className="font-bold text-navy-900">الجزائر، البليدة، بومرداس</span>',
        '<span className="font-bold text-navy-900">{t(\'ai.rec_demo_wilayas\')}</span>'
    )

    c = c.replace(
        "<span>يتم تحديث التوصيات دورياً بناءً على الصفقات المفتوحة حديثاً في القطاع</span>",
        "<span>{t('ai.recommendations_periodic_update')}</span>"
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Transformed OperatorRecommendationsCard.tsx")

# 4. SuspicionAlerts.tsx
def transform_suspicion_alerts():
    path = 'client/src/features/ai/components/SuspicionAlerts.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    c = c.replace(
        "import type { SuspicionItem } from '../types';",
        "import type { SuspicionItem } from '../types';\nimport { useI18n } from '@/i18n';"
    )

    old_type_config = """const TYPE_CONFIG: Record<
  string,
  { label: string; icon: ElementType; colorClass: string; badgeClass: string }
> = {
  bid_rigging: {
    label: 'مؤشرات التواطؤ (Bid Rigging)',
    icon: Target,
    colorClass: 'text-rose-600',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  price_manipulation: {
    label: 'التلاعب والأسعار غير الطبيعية',
    icon: BadgePercent,
    colorClass: 'text-orange-600',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  phantom_competition: {
    label: 'المنافسة الصورية والوهمية',
    icon: Ghost,
    colorClass: 'text-purple-600',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  conflict_of_interest: {
    label: 'تنازع المصالح والصلات المتقاطعة',
    icon: Scale,
    colorClass: 'text-indigo-600',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
};"""

    new_type_config = """const TYPE_CONFIG: Record<
  string,
  { icon: ElementType; colorClass: string; badgeClass: string }
> = {
  bid_rigging: {
    icon: Target,
    colorClass: 'text-rose-600',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  price_manipulation: {
    icon: BadgePercent,
    colorClass: 'text-orange-600',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  phantom_competition: {
    icon: Ghost,
    colorClass: 'text-purple-600',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  conflict_of_interest: {
    icon: Scale,
    colorClass: 'text-indigo-600',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
};

const getTypeLabel = (type: string, t: (k: string, v?: any) => string): string => {
  switch (type) {
    case 'bid_rigging': return t('ai.suspicion_bid_rigging');
    case 'price_manipulation': return t('ai.suspicion_price_manipulation');
    case 'phantom_competition': return t('ai.suspicion_fictitious_bids');
    case 'conflict_of_interest': return t('ai.suspicion_conflict_interest');
    default: return t('ai.observed_suspicions');
  }
};"""

    assert old_type_config in c, "old_type_config not found in SuspicionAlerts.tsx"
    c = c.replace(old_type_config, new_type_config)

    c = c.replace(
        "export function SuspicionAlerts({ className = '' }: SuspicionAlertsProps) {",
        "export function SuspicionAlerts({ className = '' }: SuspicionAlertsProps) {\n  const { t, dir } = useI18n();"
    )

    c = c.replace(
        "الشبهات المكتشفة بالخوارزميات",
        "{t('ai.suspicions_detected_title')}"
    )

    c = c.replace(
        "كشف الأنماط المشبوهة استناداً لبيانات العروض وتطابق الهويات.",
        "{t('ai.suspicions_detected_desc')}"
    )

    c = c.replace(
        "{totalCount} مؤشر نشط",
        "{totalCount} {t('ai.active_indicators')}"
    )

    c = c.replace(
        "مؤشرات احترازية استشارية تستوجب تحقيقاً تدقيقياً بشرياً وفقاً للقانون 23-12.",
        "{t('ai.suspicions_disclaimer')}"
    )

    c = c.replace(
        "لا توجد مؤشرات شبهة مرصودة حالياً",
        "{t('ai.no_suspicions_title')}"
    )

    c = c.replace(
        "الفحص الدوري التلقائي لم يرصد تواطؤاً أو أسعاراً مشبوهة حتى الآن.",
        "{t('ai.no_suspicions_desc')}"
    )

    c = c.replace(
        "const config = TYPE_CONFIG[typeKey] || {\n            label: typeKey,\n            icon: AlertTriangle,\n            colorClass: 'text-amber-600',\n            badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',\n          };",
        "const config = TYPE_CONFIG[typeKey] || {\n            icon: AlertTriangle,\n            colorClass: 'text-amber-600',\n            badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',\n          };\n          const label = getTypeLabel(typeKey, t);"
    )

    c = c.replace(
        "<h3 className=\"font-bold text-navy-900 text-xs\">\n                    {config.label}\n                  </h3>",
        "<h3 className=\"font-bold text-navy-900 text-xs\">\n                    {label}\n                  </h3>"
    )

    c = c.replace(
        "{items.length} {items.length === 1 ? 'حالة' : 'حالات'}",
        "{items.length} {items.length === 1 ? t('ai.single_case') : t('ai.multiple_cases')}"
    )

    c = c.replace(
        "<span>عرض التفاصيل ({items.length})</span>",
        "<span>{t('ai.view_details_count', { count: items.length })}</span>"
    )

    c = c.replace(
        '<DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto" dir="rtl">',
        '<DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto" dir={dir}>'
    )

    c = c.replace(
        "{selectedTypeForDialog ? TYPE_CONFIG[selectedTypeForDialog]?.label : 'الشبهات المرصودة'}",
        "{selectedTypeForDialog ? getTypeLabel(selectedTypeForDialog, t) : t('ai.observed_suspicions')}"
    )

    c = c.replace(
        "{data?.statutory_reference || 'القانون 23-12 — مبدأ الشفافية والمنافسة الحرة'}",
        "{data?.statutory_reference || t('ai.statutory_reference_default')}"
    )

    c = c.replace(
        "خطورة: {item.severity}",
        "{t('ai.severity_label')}: {item.severity}"
    )

    c = c.replace(
        "<span className=\"font-bold\">التوصية:</span> {item.recommendation}",
        "<span className=\"font-bold\">{t('ai.recommendation_prefix')}:</span> {item.recommendation}"
    )

    c = c.replace(
        "المخالفة المحتملة: {item.statutory_violation}",
        "{t('ai.potential_violation')}: {item.statutory_violation}"
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Transformed SuspicionAlerts.tsx")

# 5. useAI.ts
def transform_use_ai():
    path = 'client/src/features/ai/hooks/useAI.ts'
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    c = c.replace(
        "import { toast } from 'sonner';",
        "import { toast } from 'sonner';\nimport { useI18n } from '@/i18n';"
    )

    c = c.replace(
        "refetchInterval: 60000, // كل دقيقة",
        "refetchInterval: 60000, // 1 min"
    )

    c = c.replace(
        "export const useGenerateInsights = () => {\n  const qc = useQueryClient();",
        "export const useGenerateInsights = () => {\n  const { t } = useI18n();\n  const qc = useQueryClient();"
    )

    c = c.replace(
        "toast.success(`تم توليد ${data.generated} توصية ذكية جديدة بنجاح`);",
        "toast.success(t('ai.toast_generated_success', { count: data.generated }));"
    )

    c = c.replace(
        "err.response?.data?.detail || 'تعذر توليد التوصيات في الوقت الحالي'",
        "err.response?.data?.detail || t('ai.toast_generated_error')"
    )

    c = c.replace(
        "export const useResolveInsight = () => {\n  const qc = useQueryClient();",
        "export const useResolveInsight = () => {\n  const { t } = useI18n();\n  const qc = useQueryClient();"
    )

    c = c.replace(
        "toast.success('تم توثيق المعالجة وتحديث سجل التدقيق بنجاح');",
        "toast.success(t('ai.toast_resolve_success'));"
    )

    c = c.replace(
        "'تعذر حفظ معالجة التوصية'",
        "t('ai.toast_resolve_error')"
    )

    c = c.replace(
        "refetchInterval: 120000, // كل دقيقتين",
        "refetchInterval: 120000, // 2 mins"
    )

    c = c.replace(
        "staleTime: 300000, // 5 دقائق",
        "staleTime: 300000, // 5 mins"
    )

    # Clean remaining Arabic in comments
    c = c.replace(
        "* Hook لتقدير الميزانية المرجعية تلقائياً مع Debounce وزر تحديث فوري",
        "* Hook for reference budget estimation with debounce and instant refresh"
    )
    c = c.replace(
        "// Manual immediate refetch (التحسين 4)",
        "// Manual immediate refetch"
    )
    c = c.replace(
        "* Hook لجلب التوصيات الذكية لفرص الصفقات للمتعامل الاقتصادي",
        "* Hook for fetching smart tender recommendations for economic operator"
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Transformed useAI.ts")

transform_ai_insights_panel()
transform_insight_card()
transform_operator_rec()
transform_suspicion_alerts()
transform_use_ai()
