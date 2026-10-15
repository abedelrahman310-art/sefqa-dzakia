<<<<<<< HEAD
﻿# Safaqat — Project Context (v3 — قرارات محسومة)

## المنصة
منصة وطنية جزائرية GovTech + LegalTech + AI
لتسيير دورة حياة الصفقات العمومية.
- القانون 23-12
- المرسوم الرئاسي 15-247

## المعمارية — نهائية ✅
### backend/ = Backend الرسمي (Django + Postgres)
- apps: ai_gateway, audit, bids, contracts,
         execution, procurements, reports, users
- منفذ 8000
- Postgres 16-alpine عبر docker-compose
- pytest للاختبارات
- ⚠️ القرار: هو المستقبل

### server/ = إرث (Node + Express + MySQL)
- ❄️ مُجمَّد — لا كود جديد
- آخر تعديل: f967242 (scaffold فقط)
- يُحذف تدريجيًا في Sprint لاحق

### client/ = React + TS + Vite
- features/: ai, objections, opening
- pages/: auth, authority, central, landing, operator
- components/: auth, common, layout, ui
- i18n, lib, shared, theme/tokens

## حالة البوابات (REVIEW-REPORT 2026-10-14)
- Authority: 10/10 مفعّل ✅
- Operator: 8/8 مفعّل ✅
- Central: لوحة رئيسية فقط + 6 Placeholder

## الفروع
- master (الرئيسي)
- phase-2-seeding-auth (نشط — WIP Objections)
- backup/wip-objections-2026-10-15 (نسخة آمنة)
=======
﻿# Safaqat — Project Context

## نظرة عامة
منصة Safaqat — نظام متعدد البوابات:
Landing | Login/Auth | Operator | Authority | Central | Central Admin

## البنية
- backend/  → Django + Postgres (docker)
- client/   → React + TS + Vite (features-based)
- server/   → Node.js (دور غير مؤكد — يُتحقق)
- shared/   → كود مشترك
- docker-compose.yml → Postgres 16 + Django

## التقنيات المؤكدة
- Node >= 24
- pnpm 8.15.5
- React + TypeScript + Vite
- Django + Postgres 16

## client/src layout
- components/{auth,common,layout,ui}
- features/{ai,objections,opening}
- pages/{auth,authority,central,landing,operator}
- i18n, lib, shared, theme/tokens

## الفروع
- master (الرئيسي)
- phase-2-seeding-auth (نشط — WIP)
>>>>>>> backup/wip-objections-2026-10-15
- backup/operator-portal-before-closure
- feature/operator-portal-closure
- feature/technical-compliance-agent

<<<<<<< HEAD
## WIP الحالي
ميزة Objections (الاعتراضات):
- backend Django: apps/contracts (models, serializers, views, urls, admin, permissions, services)
- migration 0004_add_objections
- client: features/objections/ + تعديلات PortalTopBars
- test: backend/tests/test_objections.py
- محفوظ في: backup/wip-objections-2026-10-15

## قرارات محسومة (ADR)
- ADR-001: فريق وكلاء ثلاثي (Architect / Antigravity / OpenCode)
- ADR-002: الفرع الرئيسي = master
- ADR-003: Postgres عبر Docker
- ADR-004: ✅ Django (backend/) هو الـ Backend المستقبلي
           Node (server/) إرث مُجمَّد

## قرارات مفتوحة (قليلة)
- OQ-2: توحيد Login.tsx و auth/LoginPage.tsx
- OQ-3: توحيد ملفات تعليمات AI المتعددة
- OQ-4: متى نحذف server/ نهائيًا؟
- OQ-5: هل ai_gateway في Django جاهز ليستقبل منطق AI من Node؟

## حالة Sprint 1 (2026-10-15)
- ✅ T-004: 81 اختبار يمر، build ينجح
- ⚠️ lint: 52 خطأ (T-004c)
- ⚠️ pytest غير مثبت في requirements (T-004b)
- ⚠️ تعارض منفذ 5432 مع procure_ai_db (T-004a)
- ✅ ميزة Objections سليمة في Django (81 test)
=======
## ميزة قيد التنفيذ
Objections — backend (apps/contracts) + client (features/objections) + tests

## ملفات مرجعية
README.md | REVIEW-REPORT.md | AGENT.md | CLAUDE.md | .windsurfrules

## قرارات مؤجلة
- توحيد ملفات تعليمات AI.
- توحيد Login.tsx مع auth/LoginPage.tsx.
- التحقق من دور server/ مقابل Django.
>>>>>>> backup/wip-objections-2026-10-15
