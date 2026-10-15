# Safaqat — Team Operating System

## الفريق
- **Architect (ChatGPT):** المواصفات، المعمارية، المراجعة، القرارات.
- **Antigravity:** التنفيذ داخل IDE — واجهة، ميزات، refactor.
- **OpenCode:** الأتمتة الطرفية — اختبارات، build، git، سكربتات.

## المستودع
- المسار: D:\dev\safaqat
- الفرع الرئيسي: master
- الفرع النشط: phase-2-seeding-auth
- package manager: pnpm@8.15.5
- node: >=24

## الأوامر المعتمدة
- install:   pnpm install
- dev:       pnpm dev
- build:     pnpm build
- lint:      pnpm lint
- typecheck: pnpm typecheck
- test:      pnpm test
- db-up:     docker compose up -d db
- migrate:   docker compose exec backend python manage.py migrate

## قواعد صارمة
1. اقرأ docs/CONTEXT.md و docs/TASKS.md قبل أي عمل.
2. لا تعمل مباشرة على master أو phase-2-seeding-auth.
3. مهمة واحدة = فرع واحد = commit واضح.
4. لا تعدل ملفات خارج نطاق مهمتك.
5. ممنوع رفع .env إلى Git.
6. عند الانتهاء: حدّث docs/TASKS.md واكتب Handoff.

## صيغة Handoff
- done: ماذا أنجزت
- files: الملفات المتأثرة
- commands: ما شغّلته
- blockers: ما تعطّل
- next: الخطوة التالية
