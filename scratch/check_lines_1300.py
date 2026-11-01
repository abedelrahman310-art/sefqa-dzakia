with open('client/src/pages/authority/AuthorityDealWizard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(1300, len(lines)):
    l = lines[i].strip()
    import re
    if re.search(r'[\u0600-\u06FF]', l):
        print(f'{i+1}: {l}')
