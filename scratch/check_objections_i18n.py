import os

comp_dir = 'client/src/features/objections/components'
for f in os.listdir(comp_dir):
    if f.endswith('.tsx'):
        p = os.path.join(comp_dir, f)
        with open(p, 'r', encoding='utf-8') as file:
            text = file.read()
        has_i18n = 'useI18n' in text
        print(f"{f}: has useI18n = {has_i18n}")
