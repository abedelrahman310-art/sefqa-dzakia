# -*- coding: utf-8 -*-
import os

# 1. AIChatAssistant.tsx
def transform_ai_chat():
    path = 'client/src/features/ai/components/AIChatAssistant.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    # Imports
    c = c.replace(
        "import type { ChatMessage } from '../types';",
        "import type { ChatMessage } from '../types';\nimport { useI18n } from '@/i18n';"
    )

    # Function body
    c = c.replace(
        """const QUICK_SUGGESTIONS = [
  'كم عدد الصفقات المتأخرة حالياً؟',
  'ما هي أبرز المخاطر المرصودة في المنصة؟',
  'أعطني تقريراً عن ولاية وهران',
  'هل توجد شبهات تواطؤ بين متعاملين محددين؟',
];

export function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'مرحباً بك في المساعد الرقابي الذكي لمنصة صفقات ذكية. يمكنك سؤالي عن الصفقات، مؤشرات المخاطر، التنبيهات الإجرائية، أو التفسيرات المتعلقة بالمرسوم 15-247 والقانون 23-12.',
      is_advisory: true,
      sources: ['قواعد بيانات الصفقات الوطنية', 'القانون 23-12', 'المرسوم 15-247'],
    },
  ]);""",
        """export function AIChatAssistant() {
  const { t, dir } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: t('ai.chat_welcome_msg'),
      is_advisory: true,
      sources: [t('ai.source_deals_db'), t('ai.source_law_23_12'), t('ai.source_decree_15_247')],
    },
  ]);

  const quickSuggestions = [
    t('ai.prompt_late_deals'),
    t('ai.prompt_top_risks'),
    t('ai.prompt_oran_report'),
    t('ai.prompt_collusion_suspicions'),
  ];"""
    )

    # Error message
    c = c.replace(
        "content:\n              'تعذر إتمام التحليل والاستجابة في الوقت الحالي. يرجى إعادة المحاولة لاحقاً.',",
        "content: t('ai.chat_error_response'),"
    )

    # Reset message
    c = c.replace(
        "content:\n          'تم بدء محادثة جديدة. يمكنك طرح أي استفسار رقابي أو إحصائي حول صفقات المنصة.',",
        "content: t('ai.chat_new_conv_msg'),"
    )

    # TopBar button
    c = c.replace(
        '<span className="hidden md:inline">اسأل AI</span>',
        '<span className="hidden md:inline">{t(\'ai.chat_btn\')}</span>'
    )

    # SheetContent dir
    c = c.replace(
        'dir="rtl"',
        'dir={dir}'
    )

    # Header title & subtitle
    c = c.replace(
        """                  <SheetTitle className="text-sm font-extrabold text-navy-900">
                    المساعد الرقابي الذكي
                  </SheetTitle>
                  <span className="text-[11px] text-muted-foreground">
                    الإدارة المركزية — الرقابة الوطنية
                  </span>""",
        """                  <SheetTitle className="text-sm font-extrabold text-navy-900">
                    {t('ai.chat_supervisory_title')}
                  </SheetTitle>
                  <span className="text-[11px] text-muted-foreground">
                    {t('ai.chat_supervisory_subtitle')}
                  </span>"""
    )

    # Reset title
    c = c.replace(
        'title="محادثة جديدة"',
        'title={t(\'ai.chat_new_conv\')}'
    )

    # Disclaimer
    c = c.replace(
        "إجابات استشارية مؤتمتة — القرار النهائي للمفتش (قانون 23-12).",
        "{t('ai.chat_disclaimer')}"
    )

    # Sources label
    c = c.replace(
        "<span>المصادر المعتمدة:</span>",
        "<span>{t('ai.chat_sources_label')}</span>"
    )

    # Analyzing
    c = c.replace(
        "<span>جاري التحليل والمطابقة الإجرائية...</span>",
        "<span>{t('ai.chat_analyzing')}</span>"
    )

    # Suggestions map
    c = c.replace(
        "{QUICK_SUGGESTIONS.map((sug, idx) => (",
        "{quickSuggestions.map((sug, idx) => ("
    )

    # Placeholder
    c = c.replace(
        'placeholder="اسأل عن أي صفقة، مؤشر، أو إجراء..."',
        'placeholder={t(\'ai.chat_input_placeholder\')}'
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Transformed AIChatAssistant.tsx")

# 2. AIHealthBadge.tsx
def transform_ai_health():
    path = 'client/src/features/ai/components/AIHealthBadge.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    c = c.replace(
        "import { useAIHealth } from '../hooks/useAI';",
        "import { useAIHealth } from '../hooks/useAI';\nimport { useI18n } from '@/i18n';"
    )

    c = c.replace(
        "export function AIHealthBadge({ className = '', compact = false }: AIHealthBadgeProps) {",
        "export function AIHealthBadge({ className = '', compact = false }: AIHealthBadgeProps) {\n  const { t } = useI18n();"
    )

    c = c.replace(
        "<span>فحص الذكاء الاصطناعي...</span>",
        "<span>{t('ai.health_checking')}</span>"
    )

    c = c.replace(
        "title={`محرك AI: ${provider} (${isAvailable ? 'متصل' : 'غير متصل'})`}",
        "title={`${t('ai.health_engine')}: ${provider} (${isAvailable ? t('ai.health_ok') : t('ai.health_down')})`}"
    )

    c = c.replace(
        "{isAvailable ? 'متصل' : 'غير متصل'}",
        "{isAvailable ? t('ai.health_ok') : t('ai.health_down')}"
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Transformed AIHealthBadge.tsx")

# 3. AIPriceAssistant.tsx
def transform_ai_price():
    path = 'client/src/features/ai/components/AIPriceAssistant.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    c = c.replace(
        "{formatMoney(estimate.estimated_min)} — {formatMoney(estimate.estimated_max)} دج",
        "{formatMoney(estimate.estimated_min)} — {formatMoney(estimate.estimated_max)} {t('common.dzd')}"
    )

    c = c.replace(
        "{t('ai.price_unit')} {formatMoney(estimate.unit_price)} دج/{estimate.unit}",
        "{t('ai.price_unit')} {formatMoney(estimate.unit_price)} {t('common.dzd')}/{estimate.unit}"
    )

    c = c.replace(
        "{formatMoney(estimate.estimated_avg)} دج",
        "{formatMoney(estimate.estimated_avg)} {t('common.dzd')}"
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Transformed AIPriceAssistant.tsx")

# 4. SmartKpiBadge.tsx
def transform_smart_kpi():
    path = 'client/src/features/ai/components/SmartKpiBadge.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    c = c.replace(
        "import { Sparkles } from 'lucide-react';",
        "import { Sparkles } from 'lucide-react';\nimport { useI18n } from '@/i18n';"
    )

    c = c.replace(
        "export function SmartKpiBadge({",
        "export function SmartKpiBadge({"
    )

    c = c.replace(
        "  className = '',\n}: SmartKpiBadgeProps) {",
        "  className = '',\n}: SmartKpiBadgeProps) {\n  const { t } = useI18n();"
    )

    c = c.replace(
        "title={`رصد ذكي (استشاري): ${message || ''}`}",
        "title={`${t('ai.smart_detection_advisory')}: ${message || ''}`}"
    )

    c = c.replace(
        "<span>{message ? message : `${value ?? ''} رصد AI`}</span>",
        "<span>{message ? message : `${value ?? ''} ${t('ai.smart_detection_suffix')}`}</span>"
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Transformed SmartKpiBadge.tsx")

transform_ai_chat()
transform_ai_health()
transform_ai_price()
transform_smart_kpi()
