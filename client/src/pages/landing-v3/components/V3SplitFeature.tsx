import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import {
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  FileCode2,
  Radar,
  Mic,
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';

export const V3SplitFeature: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [activeFeature, setActiveFeature] = useState<number>(0);

  const features = [
    {
      id: 0,
      title: isAr ? 'درع الامتثال الاستباقي قبل الإيداع' : 'Bouclier de Conformité Pré-dépôt',
      metric: '99.4%',
      metricLabel: isAr ? 'دقة فحص الملفات' : 'Précision d’audit',
      desc: isAr
        ? 'فاحص ذكي لملفات الترشح والعروض المالية يمنع الإقصاء الإجرائي الشكلي عبر فحص صلاحية الوثائق والضرائب والضمان الاجتماعي وفق المادة 67 من القانون 23-12.'
        : 'Audit intelligent empêchant les rejets pour vices de forme grâce à la vérification automatisée des pièces administratives et fiscales.',
      bullets: isAr
        ? [
            'كشف الشروط الإقصائية المحتملة قبل انتهاء الآجال',
            'التأكد التلقائي من الحسابات الرياضية لجداول الأسعار (BPU/DQE)',
            'ختم تشفيري مالي AES-256 مع رمز تجزئة زمني لا يقبل التعديل',
          ]
        : [
            'Détection proactive des causes d’exclusion avant soumission',
            'Contrôle arithmétique rigoureux des bordereaux BPU/DQE',
            'Scellement cryptographique AES-256 inviolable',
          ],
      icon: ShieldAlert,
    },
    {
      id: 1,
      title: isAr ? 'صانع دفاتر الشروط والمصفوفة المئوية' : 'Cahier des Charges & Matrice 100 pts',
      metric: '100 pts',
      metricLabel: isAr ? 'مصفوفة التقييم المعتمدة' : 'Barème légal COP',
      desc: isAr
        ? 'أدوات مساعدة للمصلحة المتعاقدة لصياغة دفاتر شروط خالية من الشروط التمييزية، مع مصفوفة تنقيط مئوية وخوارزميات كشف الأسعار المنخفضة بشكل غير طبيعي.'
        : 'Assistance à la rédaction de clauses neutres, matrice d’évaluation multicritères sur 100 points et détection des offres anormalement basses.',
      bullets: isAr
        ? [
            'مولد بنود تعاقدية مطابق للمرسوم الرئاسي 15-247',
            'مدقق لغوي وقانوني لرصد المصطلحات التمييزية المحظورة',
            'خوارزمية حسابية ترصد العروض الشاذة ومحاولات الإغراق السعري',
          ]
        : [
            'Générateur de clauses conformes au Décret 15-247',
            'Linter de neutralité éliminant les critères discriminatoires',
            'Détecteur automatique de dumping et d’offres insoutenables',
          ],
      icon: FileCode2,
    },
    {
      id: 2,
      title: isAr ? 'رادار كشف التواطؤ والتنبؤ بالتعثر' : 'Radar Anti-Collusion & Risques',
      metric: '24/7 Live',
      metricLabel: isAr ? 'رقابة ورادار وطني مستمر' : 'Surveillance continue',
      desc: isAr
        ? 'نواة رقابية سيادية للجمهورية تكشف شبكات التواطؤ ومخططات تدوير الصفقات عبر بصمات الشبكة، وتتنبأ بانحراف المشاريع والملاحق قبل تجاوز الحدود القانونية.'
        : 'Cœur de supervision nationale détectant les ententes illicites et prédisant les dérives budgétaires des avenants.',
      bullets: isAr
        ? [
            'كشف تداخل البصمات الرقمية وعناوين IP بين المتنافسين',
            'خوارزمية رصد تدوير العطاءات والاتفاقات الضمنية',
            'نظام إنذار مبكر عند الاقتراب من سقف الملاحق القانونية (10% و20%)',
          ]
        : [
            'Détection de recoupements IP et métadonnées entre concurrents',
            'Identification des schémas de rotation d’offres',
            'Alerte précoce sur les seuils stricts d’avenants (10% et 20%)',
          ],
      icon: Radar,
    },
    {
      id: 3,
      title: isAr ? 'الختم الميداني والمساعد الصوتي' : 'Sceau Terrain GPS & Vocal',
      metric: '± 2.4 m',
      metricLabel: isAr ? 'دقة الإحداثيات بالأقمار الصناعية' : 'Précision satellite',
      desc: isAr
        ? 'أدوات سيادية ميدانية تدمج إحداثيات GPS الدقيقة مع صور الإنجاز وبصمة SHA-256 لمنع التلاعب بالمشاريع، إلى جانب مساعد صوتي ذكي للمصالح.'
        : 'Certification in situ par GPS et empreinte SHA-256 des procès-verbaux de chantier, couplée à la dictée vocale.',
      bullets: isAr
        ? [
            'ختم جغرافي بالأقمار الصناعية يربط المحضر بالموقع الفعلي',
            'تشفير الصور والمعاينات الميدانية بسجل تدقيق جنائي',
            'إملاء صوتي فوري باللغة العربية لتحرير التقارير والمحاضر',
          ]
        : [
            'Sceau satellite GPS liant les constats au chantier réel',
            'Chiffrement SHA-256 infalsifiable des photographies de terrain',
            'Dictée vocale fluide pour la saisie des avis de commission',
          ],
      icon: Mic,
    },
  ];

  const current = features[activeFeature];
  const CurrentIcon = current.icon;

  return (
    <section
      id="features"
      dir={dir}
      className="w-full bg-[#ffffff] py-14 sm:py-20"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Framed Short Section Title */}
        <div className="flex flex-col items-center justify-center text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold shadow-2xs mb-2.5">
            <span className="size-2 rounded-full bg-emerald-600" />
            <span>{isAr ? 'الترسانة الذكية الاستشارية' : 'Suite d’Intelligence Souveraine'}</span>
          </div>
          <div className="inline-block px-5 sm:px-7 py-2 sm:py-2.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {isAr ? 'ذكاء اصطناعي سيادي استشاري' : 'IA Réglementaire & Consultative'}
            </h2>
          </div>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed font-medium">
            {isAr
              ? 'أداة مساعدة ورقابية استشارية تضمن النزاهة والامتثال وتكافؤ الفرص، ولا تتخذ أي قرارات تلقائية إطلاقاً.'
              : 'Quatre piliers stratégiques développés pour protéger les fonds publics, accélérer les délais et fiabiliser la prise de décision.'}
          </p>
        </div>

        {/* Split 50/50 Layout with 48px Gap */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column (6 cols): Feature List Items with Arrow Affordance */}
          <div className="lg:col-span-6 space-y-4">

            {/* Feature List Items (Spec: body 16px weight 400 #080808, right-arrow in #5a5a5a, bottom border 1px #d8d8d8, padding 16px 0, arrow shifts 4px on hover) */}
            <div className="border-t border-[#d8d8d8]">
              {features.map((feat, index) => {
                const isSelected = activeFeature === index;
                return (
                  <button
                    key={feat.id}
                    type="button"
                    onClick={() => setActiveFeature(index)}
                    className="w-full py-4 border-b border-[#d8d8d8] flex items-center justify-between text-start group cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-[13px] font-bold ${isSelected ? 'text-[#146ef5]' : 'text-[#5a5a5a]'}`}>
                        0{index + 1}
                      </span>
                      <span
                        className={`text-[16px] font-medium transition-colors ${
                          isSelected ? 'text-[#146ef5] font-semibold' : 'text-[#080808] group-hover:text-[#146ef5]'
                        }`}
                      >
                        {feat.title}
                      </span>
                    </div>

                    <ArrowIcon
                      className={`size-4 text-[#5a5a5a] transition-transform ${
                        isSelected
                          ? 'text-[#146ef5] translate-x-1 rtl:-translate-x-1'
                          : 'group-hover:translate-x-1 rtl:group-hover:-translate-x-1 group-hover:text-[#146ef5]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column (6 cols): Dedicated Studio Feature Card */}
          <div className="lg:col-span-6">
            <div className="p-8 sm:p-10 bg-[#ffffff] border border-[#d8d8d8] rounded-[8px] space-y-6 shadow-xs">
              
              {/* Feature Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-[4px] bg-[#146ef5]/10 text-[#146ef5]">
                    <CurrentIcon className="size-6" />
                  </div>
                  <div>
                    <span className="font-mono text-[13px] text-[#146ef5] uppercase font-bold tracking-wider block">
                      PHASE 0{current.id + 1} • OPERATIONAL
                    </span>
                    <h3 className="text-[20px] font-semibold text-[#080808]">
                      {current.title}
                    </h3>
                  </div>
                </div>

                <div className="text-end">
                  <span className="text-[24px] font-bold text-[#146ef5] font-mono block leading-none">
                    {current.metric}
                  </span>
                  <span className="text-[13px] text-[#5a5a5a] uppercase tracking-wider font-mono">
                    {current.metricLabel}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[15px] text-[#5a5a5a] leading-[1.6]">
                {current.desc}
              </p>

              {/* Bullet Points with Check Affordance */}
              <div className="space-y-3 pt-2 border-t border-[#d8d8d8]">
                {current.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-[14px] text-[#080808]">
                    <CheckCircle2 className="size-4 text-[#146ef5] shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>

              {/* Legal Reference Note in Spec Mist Surface */}
              <div className="p-3.5 bg-[#f0f0f0] rounded-[4px] border border-[#d8d8d8] flex items-center justify-between text-[13px] text-[#5a5a5a]">
                <span>{isAr ? 'المرجع: القانون رقم 23-12 والمرسوم الرئاسي 15-247' : 'Cadre : Loi 23-12 & Décret 15-247'}</span>
                <span className="font-mono text-[13px] font-bold text-[#080808]">OFFICIAL</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default V3SplitFeature;
