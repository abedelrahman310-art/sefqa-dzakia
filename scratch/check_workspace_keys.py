import json
import re

with open('scratch/add_workspace_keys.py', 'r', encoding='utf-8') as f:
    text = f.read()

keys = re.findall(r"'authority\.workspace\.[^']+'", text)
print(f'Total keys in add_workspace_keys.py: {len(keys)}')

with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)

ws_keys = [k for k in ar.keys() if k.startswith('authority.workspace.')]
print(f'Total authority.workspace keys in ar.json: {len(ws_keys)}')
