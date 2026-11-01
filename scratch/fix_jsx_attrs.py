import re

with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find any unbracketed attr=t('...')
# like title=t('...'), placeholder=t('...'), aria-label=t('...')
matches = re.findall(r'(\b[a-zA-Z\-]+=)t\(([^)]+)\)', content)
print(f"Found {len(matches)} unbracketed JSX attributes:")
for m in matches:
    print(m)

# Fix them: attr=t(...) -> attr={t(...)}
fixed_content = re.sub(r'(\b[a-zA-Z\-]+=)t\(([^)]+)\)', r'\1{t(\2)}', content)

with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'w', encoding='utf-8') as f:
    f.write(fixed_content)

print("Fixed unbracketed JSX attributes.")
