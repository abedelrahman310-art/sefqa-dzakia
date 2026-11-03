import React from 'react';
import { useI18n } from '@/i18n';
import { ShieldCheck, Scale, Lock, FileCheck, Database, Award } from 'lucide-react';

export const GovernanceComplianceSection: React.FC = () => {
  const { lang } = useI18n();
  const isAr = lang === 'ar';

  const pillars = [
    {
      icon: Scale,
      title: isAr ? 'القانون 23-12 لتنظيم الصفقات' : 'Loi 23-12 des Marchés Publics',
      desc: isAr
        ? 'الالتزام التام بالنصوص التشريعية الوطنية، وضمان حرية الوصول، المساواة في المعاملة، وشفافية الإجراءات في كافة مراحل الإسناد.'
        : 'Respect strict des principes de liberté d’accès à la commande, d’égalité de traitement des candidats et de transparence.',
    },
    {
      icon: FileCheck,
      title: isAr ? 'المادة 67: التجريد المادي الكامل' : 'Article 67 : Zéro Papier',
      desc: isAr
        ? 'الإلغاء القانوني التدريجي للملفات الورقية، واعتماد التبادل الإلكتروني الموثق والأرشفة الرقمية الآمنة لجميع المراسلات والمحاضر.'
        : 'Consécration légale des échanges 100% numériques et de l’archivage sécurisé des offres et procès-verbaux.',
    },
    {
      icon: Lock,
      title: isAr ? 'حماية المعطيات (القانون 18-07)' : 'Protection des Données (Loi 18-07)',
      desc: isAr
        ? 'حماية مشددة لبيانات المتعهدين والبيانات المالية ذات الطابع الشخصي والتجاري في بيئة سحابية وطنية داخل التراب الجزائري.'
        : 'Protection rigoureuse des données à caractère personnel et commercial sur des serveurs hébergés en Algérie.',
    },
    {
      icon: Database,
      title: isAr ? 'سجل التدقيق الجنائي غير القابل للتعديل' : 'Journal d’Audit SHA-256',
      desc: isAr
        ? 'توثيق كل حركة أو إيداع أو تعديل بختم زمني مشفر بـ SHA-256 لمنع التلاعب وتمكين الهيئات الرقابية ومجلس الصفقات من التفتيش.'
        : 'Traçabilité absolue de chaque transaction avec scellé temporel infalsifiable pour les corps d’inspection de l’État.',
    },
    {
      icon: Award,
      title: isAr ? 'المرسوم الرئاسي 15-247' : 'Décret Présidentiel 15-247',
      desc: isAr
        ? 'تطبيق القواعد الإجرائية المنظمة لتنظيم لجان الصفقات، حساب التأشيرات، حدود الملاحق، والرقابة القبلية والبعدية.'
        : 'Mise en œuvre des règles régissant les commissions de marchés, visas préalables et seuils stricts d’avenants.',
    },
    {
      icon: ShieldCheck,
      title: isAr ? 'حماية المال العام وتكافؤ الفرص' : 'Protection des Deniers Publics',
      desc: isAr
        ? 'حظر المحاباة والمنافسة الصورية والتواطؤ السعري، بما يضمن الفعالية الاقتصادية والترشيد الأمثل للنفقات العمومية.'
        : 'Élimination des ententes illicites et des pratiques anti-concurrentielles pour optimiser la dépense publique.',
    },
  ];

  return (
    <section id="governance" className="py-16 sm:py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ترويسة القسم */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold mb-4 border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'المرجعية الدستورية والسيادية' : 'Fondements Juridiques'}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-cairo mb-4">
            {isAr ? 'منظومة مبنية على الشرعية والامتثال الصارم' : 'Une Plateforme Fondée sur la Légalité et la Souveraineté'}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-medium">
            {isAr
              ? 'صُممت منصة «صفقات ذكية» لتكون الدرع الرقمي للدولة في مكافحة التلاعب والبيروقراطية وتجسيد أحدث الإصلاحات التشريعية للصفقات العمومية.'
              : 'Safaqat Dhakia incarne les réformes législatives nationales visant à bannir la bureaucratie et sécuriser les fonds publics.'}
          </p>
        </div>

        {/* شبكة الركائز الست */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200/90 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-emerald-700 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold font-mono text-slate-400">
                    0{idx + 1}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-cairo mb-2 group-hover:text-emerald-800 transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default GovernanceComplianceSection;
