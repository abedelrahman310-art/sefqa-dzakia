import json
import re

with open('scratch/inspect_remaining_170.py', 'r', encoding='utf-8') as f:
    pass

from scratch.inspect_remaining_170 import still_lines

print(f"Total lines in still_lines: {len(still_lines)}")
for idx, code in still_lines[40:80]:
    print(f"{idx}: {code}")
