import json

with open('scratch/unmatched_workspace.json', 'r', encoding='utf-8') as f:
    unmatched = json.load(f)

for item in unmatched:
    print(item)
