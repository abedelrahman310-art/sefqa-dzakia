import json

with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)

with open('client/src/locales/fr.json', 'r', encoding='utf-8') as f:
    fr = json.load(f)

ar_keys = set(ar.keys())
fr_keys = set(fr.keys())

diff_ar = ar_keys - fr_keys
diff_fr = fr_keys - ar_keys

print(f"AR keys count: {len(ar_keys)}")
print(f"FR keys count: {len(fr_keys)}")
print(f"Keys in AR but not FR: {len(diff_ar)}")
print(f"Keys in FR but not AR: {len(diff_fr)}")
