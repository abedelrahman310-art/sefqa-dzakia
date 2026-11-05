import React from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import { V3QrCodeCard } from './V3QrCodeCard';
import {
  Scale,
  FileText,
  Lock,
  Database,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface V3ComplianceTrustSectionProps {
  qrSlot?: React.ReactNode;
}

/* ─── بداية القسم 4: الامتثال والثقة ─── */
export const V3ComplianceTrustSection: React.FC<V3ComplianceTrustSectionProps> = ({ qrSlot }) => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const standards = [
    {
      id: 'law-23-12',
      title: isAr ? 'الالتزام بالقانون رقم 23-12' : 'Conformité à la Loi 23-12',
      tag: isAr ? 'القواعد العامة' : 'Règles Générales',
      desc: isAr
        ? 'التطبيق الدقيق للمبادئ الأساسية للصفقات العمومية: حرية الوصول، المساواة في المعاملة، شفافية الإجراءات، والرقمنة ومكافحة الفساد.'
        : 'Application rigoureuse des principes fondamentaux: liberté d’accès, égalité de traitement, transparence et numérisation.',
      icon: Scale,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    },
    {
      id: 'decree-15-247',
      title: isAr ? 'تنظيم الصفقات وفق المرسوم الرئاسي 15-247' : 'Réglementation selon le Décret 15-247',
      tag: isAr ? 'الإجراءات التنظيمية' : 'Cadre Réglementaire',
      desc: isAr
        ? 'احترام الشروط التنظيمية لكفالات التعهد وحسن التنفيذ وجلسات فتح الأظرفة العلنية وآجال نشر المنح المؤقت والطعون.'
        : 'Respect des conditions relatives aux cautions bancaires, commissions d’ouverture publiques et délais légaux des recours.',
      icon: FileText,
      color: 'text-teal-700 bg-teal-50 border-teal-100',
    },
    {
      id: 'data-protection',
      title: isAr ? 'حماية بيانات العروض والأظرفة الرقمية' : 'Protection des Données et Plis Numériques',
      tag: isAr ? 'حماية البيانات والخصوصية' : 'Protection des Données',
      desc: isAr
        ? 'تشفير تام بـ SHA-256 وأقفال زمنية تمنع كشف الأسعار المالية قبل تاريخ وساعة جلسة فتح الأظرفة الرسمية.'
        : 'Chiffrement SHA-256 et verrou temporel interdisant la révélation des prix avant la séance officielle d’ouverture.',
      icon: Lock,
      color: 'text-blue-700 bg-blue-50 border-blue-100',
    },
    {
      id: 'audit-log',
      title: isAr ? 'سجل تدقيق آمن للعمليات' : 'Journal d’Audit Sécurisé des Opérations',
      tag: isAr ? 'حجية رقمية' : 'Force Probante',
      desc: isAr
        ? 'مسار تدقيق رقمي متسلسل وآمن يوثق كل توقيع وإيداع وتعديل لضمان الموثوقية الرقابية والشفافية المؤسسية.'
        : 'Piste d’audit numérique continue et sécurisée documentant chaque validation et dépôt pour la conformité réglementaire.',
      icon: Database,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    },
  ];

  return (
    <section
      id="compliance"
      dir={dir}
      className="relative w-full bg-[#f8fafc] py-16 sm:py-20 px-4 sm:px-6 overflow-hidden"
    >
      <div className="relative max-w-[1200px] mx-auto">
        {/* رأس القسم: مؤطر وقصير وخالي تماماً من الفواصل والنقاط في العنوان الكبير */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-bold shadow-2xs mb-4">
            <ShieldCheck className="size-3.5 text-[#006233]" strokeWidth={1.75} />
            <span>{isAr ? 'الركائز السيادية والتشريعية' : 'Piliers Réglementaires'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug">
            {isAr ? 'الامتثال والثقة المؤسسية' : 'Conformité et Confiance Institutionnelle'}
          </h2>

          <p className="mt-3.5 text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            {isAr
              ? 'ضمانات تشريعية وأمنية صارمة تضمن سلامة الأموال العمومية ونزاهة كافة العمليات التعاقدية'
              : 'Garanties juridiques et de cybersécurité assurant l’intégrité des deniers publics et des transactions contractuelles'}
          </p>
        </div>

        {/* شبكة البطاقات الأربع الأساسية للامتثال */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7 mb-8">
          {standards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="group bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className={`size-11 rounded-xl border flex items-center justify-center ${item.color} shadow-2xs`}>
                      <Icon className="size-5" strokeWidth={1.75} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 leading-snug group-hover:text-[#006233] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>{isAr ? 'مُعتمد ومُطابق' : 'Conforme et certifié'}</span>
                  <div className="size-1.5 rounded-full bg-emerald-500" />
                </div>
              </div>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            بطاقة مشروع رقمي جزائري مبتكر وبجانبها بطاقة رمز QR للدخول السريع
            تصميم فاتح ونظيف ومحتوى وطني مؤسسي دقيق
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl mx-auto items-stretch">
          {/* بطاقة مشروع رقمي جزائري مبتكر */}
          <div className="lg:col-span-2 relative bg-white rounded-2xl border border-emerald-200/80 p-6 sm:p-8 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-center">
            {/* لمسة زليج هندسية خفيفة جداً في زاوية البطاقة */}
            <div
              className="absolute top-0 right-0 w-36 h-36 pointer-events-none opacity-[0.035]"
              style={{
                backgroundImage: `radial-gradient(#006233 1px, transparent 1px)`,
                backgroundSize: '12px 12px',
              }}
            />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
              <div className="size-12 rounded-2xl bg-emerald-50 border border-emerald-200/90 flex items-center justify-center text-[#006233] shrink-0 shadow-2xs">
                <Sparkles className="size-6" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5">
                  {isAr ? 'مشروع رقمي جزائري مبتكر' : 'Projet Numérique Algérien Innovant'}
                </h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  {isAr
                    ? 'منصة رقمية جزائرية تدعم رقمنة الصفقات العمومية والشفافية والامتثال'
                    : 'Plateforme numérique algérienne soutenant la dématérialisation des marchés publics, la transparence et la conformité'}
                </p>
              </div>
            </div>
          </div>

          {/* بطاقة رمز QR للدخول المباشر إلى المنصة */}
          <div className="lg:col-span-1 flex">
            {qrSlot || <V3QrCodeCard className="w-full h-full" />}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            الزر الرئيسي الأوحد للدخول إلى المنصة (Single Main CTA)
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="mt-12 sm:mt-14 flex flex-col items-center justify-center text-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl bg-[#006233] hover:bg-[#004d28] text-white text-base sm:text-lg font-bold shadow-md hover:shadow-lg transition-all duration-200 group"
          >
            <span>{isAr ? 'الدخول إلى المنصة' : 'Accéder à la Plateforme'}</span>
            <ArrowIcon className="size-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" strokeWidth={2} />
          </Link>
          <span className="text-xs text-slate-400 font-medium mt-3">
            {isAr ? 'بوابة وطنية آمنة تضمن التحقق الرقمي المعتمد' : 'Portail national sécurisé avec vérification numérique certifiée'}
          </span>
        </div>
      </div>
    </section>
  );
};
/* ─── نهاية القسم 4: الامتثال والثقة ─── */

export default V3ComplianceTrustSection;
