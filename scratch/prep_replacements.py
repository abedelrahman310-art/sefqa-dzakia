import json
import re

with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)

with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's inspect all strings in work_lines.json
with open('scratch/work_lines.json', 'r', encoding='utf-8') as f:
    work_lines = json.load(f)

print(f"Total lines in work_lines: {len(work_lines)}")
