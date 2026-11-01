import json
import re

with open('scratch/all_ws_keys.json', 'r', encoding='utf-8') as f:
    ws_keys = json.load(f)

with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    all_ar = json.load(f)

with open('scratch/work_lines.json', 'r', encoding='utf-8') as f:
    work_lines = json.load(f)

print(f"Total lines in work_lines: {len(work_lines)}")

# Let's see: for each line in work_lines, what keys in all_ar match its Arabic phrases?
matched_lines = {}
for item in work_lines:
    line_num = item['line']
    code = item['code']
    
    # find all arabic substrings
    arabic_matches = re.findall(r'[\u0600-\u06FF0-9\s،؛ـ\.\-\:\(\)\/\«\»]+', code)
    arabic_matches = [m.strip() for m in arabic_matches if len(re.findall(r'[\u0600-\u06FF]', m)) >= 2]
    
    line_key_candidates = []
    for substr in arabic_matches:
        # look for exact match in ws_keys first
        for k, v in ws_keys.items():
            if v == substr or substr in v:
                line_key_candidates.append((k, v, substr))
        # then all_ar
        for k, v in all_ar.items():
            if (v == substr or substr in v) and not k.startswith('authority.workspace.'):
                line_key_candidates.append((k, v, substr))
    matched_lines[line_num] = {'code': code, 'candidates': line_key_candidates}

print(f"Lines processed: {len(matched_lines)}")
with open('scratch/matched_workspace_candidates.json', 'w', encoding='utf-8') as f:
    json.dump(matched_lines, f, ensure_ascii=False, indent=2)
