import re
import json

with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { ExecutionTracker } from '@/features/execution/components/ExecutionTracker';",
    "import { ExecutionTracker } from '@/features/execution/components/ExecutionTracker';\nimport { useI18n } from '@/lib/i18n';\nimport { getTemplatePresets } from '@/lib/dealWorkspacePresets';"
)

# 2. Update formatContractDate and formatContractAmount signatures
old_formatters = """const formatContractDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ar-DZ', { dateStyle: 'medium' });
};

const formatContractAmount = (value: string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `${amount.toLocaleString('ar-DZ', { maximumFractionDigits: 2 })} دج`;
};"""

new_formatters = """const formatContractDate = (value: string | null | undefined, lang: string = 'ar'): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ', { dateStyle: 'medium' });
};

const formatContractAmount = (value: string | null | undefined, lang: string = 'ar', dzdLabel: string = 'دج'): string => {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `${amount.toLocaleString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ', { maximumFractionDigits: 2 })} ${dzdLabel}`;
};"""

content = content.replace(old_formatters, new_formatters)

# 3. Remove static CONTRACT_STATUS_LABELS and replace with comment
old_csl = """const CONTRACT_STATUS_LABELS: Record<string, string> = {
  CONTRACT_SIGNED: 'موقع ومبرم',
  signed: 'موقع',
  active: 'قيد التنفيذ',
  completed: 'منجز ومستلم',
  terminated: 'مفسوخ تعاقدياً',
};"""
new_csl = """// Contract status labels mapped dynamically via getContractStatusLabel"""
content = content.replace(old_csl, new_csl)

# 4. Remove SECTION_TITLES static record
old_st = """const SECTION_TITLES: Record<string, string> = {
  general_provisions: 'الأحكام العامة وموضوع الصفقة',
  administrative: 'الملف الإداري وشروط المشاركة',
  technical_specs: 'المواصفات التقنية وجدول الأسعار',
  financial_terms: 'الشروط المالية والضمانات',
  evaluation_criteria: 'معايير التقييم ومنهجية الاختيار',
};"""
new_st = """// Section titles mapped dynamically via getSectionTitle"""
content = content.replace(old_st, new_st)

# 5. Remove the local TEMPLATE_PRESETS definition (lines 191 to 267)
# Let's find TEMPLATE_PRESETS
presets_start = content.find("const TEMPLATE_PRESETS: Record<")
presets_end = content.find("export function AuthorityDealWorkspace() {")
if presets_start != -1 and presets_end != -1:
    content = content[:presets_start] + "// Presets loaded dynamically via getTemplatePresets(lang)\n\n" + content[presets_end:]

# 6. Inside AuthorityDealWorkspace(): add useI18n and helpers
hook_insert_point = "export function AuthorityDealWorkspace() {"
new_hook_block = """export function AuthorityDealWorkspace() {
  const { t, lang, dir } = useI18n();
  const templatePresets = getTemplatePresets(lang);

  const getContractStatusLabel = (status: string): string => {
    switch (status) {
      case 'CONTRACT_SIGNED': return t('authority.workspace.contract_signed_concluded');
      case 'signed': return t('authority.workspace.contract_signed');
      case 'active': return t('authority.workspace.contract_active');
      case 'completed': return t('authority.workspace.contract_completed');
      case 'terminated': return t('authority.workspace.contract_terminated');
      default: return status;
    }
  };

  const getSectionTitle = (sectionKey: string): string => {
    switch (sectionKey) {
      case 'general_provisions': return t('authority.workspace.sec_general_provisions');
      case 'administrative': return t('authority.workspace.sec_administrative');
      case 'technical_specs': return t('authority.workspace.sec_technical_specs');
      case 'financial_terms': return t('authority.workspace.sec_financial_terms');
      case 'evaluation_criteria': return t('authority.workspace.sec_evaluation_criteria');
      default: return sectionKey;
    }
  };"""

content = content.replace(hook_insert_point, new_hook_block)

print("Initial structural replacements applied.")
with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
