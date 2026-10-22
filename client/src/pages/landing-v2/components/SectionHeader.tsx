import React from 'react';

/* ============================================================
   SAFAQAT — فواصل الأقسام (Section Divider)
   الخط العلوي أحمر (#C83A42)، الخط السفلي أخضر (#167354)
   سماكة 2px لكل خط، المسافة 4px، مساحة ملائمة فوق وتحت الفاصل
   زخرفي فقط (aria-hidden="true")
   ============================================================ */
export function SectionDivider() {
  return (
    <div className="w-full my-10 md:my-14 select-none" aria-hidden="true">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="w-full flex flex-col gap-[4px]">
          <div className="w-full h-[2px] bg-[#C83A42] rounded-full" />
          <div className="w-full h-[2px] bg-[#167354] rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SAFAQAT — بطاقة عنوان القسم (Section Header Card)
   - داخل بطاقة بيضاء خفيفة
   - حافة علوية خضراء (#167354) وسفلية حمراء (#C83A42) رفيعتان
   - زوايا 10–12px
   - العنوان ~26px في المنتصف
   - الوصف خارج بطاقة العنوان
   ============================================================ */
interface SectionHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({ badge, title, subtitle, className = '' }: SectionHeaderProps) {
  return (
    <header className={`text-center max-w-3xl mx-auto mb-10 md:mb-12 flex flex-col items-center gap-3 px-4 ${className}`}>
      {badge && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EDF4EE] text-[#167354] border border-[#CDE1D3] text-xs font-bold shadow-2xs">
          <span className="size-2 rounded-full bg-[#167354] inline-block shrink-0" aria-hidden="true" />
          <span>{badge}</span>
        </div>
      )}

      {/* بطاقة العنوان البيضاء ذات الحافة العلوية الخضراء والحافة السفلية الحمراء */}
      <div className="inline-block max-w-full bg-white border-t-[2.5px] border-t-[#167354] border-b-[2.5px] border-b-[#C83A42] border-x border-x-[#E3E7E2] rounded-[11px] px-4 sm:px-8 py-3.5 shadow-[0_2px_8px_-2px_rgba(36,53,46,0.04)]">
        <h2 className="text-[19px] sm:text-[23px] md:text-[26px] font-extrabold text-[#24352E] leading-snug m-0 text-balance tracking-tight break-words">
          {title}
        </h2>
      </div>

      {subtitle && (
        <p className="text-[14px] sm:text-[15px] md:text-[16px] text-[#59665F] leading-relaxed m-0 max-w-2xl text-balance font-normal mt-1">
          {subtitle}
        </p>
      )}
    </header>
  );
}
