import re

with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

tabs = re.findall(r'activeTab\s*===\s*[\'"]([^\'"]+)[\'"]', text)
print('Active tabs:', sorted(list(set(tabs))))

# Find tab buttons in the file
btn_matches = re.findall(r'<button[^>]*onClick=\{[^}]*setActiveTab\([\'"]([^\'"]+)[\'"]\)[^>]*>([\s\S]*?)<\/button>', text)
print(f'Found {len(btn_matches)} tab buttons:')
for t_id, b_inner in btn_matches:
    # clean inner
    inner_clean = ' '.join(b_inner.split())
    print(f'  Tab [{t_id}]: {inner_clean[:80]}')
