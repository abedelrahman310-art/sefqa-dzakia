import re, json

with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.splitlines()
results = []
for i, line in enumerate(lines):
    if re.search(r'[\u0600-\u06FF]', line):
        results.append({'line': i+1, 'code': line.strip()})

with open('scratch/work_lines.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f'Wrote {len(results)} lines to scratch/work_lines.json')
