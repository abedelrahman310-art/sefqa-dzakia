import json

with open('scratch/still_lines_full.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

print("=== CHUNK 3 (70 to 105) ===")
for line, code in items[70:105]:
    print(f"{line}: {code}")

print("\n=== CHUNK 4 (105 to end) ===")
for line, code in items[105:]:
    print(f"{line}: {code}")
