import json

with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)

obj_keys = {k: v for k, v in ar.items() if 'objection' in k}
print(f"Total keys matching 'objection': {len(obj_keys)}")
for k, v in list(obj_keys.items())[:25]:
    print(f"  {k}: {v}")
