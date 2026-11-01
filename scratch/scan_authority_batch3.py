import os
import re

auth_dir = 'client/src/pages/authority'
arabic_pattern = re.compile(r'[\u0600-\u06FF]')

files_scanned = 0
total_arabic_lines = 0
file_results = []

for root, dirs, files in os.walk(auth_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            path = os.path.join(root, f)
            files_scanned += 1
            with open(path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
            ar_lines = [i+1 for i, l in enumerate(lines) if arabic_pattern.search(l)]
            count = len(ar_lines)
            total_arabic_lines += count
            file_results.append((os.path.relpath(path, auth_dir), count))

print(f"Total files scanned in pages/authority: {files_scanned}")
print(f"Total Arabic lines remaining across all files: {total_arabic_lines}")
print("-" * 50)
for rel_path, count in sorted(file_results):
    status = "CLEAN (0 lines)" if count == 0 else f"NOT CLEAN ({count} lines)"
    print(f"{rel_path:40}: {status}")
