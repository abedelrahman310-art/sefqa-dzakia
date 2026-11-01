import json

with open('scratch/still_lines_full.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

print("=== CHUNK 1 (0 to 35) ===")
for line, code in items[0:35]:
    print(f"{line}: {code}")

print("\n=== CHUNK 2 (35 to 70) ===")
for line, code in items[35:70]:
    print(f"{line}: {code}")
