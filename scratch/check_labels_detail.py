with open('client/src/lib/procurementTemplates.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines[:100]):
    if 'METHOD_LABELS' in line or 'FORM_LABELS' in line or 'NATURE_LABELS' in line:
        for j in range(i, min(i+10, len(lines))):
            print(f"{j+1}: {lines[j]}", end='')
        print("-" * 40)
