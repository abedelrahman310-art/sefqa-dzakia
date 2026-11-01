import json

with open('scratch/filter_remaining.py', 'r', encoding='utf-8') as f:
    pass

with open('scratch/matched_workspace_candidates.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

with open('scratch/all_ws_keys.json', 'r', encoding='utf-8') as f:
    ws_keys = json.load(f)

# Inspect line by line
with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'r', encoding='utf-8') as f:
    all_lines = f.readlines()

for line_num_str, val in data.items():
    l_int = int(line_num_str)
    if 203 <= l_int <= 268:
        continue
    code = all_lines[l_int - 1].strip()
    if code.startswith('//') or code.startswith('{/*'):
        continue
    if not val['candidates']:
        print(f"{l_int}: {code}")
