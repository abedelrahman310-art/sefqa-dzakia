with open('client/src/features/execution/components/ExecutionTracker.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

import re
arabic_pattern = re.compile(r'[\u0600-\u06FF]')
for i, line in enumerate(lines):
    if arabic_pattern.search(line):
        print(f"{i+1}: {line.strip()}")
