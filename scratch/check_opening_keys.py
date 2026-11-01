import json

with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)

opening_keys = {k: v for k, v in ar.items() if k.startswith('opening.')}
print(f"Total keys starting with opening.: {len(opening_keys)}")
for k, v in opening_keys.items():
    print(f"  {k}: {v}")
