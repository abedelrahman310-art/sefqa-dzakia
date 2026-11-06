import React from 'react';
import { useI18n } from '@/i18n';
import { Eye, Activity, FileCheck2, Sparkles } from 'lucide-react';

/* ─── بداية القسم 1: لماذا صفقات ذكية؟ ─── */
export const V3WhySafaqatSection: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';

  const cards = [
    {
      id: 'transparency',
      title: isAr ? 'شفافية كاملة في الصفقات العمومية' : 'Transparence Totale dans les Marchés Publics',
      desc: isAr
        ? 'إتاحة الفرص والمنافسة العادلة لكافة المتعاملين الاقتصاديين دون تمييز، ونشر فوري لدفاتر الشروط والإعلانات ومحاضر المنح المؤقت.'
        : 'Accès équitable et ouvert pour tous les opérateurs sans discrimination, avec publication instantanée des cahiers des charges et attributions.',
      badge: isAr ? 'نزاهة معتمدة' : 'Intégrité certifiée',
      icon: Eye,
      accent: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    },
    {
      id: 'traceability',
      title: isAr ? 'تتبع رقمي لكل مرحلة' : 'Traçabilité Numérique de Chaque Étape',
      desc: isAr
        ? 'توثيق رقمي دقيق لمسار الصفقة من تقدير الحاجة الأولية حتى الإقفال المالي والاستلام النهائي، مع مسار تدقيق آمن وقابل للتتبع.'
        : 'Documentation continue du cycle du marché, de l’expression des besoins jusqu’à la réception définitive, avec un journal d’audit sécurisé et traçable.',
      badge: isAr ? 'رصد تسلسلي' : 'Suivi continu',
      icon: Activity,
      accent: 'text-teal-700 bg-teal-50 border-teal-100',
    },
    {
      id: 'compliance',
      title: isAr ? 'امتثال مبسط للقانون رقم 23-12 والمرسوم الرئاسي 15-247' : 'Conformité Simplifiée à la Loi 23-12 et Décret 15-247',
      desc: isAr
        ? 'أتمتة الإجراءات والضوابط القانونية وفق القانون رقم 23-12 والمرسوم الرئاسي 15-247، مع فحص آلي دقيق للشروط والآجال النظامية.'
        : 'Automatisation des flux réglementaires selon la loi 23-12 et le décret 15-247, avec vérification automatisée des délais et pièces obligatoires.',
      badge: isAr ? 'حماية نظامية' : 'Sécurité juridique',
      icon: FileCheck2,
      accent: 'text-[#006233] bg-emerald-50/80 border-emerald-200/60',
    },
  ];

  return (
    <section
      id="why-safaqat"
      dir={dir}
      className="relative w-full bg-transparent py-16 sm:py-20 px-4 sm:px-6 overflow-hidden"
    >
      <div className="relative max-w-[1200px] mx-auto">
        {/* رأس القسم: مؤطر وقصير وخالي تماماً من الفواصل والنقاط في العنوان الكبير */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-200/80 bg-white/80 backdrop-blur-md text-emerald-800 text-xs sm:text-sm font-bold shadow-xs mb-4">
            <Sparkles className="size-3.5 text-emerald-600" strokeWidth={1.75} />
            <span>{isAr ? 'القيمة المضافة للمنظومة' : 'Valeur Ajoutée'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug">
            {isAr ? 'لماذا صفقات ذكية' : 'Pourquoi Safaqat Dhakia'}
          </h2>

          <p className="mt-3.5 text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            {isAr
              ? 'منظومة سيادية موحدة تكرس مبادئ النزاهة وتكافؤ الفرص في إدارة الصفقات والمشتريات العمومية للدولة الجزائرية.'
              : 'Une plateforme souveraine unifiée consacrant la transparence et l’égalité des chances pour la commande publique algérienne.'}
          </p>
        </div>

        {/* شبكة البطاقات الثلاث المتساوية والأنيقة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="group relative bg-white rounded-2xl border border-slate-200/90 p-7 sm:p-8 shadow-xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* لمسة زليج هندسية خافتة جداً في زاوية البطاقة */}
                <div
                  className="absolute -bottom-6 -end-6 size-28 pointer-events-none opacity-[0.025] group-hover:opacity-[0.06] transition-opacity duration-500"
                  style={{
                    backgroundImage: `radial-gradient(#006233 1px, transparent 1px)`,
                    backgroundSize: '10px 10px',
                  }}
                />

                <div className="relative z-10">
                  {/* رأس البطاقة: الأيقونة والشارة الهادئة */}
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <div
                      className={`size-12 rounded-xl border flex items-center justify-center ${card.accent} shadow-2xs group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="size-6" strokeWidth={1.75} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full group-hover:border-emerald-200 group-hover:text-emerald-800 transition-colors">
                      {card.badge}
                    </span>
                  </div>

                  {/* عنوان البطاقة: خالي تماماً من الفواصل والنقاط */}
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 leading-snug group-hover:text-[#006233] transition-colors">
                    {card.title}
                  </h3>

                  {/* الوصف في سطرين مريحين */}
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {card.desc}
                  </p>
                </div>

                {/* مؤشر بصري خفيف أسفل البطاقة */}
                <div className="relative z-10 mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span className="inline-flex items-center gap-1.5 text-slate-500 group-hover:text-emerald-800 transition-colors">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{isAr ? 'معيار مؤسسي رسمي' : 'Norme Institutionnelle'}</span>
                  </span>
                  <div className="w-8 h-1 bg-slate-200 rounded-full group-hover:bg-[#006233] transition-all duration-300" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
/* ─── نهاية القسم 1: لماذا صفقات ذكية؟ ─── */

export default V3WhySafaqatSection;
