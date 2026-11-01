# Safaqat — Architecture Decisions

## ADR-001 — فريق وكلاء ثلاثي
التاريخ: 2026-10-15
القرار: Architect / Antigravity / OpenCode.
السبب: تشتت أدوات AI المتعددة.

## ADR-002 — الفرع الرئيسي هو master
التاريخ: 2026-10-15
ملاحظة: المشروع يستخدم master وليس main.

## ADR-003 — Backend = Django، Postgres عبر Docker
التاريخ: 2026-10-15
التفصيل: backend/ = Django، DB = Postgres 16-alpine على منفذ 5432.
