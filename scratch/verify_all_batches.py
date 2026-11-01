import os
import re
import json

arabic_pattern = re.compile(r'[\u0600-\u06FF]')

def scan_dir_for_real_arabic(directory):
    total = 0
    file_details = {}
    for root, _, filenames in os.walk(directory):
        for f in filenames:
            if f.endswith(('.ts', '.tsx')):
                p = os.path.join(root, f)
                with open(p, 'r', encoding='utf-8') as file:
                    lines = file.readlines()
                real_lines = []
                for i, l in enumerate(lines):
                    s = l.strip()
                    if s.startswith('//') or s.startswith('/*') or s.startswith('*') or (s.startswith('{/*') and s.endswith('*/}')):
                        continue
                    cleaned = re.sub(r'\{/\*.*?\*/\}', '', s).strip()
                    cleaned = re.sub(r'//.*$', '', cleaned).strip()
                    if arabic_pattern.search(cleaned):
                        real_lines.append((i + 1, cleaned))
                if real_lines:
                    file_details[p] = real_lines
                    total += len(real_lines)
    return total, file_details

print("=================================================================")
print("=== VERIFYING ALL 4 LOCALIZATION BATCHES ===")
print("=================================================================")

targets = [
    ("Batch 1: Economic Operator Portal", "client/src/pages/operator"),
    ("Batch 2: Central Admin Portal (Hawk Eye)", "client/src/pages/central"),
    ("Batch 3: Contracting Authority Portal", "client/src/pages/authority"),
    ("Batch 3: Execution Tracking Feature", "client/src/features/execution"),
    ("Batch 4.1: Public Opening Sessions Feature", "client/src/features/opening"),
    ("Batch 4.2: Objections & Recourse Feature", "client/src/features/objections"),
    ("Batch 4.3: Artificial Intelligence Feature", "client/src/features/ai"),
    ("Batch 4.4: Navigation & Layout Shell", "client/src/components/layout"),
]

all_passed = True
for title, path in targets:
    count, details = scan_dir_for_real_arabic(path)
    if count == 0:
        print(f"✓ {title}: 0 real Arabic lines remaining (100% CLEAN)")
    else:
        all_passed = False
        print(f"✗ {title}: {count} real Arabic lines remaining:")
        for p, lines in details.items():
            print(f"    - {p}: {len(lines)} lines")
            for lno, txt in lines[:5]:
                print(f"        {lno}: {txt[:70]}")

print("\n=================================================================")
print("=== CHECKING LOCALE DICTIONARY PARITY ===")
print("=================================================================")
with open('client/src/locales/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)
with open('client/src/locales/fr.json', 'r', encoding='utf-8') as f:
    fr = json.load(f)

ar_keys = set(ar.keys())
fr_keys = set(fr.keys())

missing_in_fr = ar_keys - fr_keys
missing_in_ar = fr_keys - ar_keys

print(f"Total keys in ar.json: {len(ar_keys)}")
print(f"Total keys in fr.json: {len(fr_keys)}")

if not missing_in_fr and not missing_in_ar:
    print("✓ Strict 100% Key Parity Confirmed (0 missing keys either way)")
else:
    all_passed = False
    if missing_in_fr:
        print(f"✗ Missing in fr.json ({len(missing_in_fr)}): {list(missing_in_fr)[:10]}")
    if missing_in_ar:
        print(f"✗ Missing in ar.json ({len(missing_in_ar)}): {list(missing_in_ar)[:10]}")

print(f"\nOVERALL STATUS: {'ALL CHECKS PASSED (100% COMPLETE)' if all_passed else 'SOME CHECKS FAILED'}")
