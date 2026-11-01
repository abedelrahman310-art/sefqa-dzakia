import re, json

def extract_strings(path):
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # find arabic strings in quotes or jsx
    lines = text.splitlines()
    found = []
    for idx, line in enumerate(lines):
        line_num = idx + 1
        matches = re.findall(r'[\u0600-\u06FF][^\n\r\"\<\>\{\}\`]*[\u0600-\u06FF]?', line)
        if matches:
            found.append((line_num, line.strip(), matches))
    return found

wiz_strings = extract_strings('client/src/pages/authority/AuthorityDealWizard.tsx')
work_strings = extract_strings('client/src/pages/authority/AuthorityDealWorkspace.tsx')

print(f'Wizard lines with matches: {len(wiz_strings)}')
print(f'Workspace lines with matches: {len(work_strings)}')

# Print first 20 wizard strings
for l, line, m in wiz_strings[:20]:
    print(f'Wiz L{l}: {m} --> {line[:80]}')
