import json

with open('scratch/all_ws_keys.json', 'r', encoding='utf-8') as f:
    ws_keys = json.load(f)

with open('scratch/filter_remaining.py', 'r', encoding='utf-8') as f:
    pass

import re

# Test some phrases
phrases = [
    'يلتزم مسؤولو المصلحة بتدوين السند القانوني الصريح',
    'طلب العروض المفتوح هو الإجراء المبدئي العام',
    'تجميد دفتر الشروط يمنع أي تعديل لاحق',
    'تغيير طريقة أو شكل الإبرام يؤثر مباشرة',
    'استكمال صياغة مسودة دفتر الشروط',
    'تم التحقق من إدراج التصريح بالنزاهة',
    'أسانيد وتبرير الإجراء',
    'قالب دفتر الشروط المعتمد',
    'بنود دفتر الشروط الخمسة',
]

for p in phrases:
    found = [(k, v) for k, v in ws_keys.items() if p in v]
    print(f"Phrase: '{p}': found {len(found)}")
    for k, v in found:
        print(f"  {k} -> {v[:60]}")
