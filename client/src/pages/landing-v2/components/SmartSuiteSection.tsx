import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import {
  ShieldAlert,
  FileCode2,
  Radar,
  Mic,
  CheckCircle,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Cpu,
  Layers,
  Award
} from 'lucide-react';

export const SmartSuiteSection: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'p1' | 'p2' | 'p3' | 'p4'>('p1');

  const pillars = [
    {
      id: 'p1',
      title: isAr ? 'درع المتعامل الاقتصادي' : 'Bouclier de l’Opérateur',
      subtitle: isAr ? 'فاحص الامتثال الاستباقي قبل الإيداع' : 'Audit pré-dépôt et conformité',
      icon: ShieldAlert,
      tag: isAr ? 'المرحلة 01' : 'Phase 01',
      summary: isAr
        ? 'فاحص ذكي لملفات الترشح والعروض المالية يمنع الإقصاء الإجرائي الشكلي عبر فحص صلاحية الوثائق والضرائب والضمان الاجتماعي وفق المادة 67 من القانون 23-12.'
        : 'Audit intelligent empêchant les rejets pour vices de forme grâce à la vérification automatisée des pièces administratives et fiscales.',
      highlights: isAr
        ? [
            'كشف الشروط الإقصائية المحتملة في العرض قبل انتهاء الآجال',
            'التأكد التلقائي من الحسابات الرياضية وجداول الأسعار الوحدوية (BPU/DQE)',
            'قفل وقائي يمنع إيداع أي وثيقة منتهية الصلاحية قبل تجديدها',
            'ختم تشفيري مالي AES-256 مع رمز تجزئة زمني لا يقبل التعديل',
          ]
        : [
            'Détection proactive des causes d’exclusion avant soumission',
            'Contrôle arithmétique rigoureux des bordereaux BPU/DQE',
            'Alerte bloquante sur les pièces administratives expirées',
            'Scellement cryptographique AES-256 inviolable',
          ],
      metricTitle: isAr ? 'دقة فحص المطابقة' : 'Précision d’audit',
      metricVal: '99.4%',
    },
    {
      id: 'p2',
      title: isAr ? 'صانع دفاتر الشروط والمصفوفة المئوية' : 'Cahier des Charges & Matrice COP',
      subtitle: isAr ? 'ضبط المعايير المحايدة وكشف العروض الشاذة' : 'Notation objective et anti-dumping',
      icon: FileCode2,
      tag: isAr ? 'المرحلة 02' : 'Phase 02',
      summary: isAr
        ? 'أدوات مساعدة للمصلحة المتعاقدة لصياغة دفاتر شروط خالية من الشروط التمييزية، مع مصفوفة تنقيط مئوية (100 نقطة) وخوارزميات كشف الأسعار المنخفضة بشكل غير طبيعي.'
        : 'Assistance à la rédaction de clauses neutres, matrice d’évaluation multicritères sur 100 points et détection des offres anormalement basses.',
      highlights: isAr
        ? [
            'مولد بنود تعاقدية ذكي مطابق للمرسوم الرئاسي 15-247',
            'مدقق لغوي وقانوني لرصد المصطلحات التمييزية الموجهة لموردين بعينهم',
            'مصفوفة تنقيط علمية موحدة للجان تقييم العروض التقنية والمالية',
            'خوارزمية حسابية ترصد العروض الشاذة أو محاولات الإغراق السعري',
          ]
        : [
            'Générateur de clauses contractuelles conformes au Décret 15-247',
            'Linter de neutralité éliminant les critères discriminatoires',
            'Barème multicritères standardisé pour les commissions de marché',
            'Détecteur automatique de dumping et d’offres insoutenables',
          ],
      metricTitle: isAr ? 'مصفوفة التقييم المعتمدة' : 'Barème légal',
      metricVal: '100 pts',
    },
    {
      id: 'p3',
      title: isAr ? 'رادار كشف التواطؤ والتنبؤ بالتعثر' : 'Radar Anti-Collusion & Risques',
      subtitle: isAr ? 'الرقابة المركزية واستباق تعثر المشاريع' : 'Surveillance centrale et délais',
      icon: Radar,
      tag: isAr ? 'المرحلة 03' : 'Phase 03',
      summary: isAr
        ? 'نواة رقابية سيادية للجمهورية تكشف شبكات التواطؤ ومخططات تدوير الصفقات عبر بصمات الشبكة، وتتنبأ بانحراف المشاريع والملاحق قبل تجاوز الحدود القانونية (10% و20%).'
        : 'Cœur de supervision nationale détectant les cartels, les offres de complaisance et prédisant les dérives budgétaires d’avenants.',
      highlights: isAr
        ? [
            'كشف تداخل البصمات الرقمية وعناوين IP بين الشركات المتنافسة في نفس الصفقة',
            'خوارزمية رصد تدوير العطاءات والاتفاقات الضمنية بين المقاولين',
            'مؤشر مخاطر زمني يقارن نسبة الإنجاز الفعلي بالآجال المنقضية للمشروع',
            'نظام إنذار مبكر عند الاقتراب من حدود الملاحق القانونية (المادتان 138-139)',
          ]
        : [
            'Détection de recoupements IP et métadonnées entre concurrents',
            'Identification des schémas d’entente et de rotation d’offres',
            'Indicateur d’avancement physique vs temps calendaire écoulé',
            'Alerte précoce sur les seuils légaux d’avenants (10% et 20%)',
          ],
      metricTitle: isAr ? 'مؤشر كشف شبهات التواطؤ' : 'Indice de suspicion',
      metricVal: '24/7 Live',
    },
    {
      id: 'p4',
      title: isAr ? 'الختم الميداني والمساعد الصوتي' : 'Sceau Terrain GPS & Vocal',
      subtitle: isAr ? 'توثيق المعاينات بالأقمار الصناعية والإملاء الجزائري' : 'Géolocalisation & Copilote vocal',
      icon: Mic,
      tag: isAr ? 'المرحلة 04' : 'Phase 04',
      summary: isAr
        ? 'أدوات سيادية ميدانية تدمج إحداثيات GPS الدقيقة مع صور الإنجاز وبصمة SHA-256 لمنع التلاعب بالمشاريع، إلى جانب مساعد صوتي ذكي باللغة العربية للتحكم وتدوين الملاحظات.'
        : 'Certification in situ par GPS et empreinte SHA-256 des procès-verbaux de chantier, couplée à un copilote vocal algérien pour la saisie sans clavier.',
      highlights: isAr
        ? [
            'ختم جغرافي بالأقمار الصناعية يربط محضر الإنجاز بموقع المشروع الفعلي',
            'تشفير الصور والمعاينات الميدانية بسجل تدقيق لا يقبل الحذف أو التعديل',
            'مساعد صوتي ذكي يفهم المصطلحات القانونية والإجرائية الجزائرية',
            'إملاء صوتي فوري لتحرير بنود دفاتر الشروط وتقارير لجان التقييم',
          ]
        : [
            'Sceau satellite GPS liant les constats d’avancement au chantier réel',
            'Chiffrement SHA-256 infalsifiable des photographies de terrain',
            'Copilote vocal optimisé pour le lexique juridique et technique algérien',
            'Dictée vocale fluide pour la saisie des clauses et des avis de commission',
          ],
      metricTitle: isAr ? 'دقة التحديد الجغرافي' : 'Précision GPS',
      metricVal: '± 2.4 m',
    },
  ];

  const current = pillars.find((p) => p.id === activeTab) || pillars[0];
  const CurrentIcon = current.icon;

  return (
    <section
      id="smart-suite"
      dir={dir}
      className="py-16 sm:py-24 bg-gradient-to-b from-white via-slate-50/60 to-white text-slate-900 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ترويسة القسم بتصميم ملكي فاتح ومريح للعين */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold mb-4 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isAr ? 'الترسانة التقنية والذكاء الاصطناعي السيادي' : 'Suite Technologique Déployée'}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-cairo mb-4">
            {isAr ? 'ذكاء اصطناعي سيادي... في صلب كل مرحلة' : 'L’Intelligence Artificielle Souveraine au Cœur de l’Action'}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
            {isAr
              ? 'أربع ركائز تقنية ذكية تم بناؤها لتأمين المال العام، تسريع الإجراءات، وتمكين المسؤولين والمتعاملين من اتخاذ قرارات دقيقة وموثوقة دون تعقيد.'
              : 'Quatre piliers stratégiques développés pour protéger les deniers publics, accélérer les délais et fiabiliser la prise de décision.'}
          </p>
        </div>

        {/* أزرار التبويبات الأربعة للركائز بألوان فاتحة وتصميم بطاقات راقية */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-10">
          {pillars.map((p) => {
            const Icon = p.icon;
            const isSelected = p.id === activeTab;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveTab(p.id as never)}
                className={`flex flex-col items-start p-4 sm:p-5 rounded-2xl text-start border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-2 border-emerald-600 text-slate-900 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div
                    className={`p-2.5 rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {p.tag}
                  </span>
                </div>
                <strong className="text-sm sm:text-base font-bold font-cairo leading-snug line-clamp-1 mb-1 text-slate-900">
                  {p.title}
                </strong>
                <span className="text-xs text-slate-500 line-clamp-1">
                  {p.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* لوحة تفاصيل الركيزة المختارة بتصميم فاتح فخم ومساحات مريحة */}
        <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 sm:p-8 lg:p-10 shadow-lg ring-1 ring-slate-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* الشرح والمحتوى */}
            <div className="lg:col-span-7 space-y-6 text-start">
              <div className="flex items-center gap-3.5">
                <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white shadow-md">
                  <CurrentIcon className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold font-mono text-emerald-700 uppercase tracking-widest block">
                    {current.tag} • {isAr ? 'منظومة مفعلة في الإنتاج' : 'Opérationnel'}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-cairo">
                    {current.title}
                  </h3>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
                {current.summary}
              </p>

              {/* النقاط الجوهرية */}
              <div className="space-y-3 pt-2">
                {current.highlights.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-800 font-medium">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* بطاقة القياس والأثر العملياتي */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50 rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
                
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-xs font-bold text-slate-500">
                    {isAr ? 'مؤشر الفعالية والأداء' : 'Indicateur de performance'}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span>{isAr ? 'نشط وحي' : 'Actif'}</span>
                  </span>
                </div>

                <div className="text-center py-2">
                  <span className="text-xs text-slate-500 block mb-1 font-medium">
                    {current.metricTitle}
                  </span>
                  <span className="text-4xl sm:text-5xl font-black text-emerald-700 font-mono tracking-tight">
                    {current.metricVal}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1 shadow-2xs">
                  <span className="text-[11px] font-bold text-emerald-800 block">
                    {isAr ? 'السند القانوني والتطبيقي:' : 'Cadre d’application:'}
                  </span>
                  <p className="leading-relaxed">
                    {isAr
                      ? 'مبني وفق متطلبات القانون 23-12 وقواعد الرقابة والشفافية المنصوص عليها بالمرسوم الرئاسي 15-247.'
                      : 'Développé en stricte conformité avec la Loi 23-12 et le Décret 15-247.'}
                  </p>
                </div>

                <a
                  href="#lifecycle"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs sm:text-sm transition-colors shadow-xs"
                >
                  <span>{isAr ? 'موقع هذه الميزة في دورة حياة الصفقة' : 'Voir dans le cycle de vie'}</span>
                  {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </a>

              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default SmartSuiteSection;
