with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace TEMPLATE_PRESETS
content = content.replace("TEMPLATE_PRESETS[tType]", "templatePresets[tType]")
content = content.replace("TEMPLATE_PRESETS[templateType]", "templatePresets[templateType]")

# Replace SECTION_TITLES lookups:
# SECTION_TITLES[sec] -> getSectionTitle(sec)
# SECTION_TITLES[activeSection] -> getSectionTitle(activeSection)
# SECTION_TITLES[sectionKey] -> getSectionTitle(sectionKey)
# SECTION_TITLES[sKey] -> getSectionTitle(sKey)
# SECTION_TITLES[clause.sectionKey] -> getSectionTitle(clause.sectionKey)
# SECTION_TITLES[selectedClause.sectionKey] -> getSectionTitle(selectedClause.sectionKey)
import re
content = re.sub(r'SECTION_TITLES\[([^\]]+)\]', r'getSectionTitle(\1)', content)

# Replace CONTRACT_STATUS_LABELS[dealContract.status] -> getContractStatusLabel(dealContract.status)
# CONTRACT_STATUS_LABELS[...] -> getContractStatusLabel(...)
content = re.sub(r'CONTRACT_STATUS_LABELS\[([^\]]+)\]', r'getContractStatusLabel(\1)', content)

# Replace formatContractDate and formatContractAmount calls to pass lang
content = content.replace("formatContractDate(dealContract.created_at)", "formatContractDate(dealContract.created_at, lang)")
content = content.replace("formatContractDate(dealContract.signed_at)", "formatContractDate(dealContract.signed_at, lang)")
content = content.replace("formatContractAmount(dealContract.amount)", "formatContractAmount(dealContract.amount, lang, t('common.dzd'))")

with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Step 2 applied successfully.")
