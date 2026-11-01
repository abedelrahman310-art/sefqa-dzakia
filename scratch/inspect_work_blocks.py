import json

with open('scratch/work_lines.json', 'r', encoding='utf-8') as f:
    lines = json.load(f)

# Group lines by blocks
blocks = []
current_block = []
for item in lines:
    line_num = item['line']
    if not current_block or line_num <= current_block[-1]['line'] + 5:
        current_block.append(item)
    else:
        blocks.append(current_block)
        current_block = [item]
if current_block:
    blocks.append(current_block)

print(f"Total line blocks with Arabic: {len(blocks)}")
for b in blocks:
    print(f"Lines {b[0]['line']} to {b[-1]['line']} (count: {len(b)}): first code: {b[0]['code'][:60]}")
