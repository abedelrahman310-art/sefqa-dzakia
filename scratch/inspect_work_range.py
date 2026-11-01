import json, sys

with open('scratch/work_lines.json', 'r', encoding='utf-8') as f:
    lines = json.load(f)

start_r = int(sys.argv[1]) if len(sys.argv) > 1 else 1
end_r = int(sys.argv[2]) if len(sys.argv) > 2 else 500

for item in lines:
    l = item['line']
    if start_r <= l <= end_r:
        print(f'{l:4d}: {item["code"][:95]}')
