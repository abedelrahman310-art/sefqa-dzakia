import json

with open('scratch/matched_workspace_candidates.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

no_candidates = []
for line_num, val in data.items():
    if not val['candidates']:
        no_candidates.append((line_num, val['code']))

print(f"Lines with 0 candidates: {len(no_candidates)}")
for line_num, code in no_candidates:
    print(f"{line_num}: {code}")
