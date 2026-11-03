import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import {
  ShieldAlert,
  FileCode2,
  Radar,
  Mic,
  MapPin,
  CheckCircle,
  Cpu,
  BarChart3,
  Layers,
  Sparkles,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export const SmartSuiteSection: React.FC = () => {
  const { lang } = useI18n();
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
    <section id="smart-suite" className="py-16 sm:py-24 bg-slate-900 text-white relative overflow-hidden border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ترويسة القسم */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'الترسانة الذكية المطورة' : 'Suite Technologique Déployée'}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-cairo mb-4">
            {isAr ? 'ذكاء اصطناعي سيادي... في صلب كل مرحلة' : 'L’Intelligence Artificielle Souveraine au Cœur de l’Action'}
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-medium">
            {isAr
              ? 'أربع ركائز تقنية ذكية تم بناؤها لتأمين المال العام، تسريع الإجراءات، وتمكين المسؤولين والمتعاملين من اتخاذ قرارات دقيقة موثوقة.'
              : 'Quatre piliers stratégiques développés pour protéger les deniers publics, accélérer les délais et fiabiliser la prise de décision.'}
          </p>
        </div>

        {/* أزرار التبويبات الأربعة للركائز */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {pillars.map((p) => {
            const Icon = p.icon;
            const isSelected = p.id === activeTab;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveTab(p.id as never)}
                className={`flex flex-col items-start p-4 rounded-xl text-start border transition-all ${
                  isSelected
                    ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-lg'
                    : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-emerald-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    {p.tag}
                  </span>
                </div>
                <strong className="text-sm font-bold font-cairo leading-snug line-clamp-1">
                  {p.title}
                </strong>
                <span className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                  {p.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* لوحة تفاصيل الركيزة المختارة */}
        <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* الشرح والمحتوى */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500 text-slate-950 shadow-md">
                  <CurrentIcon className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-widest">
                    {current.tag} • {isAr ? 'منظومة مفعلة في الإنتاج' : 'Opérationnel'}
                  </span>
                  <h3 className="text-2xl font-black text-white font-cairo">
                    {current.title}
                  </h3>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
                {current.summary}
              </p>

              {/* النقاط الجوهرية */}
              <div className="space-y-3 pt-2">
                {current.highlights.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* بطاقة القياس والأثر العملياتي */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <div className="bg-slate-950/80 rounded-xl border border-slate-700 p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <span className="text-xs font-bold text-slate-400">
                    {isAr ? 'مؤشر الفعالية والأداء' : 'Indicateur de performance'}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{isAr ? 'نشط وحي' : 'Actif'}</span>
                  </span>
                </div>

                <div className="text-center py-2">
                  <span className="text-xs text-slate-400 block mb-1">
                    {current.metricTitle}
                  </span>
                  <span className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tight">
                    {current.metricVal}
                  </span>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 block">
                    {isAr ? 'السند القانوني والتطبيقي:' : 'Cadre d’application:'}
                  </span>
                  <p className="leading-snug">
                    {isAr
                      ? 'مبني وفق متطلبات القانون 23-12 وقواعد الرقابة والشفافية المنصوص عليها بالمرسوم 15-247.'
                      : 'Développé en stricte conformité avec la Loi 23-12 et le Décret 15-247.'}
                  </p>
                </div>

                <a
                  href="#lifecycle"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-colors"
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
