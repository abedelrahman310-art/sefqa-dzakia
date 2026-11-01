with open('client/src/pages/authority/AuthorityDealWorkspace.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(50, 205):
    if i < len(lines):
        print(f"{i+1}: {lines[i]}", end='')
