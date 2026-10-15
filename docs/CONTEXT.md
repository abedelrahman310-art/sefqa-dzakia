# Safaqat — Project Context

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
- backup/operator-portal-before-closure
- feature/operator-portal-closure
- feature/technical-compliance-agent

## ميزة قيد التنفيذ
Objections — backend (apps/contracts) + client (features/objections) + tests

## ملفات مرجعية
README.md | REVIEW-REPORT.md | AGENT.md | CLAUDE.md | .windsurfrules

## قرارات مؤجلة
- توحيد ملفات تعليمات AI.
- توحيد Login.tsx مع auth/LoginPage.tsx.
- التحقق من دور server/ مقابل Django.
