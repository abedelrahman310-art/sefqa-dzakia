import json
import re

with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar_all = json.load(f)

ws_keys = {k: v for k, v in ar_all.items() if k.startswith('authority.workspace.')}

with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace dir="rtl"
content = content.replace('dir="rtl"', 'dir={dir}')

# Clean comments
content = re.sub(r'\{/\*\s*TAB 1:[^*]+\*\}', '{/* TAB 1: Deal Basics */}', content)
content = re.sub(r'\{/\*\s*TAB 2:[^*]+\*\}', '{/* TAB 2: Cahier des charges & Sanad */}', content)
content = re.sub(r'\{/\*\s*TAB 3:[^*]+\*\}', '{/* TAB 3: Documents, Deeds & Sanad */}', content)
content = re.sub(r'\{/\*\s*Operator Dynamic Documents Dossier[^*]+\*\}', '{/* Operator Dynamic Documents Dossier */}', content)

# Exact map of strings to replace
exact_map = sorted([(v.strip(), k) for k, v in ws_keys.items() if v.strip()], key=lambda x: len(x[0]), reverse=True)
exact_map.append(('إلغاء', 'common.cancel'))
exact_map.append(('دج', 'common.dzd'))

# Perform clean pattern replacements
for val, key in exact_map:
    if len(val) < 2:
        continue
    # 1. >val<
    content = content.replace(f'>{val}<', f'>{{{f"t('{key}')"}}}<')
    # 2. > val < with spaces
    content = re.sub(r'>\s*' + re.escape(val) + r'\s*<', f'>{{{f"t('{key}')"}}}<', content)
    # 3. 'val' in JS/TS
    content = content.replace(f"'{val}'", f"t('{key}')")
    # 4. "val" in JS/TS
    content = content.replace(f'"{val}"', f"t('{key}')")
    # 5. JSX attributes: attr="val"
    for attr in ['placeholder', 'title', 'aria-label']:
        content = content.replace(f'{attr}="{val}"', f'{attr}={{{f"t('{key}')"}}}')

with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied bulk exact replacements.")
