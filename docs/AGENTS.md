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

## قواعد مُحدَّثة بعد P-013 (2026-10-16)

1. مهمة واحدة = فرع واحد.
2. **commit واحد لكل مرحلة** — لا "fix" commits.
3. إذا اكتشفت خطأ: عدّل الملف ثم `git commit --amend`.
4. لا تعدّل ملفات خارج نطاق المهمة.
5. لا تستكشف SDK / docs / skills إلا إذا طُلب.
6. الأرقام في التقارير من `Measure-Object` فقط.
7. توقف بعد Handoff — انتظر تأكيد Architect.
8. لا تسأل "هل ننتقل؟" — انتظر بصمت.

