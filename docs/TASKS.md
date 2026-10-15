# Safaqat — Tasks Board

## Sprint 0 — التأسيس ✅
| ID    | Title                   | Owner     | Status |
|-------|-------------------------|-----------|--------|
| T-001 | تأمين WIP Objections    | OpenCode  | ✅ Done |
| T-002 | جرد + قرار Backend      | Architect | ✅ Done |
| T-003 | توحيد .env + قرارات     | Architect | ✅ Done |

## Sprint 1 — التصحيح
| ID     | Title                              | Owner       | Branch                   | Status |
|--------|------------------------------------|-------------|--------------------------|--------|
| T-004  | التحقق من build/test/lint          | OpenCode    | chore/t-004-verify       | ✅ Done |
| T-004a | منفذ Postgres قابل للتهيئة (5434)  | Architect   | -                        | ✅ Done |
| T-004b | requirements-dev.txt + Dockerfile  | OpenCode    | chore/t-004b-dev-reqs    | 🔄 In Progress |
| T-004c | إصلاح 52 خطأ lint                  | Antigravity | chore/t-004c-lint        | Todo   |
| T-005  | توحيد Login.tsx ↔ auth/LoginPage  | Antigravity | feat/t-005-unify-login   | Todo   |
| T-006  | إكمال Objections (Django + UI)     | Antigravity | feat/t-006-objections    | Todo   |

## Sprint 2 — التنظيف المعماري
| ID    | Title                          | Owner     | Status |
|-------|--------------------------------|-----------|--------|
| T-007 | نقل AI من server/ إلى Django   | Architect | Todo   |
| T-008 | حذف server/ من workspace       | OpenCode  | Todo   |
| T-009 | توحيد ملفات تعليمات AI         | Architect | Todo   |

## ملاحظات
- procure_ai_db (مشروع آخر) على 5432 — لا نلمسه.
- Safaqat على 5434 دائمًا.
- safaqat_mysql حُذفت (إرث Node/MySQL).
- T-004a: no override files, everything in docker-compose.yml
