import os
import re

layout_dir = 'client/src/components/layout'
arabic_pattern = re.compile(r'[\u0600-\u06FF]')

files = []
for root, _, filenames in os.walk(layout_dir):
    for f in filenames:
        if f.endswith(('.ts', '.tsx')):
            files.append(os.path.join(root, f))

for filepath in sorted(files):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    real_ar = []
    for i, line in enumerate(lines):
        s = line.strip()
        # skip full comments
        if s.startswith('//') or s.startswith('/*') or s.startswith('*') or (s.startswith('{/*') and s.endswith('*/}')):
            continue
        # also check if the line only contains a comment
        cleaned = re.sub(r'\{/\*.*?\*/\}', '', s).strip()
        cleaned = re.sub(r'//.*$', '', cleaned).strip()
        if arabic_pattern.search(cleaned):
            real_ar.append((i + 1, cleaned))
    if real_ar:
        print(f"\n=== {filepath} ({len(real_ar)} real lines) ===")
        for num, text in real_ar:
            print(f"  {num}: {text}")
