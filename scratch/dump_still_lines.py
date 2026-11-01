import json
import re

with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar_all = json.load(f)

ws_keys = {k: v for k, v in ar_all.items() if k.startswith('authority.workspace.')}

with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

arabic_pattern = re.compile(r'[\u0600-\u06FF]')
exact_map = sorted([(v.strip(), k) for k, v in ws_keys.items() if v.strip()], key=lambda x: len(x[0]), reverse=True)
exact_map.append(('إلغاء', 'common.cancel'))
exact_map.append(('دج', 'common.dzd'))

still_lines = []
for line_idx, line in enumerate(lines):
    if not arabic_pattern.search(line):
        continue
    stripped = line.strip()
    if stripped.startswith('//') or (stripped.startswith('{/*') and stripped.endswith('*/}')):
        continue
    
    modified = line
    for val, key in exact_map:
        if val in modified:
            if f'>{val}<' in modified:
                modified = modified.replace(f'>{val}<', f'>{{{f"t('{key}')"}}}<')
            elif f"'{val}'" in modified:
                modified = modified.replace(f"'{val}'", f"t('{key}')")
            elif f'"{val}"' in modified:
                m_attr = re.search(r'([a-zA-Z\-]+)="' + re.escape(val) + r'"', modified)
                if m_attr:
                    attr_name = m_attr.group(1)
                    modified = modified.replace(f'{attr_name}="{val}"', f'{attr_name}={{{f"t('{key}')"}}}')
                else:
                    modified = modified.replace(f'"{val}"', f"t('{key}')")
            elif re.search(r'>\s*' + re.escape(val) + r'\s*<', modified):
                modified = re.sub(r'>\s*' + re.escape(val) + r'\s*<', f'>{{{f"t('{key}')"}}}<', modified)
    
    if arabic_pattern.search(modified):
        still_lines.append((line_idx + 1, modified.strip()))

with open('scratch/still_lines_full.json', 'w', encoding='utf-8') as f:
    json.dump(still_lines, f, ensure_ascii=False, indent=2)

print(f"Total still_lines: {len(still_lines)}")
