import json

with open('scratch/ai_lines.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for path, lines in data.items():
    print(f"\n========================================================")
    print(f"=== {path} ({len(lines)} lines) ===")
    print(f"========================================================")
    for l in lines:
        print(f"{l['line']}: {l['text'].strip()}")
