import json

with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)

for k, v in ar.items():
    if any(k.startswith(prefix) for prefix in ['procurement.', 'common.nature', 'common.method', 'authority.deals.nature', 'authority.deals.method']):
        print(f"{k}: {v}")
