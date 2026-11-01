import os
import re
import json

ai_dir = 'client/src/features/ai'
arabic_pattern = re.compile(r'[\u0600-\u06FF]')

data = {}
for root, _, filenames in os.walk(ai_dir):
    for f in filenames:
        if f.endswith(('.ts', '.tsx')):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8') as file:
                lines = file.readlines()
            file_ar = []
            for i, line in enumerate(lines):
                s = line.strip()
                if s.startswith('//') or s.startswith('/*') or s.startswith('*'):
                    continue
                if arabic_pattern.search(line):
                    file_ar.append({'line': i + 1, 'text': line.rstrip()})
            if file_ar:
                data[p] = file_ar

with open('scratch/ai_lines.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Dumped {sum(len(v) for v in data.values())} lines across {len(data)} files.")
