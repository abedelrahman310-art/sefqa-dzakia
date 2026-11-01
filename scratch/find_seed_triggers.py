import os
import re

reg = re.compile(r'seed_central_demo|seed_procurement_data|call_command')
for root, _, files in os.walk('.'):
    if any(skip in root for skip in ['.git', 'node_modules', '__pycache__']):
        continue
    for f in files:
        if f.endswith(('.py', '.sh', '.yml', '.yaml', 'Dockerfile')):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8', errors='ignore') as file:
                for i, l in enumerate(file, 1):
                    if reg.search(l):
                        print(f"{p}:{i}: {l.strip()[:110]}")
