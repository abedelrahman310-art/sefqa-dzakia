import json
from prepare_ai_keys import ai_new_keys

with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)
with open('client/src/locales/fr.json', 'r', encoding='utf-8') as f:
    fr = json.load(f)

added = 0
updated = 0
for k, (ar_val, fr_val) in ai_new_keys.items():
    if k not in ar:
        added += 1
    else:
        updated += 1
    ar[k] = ar_val
    fr[k] = fr_val

with open('client/src/locales/ar.json', 'w', encoding='utf-8') as f:
    json.dump(ar, f, ensure_ascii=False, indent=2)
with open('client/src/locales/fr.json', 'w', encoding='utf-8') as f:
    json.dump(fr, f, ensure_ascii=False, indent=2)

print(f"Added {added} keys, updated {updated} keys.")
assert set(ar.keys()) == set(fr.keys()), "Key set mismatch between ar and fr!"
print(f"Total keys now: {len(ar)} in both ar.json and fr.json (100% parity verified).")
