/* ============================================================
   SAFAQAT — فواصل الأقسام (Section Divider)
   خطان قصيران أخضر (#167354) وأحمر (#C83A42) في المنتصف
   الفاصل زخرفي فقط، بمساحة تنفس واسعة فوقه وتحته
   زخرفي فقط (aria-hidden="true")
   ============================================================ */
export function SectionDivider() {
  return (
    <div className="w-full my-8 md:my-12 flex justify-center select-none" aria-hidden="true">
      <div className="flex items-center gap-1.5">
        <span className="h-[2px] w-10 sm:w-14 rounded-full bg-[#C83A42]/85" />
        <span className="h-[2px] w-10 sm:w-14 rounded-full bg-[#167354]" />
      </div>
    </div>
  );
}

/* ============================================================
   SAFAQAT — رأس تحريري للأقسام (Editorial Section Header)
   - Eyebrow صغير بخطين مؤسسيين
   - عنوان كبير بمساحة تنفس واسعة، بدون بطاقة
   - خيط فاصل قصير بالأخضر والأحمر
   ============================================================ */
interface SectionHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({ badge, title, subtitle, className = '' }: SectionHeaderProps) {
  return (
    <header className={`text-center max-w-4xl mx-auto mb-10 md:mb-14 flex flex-col items-center px-2 sm:px-4 ${className}`}>
      {badge && (
        <div className="inline-flex items-center gap-3 text-[11px] sm:text-xs font-bold text-[#167354] mb-4 sm:mb-5">
          <span className="h-px w-6 sm:w-8 bg-[#C83A42]/70" aria-hidden="true" />
          <span className="tracking-[0.03em]">{badge}</span>
          <span className="h-px w-6 sm:w-8 bg-[#167354]/70" aria-hidden="true" />
        </div>
      )}

      <h2 className="text-[26px] sm:text-[34px] md:text-[42px] font-extrabold text-[#24352E] leading-[1.3] sm:leading-[1.25] m-0 text-balance tracking-[-0.02em] break-words max-w-3xl">
        {title}
      </h2>

      <span className="inline-flex items-center gap-1.5 mt-5" aria-hidden="true">
        <span className="h-1 w-6 rounded-full bg-[#167354]" />
        <span className="h-1 w-6 rounded-full bg-[#C83A42]" />
      </span>

      {subtitle && (
        <p className="text-sm sm:text-base md:text-[17px] text-[#59665F] leading-[1.9] m-0 max-w-2xl text-balance font-normal mt-4">
          {subtitle}
        </p>
      )}
    </header>
  );
}
