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
      className="w-full bg-[#ffffff] py-14 sm:py-20"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Framed Short Section Title */}
        <div className="flex flex-col items-center justify-center text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold shadow-2xs mb-2.5">
            <span className="size-2 rounded-full bg-emerald-600" />
            <span>{isAr ? 'المرجعية الدستورية والسيادية' : 'Fondements Juridiques'}</span>
          </div>
          <div className="inline-block px-5 sm:px-7 py-2 sm:py-2.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {isAr ? 'الركائز القانونية والسيادية' : 'Piliers Juridiques & Souverains'}
            </h2>
          </div>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed font-medium">
            {isAr
              ? 'صُممت منصة «صفقات ذكية» لتكون الدرع الرقمي للدولة في ترسيخ الشفافية ومكافحة البيروقراطية وتجسيد أحكام القانون 23-12.'
              : 'Safaqat Dhakia incarne les réformes législatives nationales visant à bannir la bureaucratie et sécuriser les fonds publics.'}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.num}
                className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-emerald-400 hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-black font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                      {pillar.num}
                    </span>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                      <Icon className="size-5 text-emerald-700" />
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 leading-snug">
                    {pillar.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default V3GovernanceSection;
