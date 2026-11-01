import os
import re

arabic_pattern = re.compile(r'[\u0600-\u06FF]')

target_dirs = [
    'client/src/features/execution',
    'client/src/features/evaluation',
    'client/src/pages/authority',
]

for d in target_dirs:
    if not os.path.exists(d):
        print(f"Directory {d} does not exist.")
        continue
    print(f"\n--- Checking {d} ---")
    for root, _, files in os.walk(d):
        for f in files:
            if f.endswith('.tsx') or f.endswith('.ts'):
                p = os.path.join(root, f)
                with open(p, 'r', encoding='utf-8') as file:
                    lines = file.readlines()
                ar = [i+1 for i, l in enumerate(lines) if arabic_pattern.search(l)]
                if ar:
                    print(f"  {os.path.relpath(p, d):35}: {len(ar)} Arabic lines")
                else:
                    print(f"  {os.path.relpath(p, d):35}: CLEAN (0 lines)")
