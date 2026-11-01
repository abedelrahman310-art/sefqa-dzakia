import json
import re

with open('scratch/all_ws_keys.json', 'r', encoding='utf-8') as f:
    ws_keys = json.load(f)

with open('scratch/add_workspace_extra_keys.py', 'r', encoding='utf-8') as f:
    pass

# We also know the 44 extra keys in scratch/add_workspace_extra_keys.py
with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar_all = json.load(f)

# Collect all authority.workspace.* keys
ws_all = {k: v for k, v in ar_all.items() if k.startswith('authority.workspace.')}
print(f"Total workspace keys: {len(ws_all)}")

with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's inspect what lines in AuthorityDealWorkspace.tsx have Arabic
arabic_pattern = re.compile(r'[\u0600-\u06FF]')
lines = content.splitlines()

# Sort keys by length of their value descending, so longer strings match first
sorted_keys = sorted(ws_all.items(), key=lambda x: len(x[1]), reverse=True)

# Also check common keys like common.dzd, etc.
extra_common = {
    'common.cancel': 'إلغاء',
    'common.search': 'بحث',
    'common.loading': 'جاري التحميل...',
    'common.save': 'حفظ',
}

print(f"Longest key: {sorted_keys[0][0]} -> {len(sorted_keys[0][1])} chars")
