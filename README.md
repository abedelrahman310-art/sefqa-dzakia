# صفقات ذكية

منصة GovTech + LegalTech + AI لتسيير دورة حياة الصفقات العمومية في الجزائر.

## Quick start

```bash
cp .env.example .env   # أضف بيانات قاعدة البيانات
pnpm install
pnpm dev               # client: http://localhost:5173 | server: http://localhost:4000
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | يشغّل الخادم والعميل معًا |
| `pnpm build` | يبني الخادم والعميل للإنتاج |
| `pnpm start` | يشغّل الخادم المبني (بعد `pnpm build`) |
| `pnpm typecheck` | تحقق من أنواع TypeScript |
| `pnpm lint` | تشغيل ESLint |
| `pnpm db:generate` | توليد migrations بـ Drizzle Kit |

## Notes

### `shared/components.json` — stub workaround
The file `shared/components.json` is **not** a real shadcn/ui configuration.  
It exists solely as a workaround for a bug in `shadcn@4.21` where the CLI scans
all pnpm workspace packages for `components.json` and aborts if one is missing,
even when you only want to add components to `client/`.  
Do **not** use it to add components — always run `pnpm dlx shadcn@latest add <component>`
from inside the `client/` directory.

## Rules

See [`.agents/rules/safaqat-rules.md`](.agents/rules/safaqat-rules.md).
