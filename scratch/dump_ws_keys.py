import json

with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)

ws = {k: v for k, v in ar.items() if k.startswith('authority.workspace.')}
with open('scratch/all_ws_keys.json', 'w', encoding='utf-8') as f:
    json.dump(ws, f, ensure_ascii=False, indent=2)

print(f"Dumped {len(ws)} keys to all_ws_keys.json")
