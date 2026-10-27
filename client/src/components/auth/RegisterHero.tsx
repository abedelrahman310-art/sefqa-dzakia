import { Logo } from '@/components/ui/Logo';
import { Eye, FileText, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/i18n';


export function RegisterHero() {
  const { dir } = useI18n();

  return (
    <aside
      className="relative flex flex-col justify-between w-full h-auto lg:h-full p-6 sm:p-8 lg:p-12 text-white overflow-hidden select-none shrink-0"
      style={{
        background: 'linear-gradient(135deg, #071927 0%, #0A2540 55%, #13395c 100%)',
      }}
      dir={dir}
    >
      {/* Background Monument & Bay Image */}
      <div
        className="absolute inset-0 bg-cover pointer-events-none"
        style={{
          backgroundImage: "url('/images/maqam-echahid.jpg')",
          backgroundPosition: 'left 28%',
          opacity: 0.62,
        }}
        aria-hidden="true"
      />

      {/* Directional Overlay: Transparent on Monument side, Deep Navy on Text side */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to left, rgba(10, 37, 64, 0.94) 0%, rgba(10, 37, 64, 0.82) 45%, rgba(7, 25, 39, 0.35) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Top Islamic Geometric Pattern Watermark */}
      <svg
        className="absolute -top-12 -start-12 w-72 h-72 opacity-20 pointer-events-none"
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M100 0 L122 78 L200 100 L122 122 L100 200 L78 122 L0 100 L78 78 Z"
          stroke="#7BA7D0"
          strokeWidth="1.5"
        />
        <circle cx="100" cy="100" r="45" stroke="#7BA7D0" strokeWidth="1" />
        <rect
          x="68"
          y="68"
          width="64"
          height="64"
          stroke="#7BA7D0"
          strokeWidth="1"
          transform="rotate(45 100 100)"
        />
      </svg>

      {/* ═══ Top: Brand & Logo ═══ */}
      <div className="relative z-10 flex items-center gap-3">
        {/* Unified isometric logo mark */}
        <div className="relative w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center shrink-0">
          <Logo size="100%" className="w-full h-full" />
        </div>

        <div className="flex flex-col">
          <span className="text-lg lg:text-xl font-black tracking-tight text-white leading-tight font-display">
            صفقات ذكية
          </span>
          <span className="text-[10px] lg:text-[11px] font-medium text-cyan-200/90 tracking-wide">
            منصة إدارة الصفقات العمومية
          </span>
        </div>
      </div>

      {/* ═══ Middle: Main Heading, Subtitle & 3 Feature Points ═══ */}
      <div className="relative z-10 my-auto py-3 lg:py-6 space-y-4 lg:space-y-6 max-w-xl text-start">
        <div className="space-y-2 lg:space-y-3">
          <h1 className="text-xl sm:text-2xl lg:text-[32px] font-black text-white leading-snug lg:leading-[1.3] font-display">
            من أجل صفقات عمومية
            <br />
            أكثر شفافية وفعالية
          </h1>
          <p className="hidden lg:block text-xs sm:text-sm text-slate-200/90 leading-relaxed font-normal max-w-md">
            منصة رقمية متكاملة لإدارة الصفقات العمومية وفق القوانين الجزائرية،
            تعزز الشفافية، وتُسهّل الإجراءات لجميع المتدخلين.
          </p>
        </div>

        {/* 3 Distinct Feature Items with Colored Badges (Desktop only) */}
        <div className="hidden lg:block space-y-4 pt-2">
          {/* Item 1: Teal Eye */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#008080] flex items-center justify-center shrink-0 shadow-md text-white">
              <Eye className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                شفافية أكبر
              </h3>
              <p className="text-xs text-slate-300/90 font-medium mt-0.5">
                في كل مراحل الصفقة
              </p>
            </div>
          </div>

          {/* Item 2: Blue Document */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#1d4ed8] flex items-center justify-center shrink-0 shadow-md text-white">
              <FileText className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                إجراءات مبسطة
              </h3>
              <p className="text-xs text-slate-300/90 font-medium mt-0.5">
                من الإعلان إلى الإسناد
              </p>
            </div>
          </div>

          {/* Item 3: Purple Shield */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#4f46e5] flex items-center justify-center shrink-0 shadow-md text-white">
              <ShieldCheck className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                متابعة دقيقة
              </h3>
              <p className="text-xs text-slate-300/90 font-medium mt-0.5">
                لجميع العمليات والآجال
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Bottom: Curved Wave with Vision Slogan (Desktop only) ═══ */}
      <div className="hidden lg:flex relative z-10 pt-4 border-t border-white/10 items-center justify-start text-xs text-slate-300/90">
        <span>الصفقات العمومية .. رافعة للتنمية المستدامة</span>
      </div>
    </aside>
  );
}

export default RegisterHero;
