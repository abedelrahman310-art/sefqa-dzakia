# Safaqat — Tasks Board

## Sprint 0 — التأسيس ✅
| ID    | Title                   | Owner     | Status |
|-------|-------------------------|-----------|--------|
| T-001 | تأمين WIP Objections    | OpenCode  | ✅ Done |
| T-002 | جرد + قرار Backend      | Architect | ✅ Done |
| T-003 | توحيد .env + قرارات     | Architect | ✅ Done |

## Sprint 1 — التصحيح والدمج ✅
| ID     | Title                              | Owner     | Status |
|--------|------------------------------------|-----------|--------|
| T-004  | التحقق من build/test/lint          | OpenCode  | ✅ Done |
| T-004a | منفذ Postgres قابل للتهيئة (5434)  | Architect | ✅ Done |
| T-004b | requirements-dev.txt + Dockerfile  | Architect | ✅ Done |
| T-004c | دمج backup في الفرع النشط          | Architect | ✅ Done |

## Sprint 2 — المنتج (الحالي)
| ID    | Title                                | Owner       | Status |
|-------|--------------------------------------|-------------|--------|
| P-001 | توحيد Login (Login.tsx ↔ LoginPage)  | Antigravity | 🔄 التالي |
| P-002 | إكمال Objections UI                  | Antigravity | Todo   |
| P-003 | Central: قسم Appeals                 | Antigravity | Todo   |
| P-010 | إعادة تصميم صفحة التسجيل (3 بطاقات وتحقق لحظي) | Antigravity | ✅ Done |
| P-011 | تنظيف AuthorityOverview              | Antigravity | ✅ Done |
| P-012 | إعادة تصميم صفحة التسجيل (مطابق للصورة) | Antigravity | ✅ Done |
| P-013 | توحيد هيكل البوابات الثلاث (Portal Shell + Sidebar) | Antigravity | 🔄 المرحلة 5 منجزة |

### P-013 — Portal Shell & Sidebar Unification
- Status: ✅ المرحلة 1 و 2 و 3 و 4 و 5 منجزة
- Branch: `feat/p-013-portal-shell`
- Commits:
  - `29ffd75` — `chore(layout): remove dead AppShell/UserDropdown code (P-013.1)`
  - `5806a0e` — `feat(layout): PortalSidebar with unified header, nav style, and footer (P-013.2)`
  - `0b39f9d` — `feat(layout): create unified PortalShell component (P-013.3)`
  - `7859f22` — `refactor(authority): migrate AuthoritySpace to PortalShell and PortalSidebar (P-013.4)`
  - `refactor(central): migrate to PortalShell (P-013.5)`
- Stage 1 (حذف الكود الميت):
  - حذف `AppShell.tsx`, `UserDropdown.tsx`, `CentralAdminTopBar.css` (-406 أسطر كود ميت).
  - تبسيط `DevShell.tsx`.
- Stage 2 (إنشاء PortalSidebar):
  - إنشاء `client/src/components/layout/PortalSidebar.tsx` (127 سطراً).
  - توحيد Header, Nav, Footer عبر الأدوار الثلاثة.
- Stage 3 (إنشاء PortalShell):
  - إنشاء `client/src/components/layout/PortalShell.tsx`.
  - إحصائيات `Measure-Object`: 105 أسطر، 370 كلمة، 3904 أحرف.
  - يدعم الخصائص: `sidebar`, `topBar`, `mobileTitle`, `hideSidebar`, `hideTopBar`, `contentClassName`, `children`.
- Stage 4 (ترحيل AuthoritySpace):
  - ترحيل `client/src/pages/authority/AuthoritySpace.tsx` لاستخدام `PortalShell` و `PortalSidebar`.
  - تقليص الحجم من 290 إلى 161 سطراً (-129 سطراً، تخفيض 44.5%).
  - إحصائيات `Measure-Object`: 161 أسطر، 471 كلمة، 6356 أحرف.
  - الحفاظ على: كافة المسارات الـ 20 داخل `Switch`، جميع مطابقات `useRoute`، مصفوفة `navItems`، وتمرير `showDesktopAppButton`.
  - حذف الكود المكرر: `aside`، درج `Sheet`، رأس الهاتف، دالة `sidebarContent`، منطق التمرير اليدوي `useLocation`.
- Stage 5 (ترحيل CentralSpace):
  - ترحيل `client/src/pages/central/CentralSpace.tsx` لاستخدام `PortalShell` و `PortalSidebar`.
  - تقليص الحجم من 274 إلى 134 سطراً (-140 سطراً، تخفيض 51.1%).
  - إحصائيات `Measure-Object`: 134 أسطر، 371 كلمة، 4514 أحرف.
  - الحفاظ على: كافة المسارات الـ 11 داخل `Switch`، جميع مطابقات `useRoute`، مصفوفة `navItems`، ومنطق `isMapRoute` مع `currentTitle`.
  - تمرير: `brandInitial="ص"` و `accentColor="var(--stamp-green-700)"` و `hideSidebar={isMapRoute}` و `hideTopBar={isMapRoute}`.
  - حذف الكود المكرر: `aside`، درج `Sheet`، رأس الهاتف، دالة `sidebarContent`، منطق التمرير اليدوي `useEffect` مع `useLocation`.
- Tests & Verification:
  - `pnpm --filter client typecheck` ✅ (0 errors)
  - `pnpm --filter client build` ✅ (29.88s, 0 errors)
- Next Step (Stage 6): ترحيل `OperatorSpace` إلى `PortalShell` و `PortalSidebar`.

### P-010 — Register Redesign (3 Cards & Live Validation)
- Status: ✅ Done
- Branch: `feat/p-010-register-redesign`
- Files:
  - `client/src/components/auth/RegisterHero.tsx` (Shared Hero: Maqam Echahid, Algerian flag, 3 feature pills, compact header on mobile)
  - `client/src/components/auth/RegisterRoleTabs.tsx` (Role tabs: Operator, Authority, Central Admin notice)
  - `client/src/components/auth/PasswordStrengthMeter.tsx` (4-level password strength meter with animated color bars)
  - `client/src/pages/auth/OperatorRegister.tsx` (3 visual cards layout, searchable Wilaya combobox, real-time validation for phone/email/passwords, shake animation on terms error, 3-state submit button)
  - `client/src/pages/auth/AuthorityRegister.tsx` (3 visual cards layout, searchable Wilaya combobox, authority service code, live validation, preserved backend payload contract)
  - `client/src/i18n/ar.ts` & `client/src/i18n/fr.ts` (Comprehensive bilingual strings for groups, field errors, hints, strength levels)
- Visual Card Groups (Across both roles):
  1. `بيانات الهوية والممثل` (Full Name, Email, Phone with hint)
  2. `معلومات النشاط والولاية` / `معلومات المصلحة المتعاقدة والولاية` (Searchable Wilaya dropdown across 58 wilayas + RC or Service Code)
  3. `الأمان وبيانات الدخول` (Password + Strength Meter, Confirm Password + Live Match feedback, Terms checkbox with shake effect)
- Preserved Backend State & Payloads:
  - All 14 fields maintained (`fullName`, `email`, `phone`, `password`, `confirmPassword`, `wilaya`, `rc`/`code`, `termsAccepted`, `company`, `legalForm`, `nif`, `nis`, `address`, `repRole`, `category`, `tutelle`, `docName`, `docValid`).
- Verification & Tests:
  - `pnpm --filter client typecheck` ✅ (0 errors)
  - `pnpm --filter client build` ✅ (11.87s, 0 errors)
- Screenshots:
  - Desktop Operator: `register_operator_desktop.png`
  - Desktop Authority: `register_authority_desktop.png`
  - Mobile Operator: `register_operator_mobile.png`


### P-011 — AuthorityOverview Cleanup & Refinement
- Status: ✅ Done
- Branch: `feat/p-011-cleanup-authority-overview`
- Files:
  - `client/src/pages/authority/AuthorityOverview.tsx` (Reduced from 273 lines to 121 lines, ≤ 180 lines constraint met)
  - `client/src/pages/authority/components/DraftsTable.tsx` (Internal component for 5-column drafts table and empty state)
  - `client/src/pages/authority/components/AlertsList.tsx` (Internal component for dynamic data-derived alerts)
  - `client/src/shared/components/EmptyState.tsx` (Reusable shared EmptyState component)
  - `client/src/shared/components/index.ts` (Exported EmptyState)
  - `client/src/i18n/ar.ts` & `client/src/i18n/fr.ts` (Added all authority.overview translation keys)
- Lines before/after:
  - `AuthorityOverview.tsx`: 273 lines -> 121 lines (Strictly ≤ 180 lines)
- Hardcoded Arabic Strings: 0 (`Select-String '[آ-ي]{3,}'` clean across all files)
- Tests:
  - `pnpm --filter client typecheck` ✅ (0 errors)
  - `pnpm --filter client build` ✅ (10.19s, 0 errors)
- Screenshot:
  - `authority_overview_clean.png`


### P-012 — Register Redesign
- Status: ✅ Done
- Branch: `feat/p-012-register-redesign`
- Files:
  - `client/src/components/auth/RegisterHero.tsx` (Shared Hero: Maqam Echahid, flag, 3 feature pills with teal/blue/purple badges, bottom slogan, compact header on mobile)
  - `client/src/components/auth/RegisterRoleTabs.tsx` (Shared 3-role selector tab bar with active navy pill, icon-above-text vertical alignment, dividers, and wouter routing)
  - `client/src/pages/auth/OperatorRegister.tsx` (Redesigned 55/45 split, 100vh desktop, RTL-aligned 5-row form, terms checkbox, primary submit button, Google button, login link)
  - `client/src/pages/auth/AuthorityRegister.tsx` (Matching 55/45 split, active role "المصلحة المتعاقدة", preserved all authority state & submission logic)
  - `client/src/i18n/ar.ts` (Arabic strings for register redesign)
  - `client/src/i18n/fr.ts` (French strings for register redesign)
- Lines before/after:
  - `OperatorRegister.tsx`: 1000 lines before -> 538 lines after (-462 lines cleaner)
  - `AuthorityRegister.tsx`: 1005 lines before -> 482 lines after (-523 lines cleaner)
- Fields preserved (14 fields total across roles):
  - Operator: `fullName`, `email`, `phone`, `password`, `confirmPassword`, `wilaya`, `rc` (commercial register / tax ID), `termsAccepted`, + preserved state payloads: `company`, `legalForm`, `nif`, `nis`, `address`, `repRole`.
  - Authority: `fullName`, `email`, `phone`, `password`, `confirmPassword`, `wilaya`, `code` (service code / tax ID), `termsAccepted`, + preserved state payloads: `category`, `tutelle`, `address`, `repRole`, `docName`, `docValid`.
- Fields added: 0 (Strict compliance with zero added fields rule).
- Tests:
  - `pnpm --filter client typecheck` ✅ (0 errors)
  - `pnpm --filter client build` ✅ (11.72s, 0 errors)
  - Zero console errors in Edge CDP runtime test.
- Screenshots:
  - Desktop Operator: `register_operator_desktop.png`
  - Desktop Authority: `register_authority_desktop.png`
  - Tablet: `register_operator_tablet.png`
  - Mobile (compact header): `register_operator_mobile.png`


## Sprint 3 — بقية Central
| ID    | Title                | Owner       | Status |
|-------|----------------------|-------------|--------|
| P-004 | Central: Deals       | Antigravity | Todo   |
| P-005 | Central: Authorities | Antigravity | Todo   |
| P-006 | Central: Operators   | Antigravity | Todo   |
| P-007 | Central: Reports     | Antigravity | Todo   |
| P-008 | Central: Permissions | Antigravity | Todo   |

## Sprint 4 — النظافة
| ID    | Title                    | Owner       | Status |
|-------|--------------------------|-------------|--------|
| C-001 | إصلاح 52 خطأ lint        | Antigravity | Todo   |
| C-002 | حذف server/ من workspace | OpenCode    | Todo   |
| C-003 | توحيد ملفات تعليمات AI   | Architect   | Todo   |
