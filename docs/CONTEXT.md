# Safaqat — Project Context (v4)

## المنصة
منصة وطنية جزائرية GovTech + LegalTech + AI
لتسيير دورة حياة الصفقات العمومية.
- القانون 23-12
- المرسوم الرئاسي 15-247

## المعمارية
### backend/ = Backend الرسمي (Django + Postgres)
- apps: ai_gateway, audit, bids, contracts, execution, procurements, reports, users
- Postgres 16-alpine عبر docker-compose (منفذ مضيف 5434)
- pytest: 81+ اختبار
- requirements-dev.txt يفصل تبعيات التطوير

### server/ = إرث Node (مُجمَّد)

### client/ = React + TS + Vite
- features/: ai, objections, opening
- pages/: auth, authority, central, landing, operator
- components/layout/: PortalTopBar, CentralAdminTopBar, OperatorTopBar, ServiceTopBar

## حالة البوابات
- Authority: 10/10 مفعّل
- Operator: 8/8 مفعّل
- Central: لوحة رئيسية + 6 Placeholder

## الفروع
- master (الرئيسي)
- phase-2-seeding-auth (نشط)
- backup/wip-objections-2026-10-15 (نسخة أمان)

## الميزات المنجزة
- Objections: backend + tests + features/objections/ ✅
- LoginPage: client/src/pages/auth/LoginPage.tsx ✅
- TopBars: PortalTopBar, CentralAdminTopBar, OperatorTopBar, ServiceTopBar ✅

## قرارات محسومة
- ADR-001: فريق ثلاثي (Architect / Antigravity / OpenCode)
- ADR-002: master هو الرئيسي
- ADR-003: Postgres على منفذ مضيف 5434
- ADR-004: Django هو الـ Backend المستقبلي
- ADR-005: dev deps في requirements-dev.txt

## قرارات مفتوحة
- OQ-2: أي Login يبقى؟
- OQ-3: توحيد ملفات تعليمات AI
- OQ-4: حذف server/ نهائيًا
