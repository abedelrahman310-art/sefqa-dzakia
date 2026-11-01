# -*- coding: utf-8 -*-

# 1. LanguageSwitcher.tsx
path = 'client/src/components/layout/LanguageSwitcher.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace(
    "const label = lang === 'ar' ? 'Français' : 'العربية';",
    "const label = t('common.lang_switch_label');"
)
c = c.replace(
    "const shortLabel = lang === 'ar' ? 'FR' : 'عربي';",
    "const shortLabel = t('common.lang_switch_short');"
)
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated LanguageSwitcher.tsx")

# 2. OperatorTopBar.tsx
path = 'client/src/components/layout/OperatorTopBar.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace(
    "{lang === 'ar' ? 'FR' : 'عربي'}",
    "{t('common.lang_switch_short')}"
)
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated OperatorTopBar.tsx")

# 3. PortalShell.tsx
path = 'client/src/components/layout/PortalShell.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace(
    "{lang === 'ar' ? 'FR' : 'عربي'}",
    "{t('common.lang_switch_short')}"
)
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated PortalShell.tsx")

# 4. PortalTopBar.tsx
path = 'client/src/components/layout/PortalTopBar.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace(
    "{lang === 'ar' ? 'FR' : 'عربي'}",
    "{t('common.lang_switch_short')}"
)
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated PortalTopBar.tsx")

# 5. ServiceTopBar.tsx
path = 'client/src/components/layout/ServiceTopBar.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace(
    "{lang === 'ar' ? 'FR' : 'عربي'}",
    "{t('common.lang_switch_short')}"
)
c = c.replace(
    "1. الهوية: الشعار واسم المنصة (دون تكرار)",
    "1. Brand Identity: Logo and platform brand name"
)
c = c.replace(
    "3. الأدوات: أدوات النظام + أدوات الحساب\n          تباعد موحد بين 8 و12px، وأبعاد تفاعلية لا تقل عن 40×40px",
    "3. Action tools: System tools and Account menu\n          Unified 8-12px spacing, min 40x40px touch targets"
)
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated ServiceTopBar.tsx")

# 6. NotificationDropdown.tsx unicode escapes for payload matching
path = 'client/src/components/layout/NotificationDropdown.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace("t.includes('عقد')", "t.includes('\\u0639\\u0642\\u062f')")
c = c.replace("t.includes('منح') || t.includes('إسناد')", "t.includes('\\u0645\\u0646\\u062d') || t.includes('\\u0625\\u0633\\u0646\\u0627\\u062f')")
c = c.replace("t.includes('فتح')", "t.includes('\\u0641\\u062a\\u062d')")
c = c.replace("t.includes('رفض')", "t.includes('\\u0631\\u0641\\u0636')")
c = c.replace("t.includes('صفقة')", "t.includes('\\u0635\\u0641\\u0642\\u0629')")
with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("Updated NotificationDropdown.tsx")
