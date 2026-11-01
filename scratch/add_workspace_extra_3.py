import json

with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)
with open('client/src/locales/fr.json', 'r', encoding='utf-8') as f:
    fr = json.load(f)

new_keys_ar = {
    'authority.workspace.default_deal_title': 'مشروع الصفقة',
    'authority.workspace.default_section': 'القسم',
}

new_keys_fr = {
    'authority.workspace.default_deal_title': 'Projet de marché',
    'authority.workspace.default_section': 'Section',
}

for k, v in new_keys_ar.items():
    ar[k] = v
for k, v in new_keys_fr.items():
    fr[k] = v

with open('client/src/locales/ar.json', 'w', encoding='utf-8') as f:
    json.dump(ar, f, ensure_ascii=False, indent=2)
with open('client/src/locales/fr.json', 'w', encoding='utf-8') as f:
    json.dump(fr, f, ensure_ascii=False, indent=2)

print("Saved default keys into locales.")
