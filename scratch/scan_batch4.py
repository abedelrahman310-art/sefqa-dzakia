import os
import re

dirs_to_scan = [
    'client/src/features/opening',
    'client/src/features/objections',
    'client/src/features/ai',
    'client/src/components/layout',
]

arabic_pattern = re.compile(r'[\u0600-\u06FF]')

print("=== BATCH 4 ARABIC LINES AUDIT ===")
total_lines = 0
for d in dirs_to_scan:
    if not os.path.exists(d):
        print(f"Directory {d} does not exist.")
        continue
    print(f"\nDirectory: {d}")
    dir_lines = 0
    for root, _, files in os.walk(d):
        for f in files:
            if f.endswith('.tsx') or f.endswith('.ts'):
                p = os.path.join(root, f)
                with open(p, 'r', encoding='utf-8') as file:
                    lines = file.readlines()
                ar = [i+1 for i, l in enumerate(lines) if arabic_pattern.search(l)]
                if ar:
                    print(f"  {os.path.relpath(p, d):35}: {len(ar)} lines")
                    dir_lines += len(ar)
    print(f"  --> Subtotal: {dir_lines} lines")
    total_lines += dir_lines

print(f"\nTOTAL ARABIC LINES IN BATCH 4: {total_lines}")
