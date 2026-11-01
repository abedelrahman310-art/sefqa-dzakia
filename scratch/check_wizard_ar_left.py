import re

with open('client/src/pages/authority/AuthorityDealWizard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if re.search(r'[\u0600-\u06FF]', line):
        print(f'{i+1:4d}: {line.strip()[:100]}')
