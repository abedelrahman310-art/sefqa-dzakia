import React from 'react';
import { useI18n } from '@/i18n';
import {
  Scale,
  FileCheck2,
  ShieldCheck,
  Lock,
} from 'lucide-react';

export function V2Legal() {
  const { t, dir } = useI18n();

  const pillars = [
    {
      n: '01',
      title: t('landing.legal.r1_title'),
      desc: t('landing.legal.r1_desc'),
      icon: Scale,
      topStripe: 'bg-gradient-to-l from-[#2563EB] to-[#38BDF8]',
      numColor: 'text-[#2563EB]',
      iconBg: 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]',
    },
    {
      n: '02',
      title: t('landing.legal.r2_title'),
      desc: t('landing.legal.r2_desc'),
      icon: FileCheck2,
      topStripe: 'bg-gradient-to-l from-[#059669] to-[#34D399]',
      numColor: 'text-[#059669]',
      iconBg: 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]',
    },
    {
      n: '03',
      title: t('landing.legal.r3_title'),
      desc: t('landing.legal.r3_desc'),
      icon: ShieldCheck,
      topStripe: 'bg-gradient-to-l from-[#6366F1] to-[#A855F7]',
      numColor: 'text-[#6366F1]',
      iconBg: 'bg-[#EEF2FF] text-[#6366F1] border border-[#C7D2FE]',
    },
    {
      n: '04',
      title: t('landing.legal.r4_title'),
      desc: t('landing.legal.r4_desc'),
      icon: Lock,
      topStripe: 'bg-gradient-to-l from-[#0D9488] to-[#06B6D4]',
      numColor: 'text-[#0D9488]',
      iconBg: 'bg-[#F0FDFA] text-[#0D9488] border border-[#99F6E4]',
    },
  ];

  const flow = [
    t('landing.legal.flow_law'),
    t('landing.legal.flow_proc'),
    t('landing.legal.flow_digit'),
    t('landing.legal.flow_trace'),
    t('landing.legal.flow_audit'),
  ];

  return (
    <section className="bg-white py-10 md:py-16 text-[#0B1F3A]" id="legal" dir={dir}>
      <span id="v2-legal" className="sr-only" aria-hidden="true" />
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8">

        {/* ══════════════════════════════════════════════════════════════════
            1. رأس القسم (Header)
            - شارة الشرعية المؤسسية باللون الأخضر الفاتح (Mint Green)
            - عنوان رئيسي بارز وسميك بلون كحلي داكن
            - نص فرعي أنيق بلون رمادي
            ══════════════════════════════════════════════════════════════════ */}
        <header className="text-center max-w-3xl mx-auto mb-12 flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8F5F1] text-[#065F46] border border-[#A7D9CC] text-xs md:text-sm font-bold shadow-xs">
            <span className="size-2 rounded-full bg-[#10B981] inline-block shrink-0" aria-hidden="true" />
            <span>{t('landing.legal.badge')}</span>
          </div>

          <h2 className="text-2xl md:text-4xl font-extrabold text-[#0B1F3A] leading-tight m-0 text-balance">
            {t('landing.legal.title')}
          </h2>

          <p className="text-sm md:text-base leading-relaxed text-[#475569] m-0 max-w-2xl text-balance font-normal">
            {t('landing.legal.subtitle')}
          </p>
        </header>

        {/* ══════════════════════════════════════════════════════════════════
            2. شبكة الركائز الأربع (4 Cards Grid)
            - تصميم ثلاثي الأبعاد خفيف مع ظلال ناعمة وحواف دائرية أنيقة
            - رقم تسلسلي بارز في الزاوية العليا (01, 02, 03, 04)
            - أيقونة خطية حديثة وملونة تعبر عن المحتوى
            - خط ملون علوي رفيع يمنح حيوية واحترافية
            ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {pillars.map((p) => {
            const Icon = p.icon;

            return (
              <article
                key={p.n}
                className="group relative bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#CBD5E1] shadow-[0_4px_20px_-4px_rgba(11,31,58,0.06)] hover:shadow-[0_12px_28px_-6px_rgba(11,31,58,0.12)] hover:-translate-y-1 transition-all duration-300 motion-reduce:transition-none flex flex-col overflow-hidden"
              >
                {/* خط علوي ملون رفيع يتدرج لمنح طابع حيوي ومحترف */}
                <div className={`h-1.5 w-full ${p.topStripe}`} aria-hidden="true" />

                <div className="p-6 flex flex-col flex-1 justify-between gap-5">
                  {/* رأس البطاقة: الرقم التسلسلي البارز والأيقونة الخطية الملونة */}
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`text-2xl md:text-3xl font-black font-mono tracking-tight ${p.numColor}`}
                      aria-hidden="true"
                    >
                      {p.n}
                    </span>
                    <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${p.iconBg}`}>
                      <Icon className="size-6 stroke-[1.8]" aria-hidden="true" />
                    </div>
                  </div>

                  {/* المحتوى: العنوان الكحلي العريض والنص الرمادي الواضح */}
                  <div className="flex flex-col gap-2 mt-auto">
                    <h3 className="text-base md:text-lg font-extrabold text-[#0B1F3A] leading-snug m-0 group-hover:text-[#14325C] transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-xs md:text-sm text-[#475569] leading-relaxed m-0 font-normal">
                      {p.desc}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            3. مسار الامتثال المؤسسي والإشعار التوجيهي
            ══════════════════════════════════════════════════════════════════ */}
        <div className="mt-10 p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B1F3A] shrink-0">
            <span className="size-2 rounded-full bg-[#047857]" aria-hidden="true" />
            <span>{t('landing.legal.flow_title')}</span>
          </div>

          <div
            className="flex items-center flex-wrap justify-center gap-2"
            role="list"
            aria-label={t('landing.legal.flow_title')}
          >
            {flow.map((f, i) => (
              <React.Fragment key={f}>
                <span
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    i === flow.length - 1
                      ? 'bg-[#0B4348] text-white shadow-xs'
                      : 'bg-[#F1F5F9] text-[#1E293B] border border-[#CBD5E1]'
                  }`}
                  role="listitem"
                >
                  {f}
                </span>
                {i < flow.length - 1 && (
                  <span className="text-[#94A3B8] font-bold text-xs" aria-hidden="true">
                    ←
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-[#64748B] mt-5 leading-relaxed max-w-2xl mx-auto">
          {t('landing.legal.disclaimer')}
        </p>
      </div>
    </section>
  );
}

export default V2Legal;
