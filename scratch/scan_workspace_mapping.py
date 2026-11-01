import re
import json

with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

arabic_pattern = re.compile(r'[\u0600-\u06FF]')

items = []
for i, line in enumerate(lines):
    if arabic_pattern.search(line):
        items.append({'line': i + 1, 'text': line.strip()})

print(f"Total lines with Arabic: {len(items)}")

with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)

# Find keys in ar.json that match text
matches = []
unmatched = []

for item in items:
    found = []
    for k, v in ar.items():
        if isinstance(v, str) and v and v in item['text']:
            found.append(k)
    if found:
        matches.append((item['line'], item['text'], found))
    else:
        unmatched.append((item['line'], item['text']))

print(f"Direct match found for {len(matches)} lines, unmatched: {len(unmatched)} lines.")
with open('scratch/unmatched_workspace.json', 'w', encoding='utf-8') as f:
    json.dump(unmatched, f, ensure_ascii=False, indent=2)
