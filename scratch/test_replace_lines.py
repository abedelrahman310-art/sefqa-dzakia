import json
import re

with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar_all = json.load(f)

ws_keys = {k: v for k, v in ar_all.items() if k.startswith('authority.workspace.')}

with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

arabic_pattern = re.compile(r'[\u0600-\u06FF]')

# Build a mapping from exact Arabic string to key
# We sort by length descending
exact_map = sorted([(v.strip(), k) for k, v in ws_keys.items() if v.strip()], key=lambda x: len(x[0]), reverse=True)

# Add some other common exact mappings if needed
exact_map.append(('إلغاء', 'common.cancel'))
exact_map.append(('دج', 'common.dzd'))

new_lines = []
replaced_count = 0

for line_idx, line in enumerate(lines):
    if not arabic_pattern.search(line):
        new_lines.append(line)
        continue
    
    orig = line
    # 1. Check for single-line comments with Arabic
    stripped = line.strip()
    if stripped.startswith('//') or (stripped.startswith('{/*') and stripped.endswith('*/}')):
        # convert comment to english or remove arabic
        # e.g. {/* Operator Dynamic Documents Dossier (ملف وثائق المتعامل الاقتصادي) */} -> {/* Operator Dynamic Documents Dossier */}
        clean_comment = re.sub(r'[\u0600-\u06FF\s\(\)\:\-\«\»]+', ' ', line)
        new_lines.append(clean_comment)
        replaced_count += 1
        continue
    
    modified = line
    for val, key in exact_map:
        if val in modified:
            # Check context:
            # Case A: JSX text: >val<
            if f'>{val}<' in modified:
                modified = modified.replace(f'>{val}<', f'>{{{f"t('{key}')"}}}<')
            # Case B: Inside single quotes: 'val'
            elif f"'{val}'" in modified:
                # If inside JSX attribute: attr='val' or attr={'val'}
                modified = modified.replace(f"'{val}'", f"t('{key}')")
            # Case C: Inside double quotes: "val"
            elif f'"{val}"' in modified:
                # If attribute: attr="val"
                # Check if it's an attribute like title="val" or placeholder="val"
                m_attr = re.search(r'([a-zA-Z\-]+)="' + re.escape(val) + r'"', modified)
                if m_attr:
                    attr_name = m_attr.group(1)
                    modified = modified.replace(f'{attr_name}="{val}"', f'{attr_name}={{{f"t('{key}')"}}}')
                else:
                    modified = modified.replace(f'"{val}"', f"t('{key}')")
            # Case D: In JSX between tags with whitespace: >  val  <
            elif re.search(r'>\s*' + re.escape(val) + r'\s*<', modified):
                modified = re.sub(r'>\s*' + re.escape(val) + r'\s*<', f'>{{{f"t('{key}')"}}}<', modified)
    
    if modified != orig:
        replaced_count += 1
    new_lines.append(modified)

print(f"Lines modified in pass 1: {replaced_count}")
still_arabic = [i+1 for i, l in enumerate(new_lines) if arabic_pattern.search(l)]
print(f"Lines still having Arabic: {len(still_arabic)}")
