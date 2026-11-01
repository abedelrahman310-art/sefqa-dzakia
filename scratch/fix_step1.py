with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

presets_start = content.find("// Regulatory Standard Presets")
if presets_start == -1:
    presets_start = content.find("const TEMPLATE_PRESETS: Record<")

func_start = content.find("export interface AuthorityDealWorkspaceProps {")

if presets_start != -1 and func_start != -1:
    content = content[:presets_start] + "// Presets loaded dynamically via getTemplatePresets(lang)\n\n" + content[func_start:]
    print("Replaced TEMPLATE_PRESETS definition.")
else:
    print(f"Error: presets_start={presets_start}, func_start={func_start}")

hook_target = "export function AuthorityDealWorkspace({ initialTab }: AuthorityDealWorkspaceProps) {"
hook_replacement = """export function AuthorityDealWorkspace({ initialTab }: AuthorityDealWorkspaceProps) {
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

content = content.replace(hook_target, hook_replacement)

with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied fix_step1.py successfully.")
