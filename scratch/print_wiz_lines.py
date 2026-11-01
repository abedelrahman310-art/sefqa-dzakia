import json

with open('scratch/wiz_lines.json', 'r', encoding='utf-8') as f:
    lines = json.load(f)

for item in lines:
    l = item['line']
    c = item['code']
    print(f'L{l:4d}: {c[:100]}')
