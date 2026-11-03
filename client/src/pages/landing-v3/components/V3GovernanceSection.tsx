import React from 'react';
import { useI18n } from '@/i18n';
import {
  Scale,
  FileCheck2,
  Lock,
  Database,
  Award,
  ShieldCheck
} from 'lucide-react';

export const V3GovernanceSection: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';

  const pillars = [
    {
      num: '01',
      icon: Scale,
      title: isAr ? 'القانون 23-12 لتنظيم الصفقات' : 'Loi 23-12 des Marchés Publics',
      desc: isAr
        ? 'الالتزام التام بالنصوص التشريعية الوطنية، وضمان حرية الوصول، المساواة في المعاملة، وشفافية الإجراءات في كافة مراحل الإسناد.'
        : 'Respect strict des principes de liberté d’accès à la commande, d’égalité de traitement des candidats et de transparence.',
    },
    {
      num: '02',
      icon: FileCheck2,
      title: isAr ? 'المادة 67 والقانون 15-04 للتوقيع الإلكتروني' : 'Art. 67 & Loi 15-04 : Signature Légale',
      desc: isAr
        ? 'التجريد المادي الكامل وحجية الإثبات القانوني عبر التوقيع الإلكتروني المؤهل (المحفوظ بختم زمني مشفر) للأظرفة والعقود.'
        : 'Dématérialisation intégrale et pleine force probante des signatures et scellés électroniques horodatés selon la Loi 15-04.',
    },
    {
      num: '03',
      icon: Lock,
      title: isAr ? 'حماية المعطيات (القانون 18-07)' : 'Protection des Données (Loi 18-07)',
      desc: isAr
        ? 'حماية مشددة لبيانات المتعهدين والبيانات المالية ذات الطابع الشخصي والتجاري في بيئة سحابية وطنية داخل التراب الجزائري.'
        : 'Protection rigoureuse des données à caractère personnel et commercial sur des serveurs souverains en Algérie.',
    },
    {
      num: '04',
      icon: Database,
      title: isAr ? 'سجل التدقيق الجنائي غير القابل للتعديل' : 'Journal d’Audit SHA-256',
      desc: isAr
        ? 'توثيق كل حركة أو إيداع أو تعديل بختم زمني مشفر بـ SHA-256 لمنع التلاعب وتمكين الهيئات الرقابية ومجلس الصفقات من التفتيش.'
        : 'Traçabilité absolue de chaque transaction avec scellé temporel infalsifiable pour les corps d’inspection de l’État.',
    },
    {
      num: '05',
      icon: Award,
      title: isAr ? 'المرسوم الرئاسي 15-247' : 'Décret Présidentiel 15-247',
      desc: isAr
        ? 'تطبيق القواعد الإجرائية المنظمة لتنظيم لجان الصفقات، حساب التأشيرات، حدود الملاحق، والرقابة القبلية والبعدية.'
        : 'Mise en œuvre des règles régissant les commissions de marchés, visas préalables et seuils stricts d’avenants.',
    },
    {
      num: '06',
      icon: ShieldCheck,
      title: isAr ? 'حماية المال العام وتكافؤ الفرص' : 'Protection des Deniers Publics',
      desc: isAr
        ? 'حظر المحاباة والمنافسة الصورية والتواطؤ السعري، بما يضمن الفعالية الاقتصادية والترشيد الأمثل للنفقات العمومية.'
        : 'Élimination des ententes illicites et des pratiques anti-concurrentielles pour optimiser la dépense publique.',
    },
  ];

  return (
    <section
      id="compliance"
      dir={dir}
      className="w-full bg-[#ffffff] py-20"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Section Heading */}
        <div className="max-w-[720px] mx-auto text-center space-y-3 mb-16">
          <p className="text-[13px] font-medium tracking-[0.1em] uppercase text-[#5a5a5a] font-mono">
            {isAr ? 'المرجعية الدستورية والسيادية' : 'FONDEMENTS JURIDIQUES ET SOUVERAINETÉ'}
          </p>
          <h2 className="text-[26px] sm:text-[40px] font-semibold text-[#080808] leading-[1.04] tracking-[-0.4px]">
            {isAr ? 'منظومة قائمة على الشرعية وحماية المال العام' : 'Une Plateforme Fondée sur la Légalité Absolue'}
          </h2>
          <p className="text-[16px] text-[#5a5a5a] leading-[1.6]">
            {isAr
              ? 'صُممت منصة «صفقات ذكية» لتكون الدرع الرقمي للدولة في ترسيخ الشفافية ومكافحة البيروقراطية وتجسيد أحدث الإصلاحات التشريعية.'
              : 'Safaqat Dhakia incarne les réformes législatives nationales visant à bannir la bureaucratie et sécuriser les fonds publics.'}
          </p>
        </div>

        {/* Feature Cards Grid (Spec: 3-column, 16px gap, 24px padding, 8px radius, 1px #d8d8d8 border) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.num}
                className="p-6 bg-[#ffffff] border border-[#d8d8d8] rounded-[8px] space-y-4 hover:border-[#146ef5] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-[4px] bg-[#f0f0f0] text-[#080808]">
                    <Icon className="size-5" />
                  </div>
                  <span className="font-mono text-[13px] text-[#5a5a5a]">
                    {pillar.num}
                  </span>
                </div>

                <h3 className="text-[16px] font-semibold text-[#080808] leading-snug">
                  {pillar.title}
                </h3>

                <p className="text-[14px] font-normal text-[#5a5a5a] leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default V3GovernanceSection;
