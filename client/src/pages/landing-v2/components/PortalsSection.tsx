import React from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import { Briefcase, Building, Eye, ArrowLeft, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export const PortalsSection: React.FC = () => {
  const { lang } = useI18n();
  const isAr = lang === 'ar';

  const portals = [
    {
      id: 'operator',
      number: '01',
      title: isAr ? 'المتعامل الاقتصادي' : 'Opérateur Économique',
      badge: isAr ? 'المتعهدون والموردون' : 'Soumissionnaires',
      description: isAr
        ? 'فضاء المتعهدين لتصفح الفرص الوطنية، إيداع وتشفير العروض إلكترونياً، التحقق من الوثائق بدرع الامتثال، ومتابعة جلسات الفتح والنتائج بشفافية تامة.'
        : 'Espace dédié aux soumissionnaires pour consulter les avis, déposer et chiffrer les offres, vérifier la conformité et suivre les ouvertures.',
      icon: Briefcase,
      color: 'emerald',
      features: isAr
        ? [
            'تصفح الصفقات والمطابقة الذكية مع المؤهلات',
            'إيداع العروض والختم التشفيري الآمن (AES-256)',
            'فاحص درع الامتثال الاستباقي لمنع الإقصاء الشكلي',
            'حضور جلسات فتح الأظرفة العلنية عبر البث المباشر',
          ]
        : [
            'Recherche intelligente et ciblage des marchés',
            'Dépôt et chiffrement inviolable (AES-256)',
            'Bouclier pré-dépôt contre les rejets de forme',
            'Participation aux séances d’ouverture en direct',
          ],
      link: '/operator',
      registerLink: '/register/operator',
    },
    {
      id: 'authority',
      number: '02',
      title: isAr ? 'المصلحة المتعاقدة' : 'Autorité Contractante',
      badge: isAr ? 'الإدارات وأصحاب المشاريع' : 'Services Contractants',
      description: isAr
        ? 'البيئة المتكاملة للإدارات العمومية لإعداد دفاتر الشروط الذكية، إدارة طلبات العروض، ترؤس لجان الفتح والتقييم، ومتابعة تنفيذ الصفقات وأوامر الخدمة.'
        : 'Outils avancés pour rédiger les cahiers des charges, piloter les commissions d’ouverture et d’évaluation, et suivre les ODS d’exécution.',
      icon: Building,
      color: 'blue',
      features: isAr
        ? [
            'صياغة دفاتر الشروط بمواصفات محايدة ومطابقة للقانون',
            'استقبال وتفريغ العروض تلقائياً وتوثيق المحاضر',
            'مصفوفة التقييم المئوية (COP) وكشف الأسعار الشاذة',
            'إصدار أوامر بداية الخدمة (ODS) وحساب غرامات التأخير',
          ]
        : [
            'Génération de cahiers des charges conformes',
            'Ouverture automatique et PV horodaté à la seconde',
            'Matrice d’évaluation sur 100 pts et détection des prix anormaux',
            'Gestion des ODS et décompte des pénalités de retard',
          ],
      link: '/authority',
      registerLink: '/register/authority',
    },
    {
      id: 'central',
      number: '03',
      title: isAr ? 'الإدارة المركزية (عين الصقر)' : 'Administration Centrale (Œil de Faucon)',
      badge: isAr ? 'الرقابة الاستراتيجية والنزاهة' : 'Supervision Nationale',
      description: isAr
        ? 'مرصد وطني استراتيجي للرقابة اللحظية على التدفقات المالية والصفقات، كشف شبهات التواطؤ، التنبؤ بتعثر المشاريع، وحماية المال العام عبر 69 ولاية.'
        : 'Observatoire macroéconomique pour surveiller les flux, détecter la collusion, anticiper les dérives de délais et garantir la probité.',
      icon: Eye,
      color: 'slate',
      features: isAr
        ? [
            'لوحات قيادة وطنية وتحليلات عبر 69 ولاية ومختلف القطاعات',
            'رادار كشف التواطؤ ومخططات تدوير العطاءات المشبوهة',
            'متنبئ تعثر المشاريع والانحراف المالي للملاحق (15-247)',
            'سجل تدقيق جنائي موثق وغير قابل للتعديل (SHA-256)',
          ]
        : [
            'Tableaux de bord macroéconomiques à l’échelle des 69 wilayas',
            'Radar anti-collusion et détection d’offres de complaisance',
            'Prédiction des retards de chantier et dérives d’avenants',
            'Journal d’audit médico-légal infalsifiable (SHA-256)',
          ],
      link: '/central',
      registerLink: '/login',
    },
  ];

  return (
    <section id="portals" className="py-16 sm:py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ترويسة القسم */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold mb-4 border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'البنية المؤسسية الموحدة' : 'Architecture Institutionnelle'}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-cairo mb-4">
            {isAr ? 'منظومة واحدة... ثلاث بوابات سيادية متكاملة' : 'Une Plateforme Unique… Trois Portails Souverains'}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-medium">
            {isAr
              ? 'تجمع منصة «صفقات ذكية» كافة الفاعلين في منظومة الصفقات العمومية، مع تخصيص فضاء عملي دقيق لكل جهة بصلاحيات ومسؤوليات محددة قانوناً.'
              : 'Safaqat Dhakia fédère tous les intervenants de la commande publique en garantissant à chaque rôle un environnement dédié et sécurisé.'}
          </p>
        </div>

        {/* شبكة البوابات الثلاث */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.id}
                className="flex flex-col justify-between rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all group"
              >
                <div>
                  {/* رأس البطاقة */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-emerald-700 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-colors">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">
                        {portal.number}
                      </span>
                    </div>

                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {portal.badge}
                    </span>
                  </div>

                  {/* اسم البوابة ووصفها */}
                  <h3 className="text-xl font-black text-slate-900 font-cairo mb-2 group-hover:text-emerald-800 transition-colors">
                    {portal.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-medium">
                    {portal.description}
                  </p>

                  {/* قائمة الميزات الأساسية */}
                  <div className="space-y-2.5 mb-8 border-t border-slate-100 pt-5">
                    {portal.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <div className="rounded-full p-0.5 bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="font-medium leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* روابط الدخول والتسجيل */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <Link
                    href={portal.link}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xs transition-colors"
                  >
                    <span>{isAr ? 'دخول البوابة' : 'Accéder au portail'}</span>
                    {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </Link>

                  {portal.registerLink && portal.id !== 'central' && (
                    <Link
                      href={portal.registerLink}
                      className="w-full text-center py-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors"
                    >
                      {isAr ? 'تسجيل حساب جديد' : 'Créer un compte'}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default PortalsSection;
