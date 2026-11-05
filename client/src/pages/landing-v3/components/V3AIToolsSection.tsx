import React from 'react';
import { useI18n } from '@/i18n';
import {
  Sparkles,
  BookOpenCheck,
  ShieldCheck,
  ScanSearch,
  Bot,
  CheckCircle2,
} from 'lucide-react';

/* ─── بداية القسم 3: أدوات الذكاء الاصطناعي ─── */
export const V3AIToolsSection: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';

  const tools = [
    {
      id: 'matcher',
      title: isAr ? 'مطابقة الفرص الذكية' : 'Correspondance Intelligente des Opportunités',
      role: isAr ? 'مساعد المتعامل الاقتصادي' : 'Assistant Opérateur',
      desc: isAr
        ? 'تحليل فوري لمجال تخصص المؤسسة ورموز السجل التجاري وربطها التلقائي بالصفقات الملائمة لزيادة فرص الفوز بالعطاءات.'
        : 'Analyse en temps réel de votre registre du commerce pour identifier automatiquement les marchés les plus pertinents.',
      icon: Sparkles,
      accent: 'border-emerald-200/90 hover:border-emerald-500',
      iconBox: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    },
    {
      id: 'specs-analyzer',
      title: isAr ? 'تحليل دفاتر الشروط' : 'Analyse des Cahiers des Charges',
      role: isAr ? 'مساعد قراءة الدفاتر' : 'Synthèse Réglementaire',
      desc: isAr
        ? 'قراءة واستخلاص المعايير الفنية والمالية والجدول الزمني من دفاتر الشروط المعقدة وتقديم ملخص تنفيذي دقيق.'
        : 'Extraction automatique des critères techniques, financiers et des délais contractuels en une synthèse claire.',
      icon: BookOpenCheck,
      accent: 'border-teal-200/90 hover:border-teal-500',
      iconBox: 'text-teal-700 bg-teal-50 border-teal-100',
    },
    {
      id: 'compliance-shield',
      title: isAr ? 'الدرع الامتثالي قبل الإيداع' : 'Bouclier de Conformité Préalable',
      role: isAr ? 'مساعد التدقيق الشكلي' : 'Vérification Préventive',
      desc: isAr
        ? 'فحص قبلي شامل لملف الترشح والشهادات الجبائية وشبه الجبائية لتدارك الأخطاء والنواقص وتجنب الإقصاء الإداري.'
        : 'Contrôle préventif des pièces obligatoires (CNAS, CASNOS, impôts, caution) pour éviter tout rejet administratif.',
      icon: ShieldCheck,
      accent: 'border-blue-200/90 hover:border-blue-500',
      iconBox: 'text-blue-700 bg-blue-50 border-blue-100',
    },
    {
      id: 'anti-collusion',
      title: isAr ? 'رادار مكافحة التواطؤ عين الصقر' : 'Radar Anti-Collusion Œil de Faucon',
      role: isAr ? 'مساعد الرقابة والنزاهة' : 'Support Analytique',
      desc: isAr
        ? 'تحليل مؤشرات المخاطر ودعم رصد السلوكيات المشبوهة كأداة تحليلية واستشارية مساندة لأجهزة الرقابة، دون إصدار أي قرار قانوني.'
        : 'Analyse des indicateurs de risque et appui à la détection des comportements suspects, en tant qu’outil consultatif sans décision juridique.',
      icon: ScanSearch,
      accent: 'border-amber-200/90 hover:border-amber-500',
      iconBox: 'text-amber-700 bg-amber-50 border-amber-200',
    },
  ];

  return (
    <section
      id="ai-tools"
      dir={dir}
      className="relative w-full bg-[#ffffff] py-16 sm:py-20 px-4 sm:px-6 overflow-hidden"
    >
      <div className="relative max-w-[1200px] mx-auto">
        {/* رأس القسم: مؤطر وقصير وخالي تماماً من الفواصل والنقاط في العنوان الكبير */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-200 bg-emerald-50/90 text-emerald-900 text-xs sm:text-sm font-bold shadow-2xs mb-4">
            <Bot className="size-3.5 text-[#006233]" strokeWidth={1.75} />
            <span>{isAr ? 'ذكاء اصطناعي مساعد' : 'Intelligence Artificielle Assistive'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug">
            {isAr ? 'أدوات الذكاء الاصطناعي المساعد' : 'Outils d’Intelligence Artificielle Assistive'}
          </h2>

          <p className="mt-3.5 text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            {isAr
              ? 'أدوات خوارزمية ذكية لمساندة المتعاملين والمصالح المتعاقدة وأجهزة الرقابة مع إبقاء القرار البشري سيد الموقف.'
              : 'Des technologies avancées pour assister les acteurs publics et privés sans jamais se substituer à la décision humaine.'}
          </p>
        </div>

        {/* شبكة البطاقات الأربع المتوازنة: 2 في الصف الأول و2 في الصف الثاني */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className={`group bg-white rounded-2xl border ${tool.accent} p-7 sm:p-8 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className={`size-12 rounded-xl border flex items-center justify-center ${tool.iconBox} shadow-2xs`}>
                      <Icon className="size-6" strokeWidth={1.75} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="size-3 text-emerald-600" />
                        <span>{tool.role}</span>
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 leading-snug group-hover:text-[#006233] transition-colors">
                    {tool.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {tool.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50/70 border border-emerald-100 px-2 py-0.5 rounded-md text-[11px] font-bold">
                    {isAr ? 'دعم استشاري ذكي' : 'Support consultatif'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isAr ? 'القانون 23-12' : 'Loi 23-12'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* تنبيه أخلاقي ورسمي في أسفل القسم */}
        <div className="mt-10 max-w-2xl mx-auto text-center px-4 py-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-600 font-medium">
          {isAr
            ? 'الذكاء الاصطناعي في صفقات ذكية يقدم تحليلات استشارية مساعدة، ويبقى الإنسان وحده المسؤول عن القرار النهائي.'
            : 'L’intelligence artificielle fournit des analyses d’aide à la décision; l’humain demeure seul responsable de la décision finale.'}
        </div>
      </div>
    </section>
  );
};
/* ─── نهاية القسم 3: أدوات الذكاء الاصطناعي ─── */

export default V3AIToolsSection;
