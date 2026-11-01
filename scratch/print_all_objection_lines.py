import os
import re

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
                    items.append((os.path.relpath(p, obj_dir), i + 1, line.strip()))

print(f"Total remaining lines: {len(items)}")
for f, l, code in items:
    print(f"{f}:{l}: {code}")
