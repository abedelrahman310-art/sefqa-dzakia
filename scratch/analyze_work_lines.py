import json

with open('scratch/work_lines.json', 'r', encoding='utf-8') as f:
    lines = json.load(f)

print(f'Total lines with Arabic in AuthorityDealWorkspace: {len(lines)}')

for item in lines[:60]:
    l = item['line']
    c = item['code']
    print(f'{l:4d}: {c[:95]}')
