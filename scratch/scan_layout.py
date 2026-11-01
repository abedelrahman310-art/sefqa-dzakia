import os
import re

layout_dir = 'client/src/components/layout'
arabic_pattern = re.compile(r'[\u0600-\u06FF]')

files = []
for root, _, filenames in os.walk(layout_dir):
    for f in filenames:
        if f.endswith(('.ts', '.tsx')):
            files.append(os.path.join(root, f))

total_lines = 0
for filepath in sorted(files):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    ar_lines = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*'):
            continue
        if arabic_pattern.search(line):
            ar_lines.append((i + 1, stripped))
    if ar_lines:
        print(f"{filepath} ({len(ar_lines)} lines):")
        total_lines += len(ar_lines)
        for num, text in ar_lines[:10]:
            print(f"  {num}: {text[:80]}")
        if len(ar_lines) > 10:
            print(f"  ... and {len(ar_lines)-10} more")

print(f"\nTotal Arabic lines in components/layout: {total_lines}")
