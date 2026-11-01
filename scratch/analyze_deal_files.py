import re

def analyze(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    lines = text.splitlines()
    ar_lines = [(i+1, l.strip()) for i, l in enumerate(lines) if re.search(r'[\u0600-\u06FF]', l)]
    print(f'{path}: {len(ar_lines)} lines with Arabic')
    return ar_lines

ar_wiz = analyze('client/src/pages/authority/AuthorityDealWizard.tsx')
ar_work = analyze('client/src/pages/authority/AuthorityDealWorkspace.tsx')
