with open('client/src/lib/procurementTemplates.ts', 'r', encoding='utf-8') as f:
    text = f.read()

import re
labels = ['METHOD_LABELS', 'FORM_LABELS', 'NATURE_LABELS']
for l in labels:
    m = re.search(rf'export const {l}[^;]+;', text)
    if m:
        print(m.group(0)[:300])
        print("...")
