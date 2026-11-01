import os
import re
import json

obj_dir = 'client/src/features/objections'
arabic_pattern = re.compile(r'[\u0600-\u06FF]')

items = []
for root, _, files in os.walk(obj_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8') as file:
                lines = file.readlines()
            for i, line in enumerate(lines):
                if arabic_pattern.search(line):
                    items.append({
                        'file': os.path.relpath(p, obj_dir),
                        'line': i + 1,
                        'code': line.strip()
                    })

with open('scratch/objections_lines.json', 'w', encoding='utf-8') as f:
    json.dump(items, f, ensure_ascii=False, indent=2)

print(f"Dumped {len(items)} lines to objections_lines.json")
