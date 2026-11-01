import os

comp_dir = 'client/src/features/objections/components'
for f in os.listdir(comp_dir):
    if f.endswith('.tsx'):
        p = os.path.join(comp_dir, f)
        with open(p, 'r', encoding='utf-8') as file:
            lines = file.readlines()
        print(f"=== {f} ===")
        for i, l in enumerate(lines[:35]):
            print(f"  {i+1}: {l.strip()}")
