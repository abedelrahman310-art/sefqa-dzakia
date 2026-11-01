import json

with open('scratch/check_no_candidates.py', 'r', encoding='utf-8') as f:
    pass

with open('scratch/matched_workspace_candidates.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

items = []
for line_num, val in data.items():
    code = val['code']
    # skip lines 204 to 268 (TEMPLATE_PRESETS definition)
    l_int = int(line_num)
    if 203 <= l_int <= 268:
        continue
    # skip comments
    if code.startswith('//') or code.startswith('{/*'):
        continue
    if not val['candidates']:
        items.append((l_int, code))

print(f"Non-preset non-comment lines needing keys: {len(items)}")
for l_int, code in items:
    print(f"{l_int}: {code}")
