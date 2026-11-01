import json

with open('scratch/work_lines.json', 'r', encoding='utf-8') as f:
    lines = json.load(f)

# Group by line range:
ranges = {
    '1-500': [],
    '501-1000': [],
    '1001-1500': [],
    '1501-2000': [],
    '2001-2500': [],
    '2501-3100': []
}

for item in lines:
    l = item['line']
    c = item['code']
    for r in ranges:
        start, end = map(int, r.split('-'))
        if start <= l <= end:
            ranges[r].append((l, c))
            break

for r, items in ranges.items():
    print(f'Range {r}: {len(items)} lines')
