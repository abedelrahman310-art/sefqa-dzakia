import os
import re

auth_dir = 'client/src/pages/authority'
imports = set()

for root, _, files in os.walk(auth_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8') as file:
                content = file.read()
            for m in re.finditer(r'from\s+[\'"](@/[^\'"]+)[\'"]', content):
                imports.add(m.group(1))

print("All internal @/ imports across Authority pages:")
for imp in sorted(imports):
    print(f"  {imp}")
