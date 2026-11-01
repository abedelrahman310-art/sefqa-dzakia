import json

with open('scratch/objections_lines.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

by_file = {}
for it in items:
    by_file.setdefault(it['file'], []).append(it)

for fname, lines in by_file.items():
    print(f"\n=== {fname} ({len(lines)} lines) ===")
    for l in lines[:10]:
        print(f"  {l['line']}: {l['code']}")
    if len(lines) > 10:
        print(f"  ... and {len(lines) - 10} more lines.")
