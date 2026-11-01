with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'TEMPLATE_PRESETS', text)]
print(f"Matches for TEMPLATE_PRESETS: {len(matches)}")
for m in matches:
    start = max(0, text.rfind('\n', 0, m))
    end = text.find('\n', m)
    print(text[start:end])
