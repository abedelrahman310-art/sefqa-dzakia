import React from 'react';
import { useI18n } from '@/i18n';
import {
  Building2,
  FileCheck,
  ShieldCheck,
  Cpu,
  Scale,
  Lock,
  Layers,
  Sparkles,
  Clock,
} from 'lucide-react';

export const V3InteroperabilitySection: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';

  const integrations = [
    {
      id: 'cnrc',
      title: isAr ? 'المركز الوطني للسجل التجاري (CNRC)' : 'Registre du Commerce (CNRC)',
      desc: isAr
        ? 'مخطط للتكامل الآلي المستقبلي للتحقق اللحظي من أهلية المؤسسات ورموز النشاط الاقتصادي دون طلب أي مستخرجات ورقية'
        : 'Intégration ciblée pour la vérification automatisée de l’existence légale et des codes d’activité sans papier',
      tag: isAr ? 'ربط مستهدف مستقبلاً' : 'Intégration ciblée',
      icon: Building2,
    },
    {
      id: 'dgi',
      title: isAr ? 'المديرية العامة للضرائب (DGI)' : 'Direction Générale des Impôts (DGI)',
      desc: isAr
        ? 'ربط مستقبلي مستهدف للمطابقة التلقائية للرقم التعريفي الجبائي (NIF) واستخراج شهادة الوضعية الجبائية إلكترونياً'
        : 'Validation future ciblée du NIF et contrôle direct de la situation fiscale des soumissionnaires',
      tag: isAr ? 'تكامل مخطط مستقبلاً' : 'Contrôle fiscal planifié',
      icon: FileCheck,
    },
    {
      id: 'cnas',
      title: isAr ? 'صناديق الضمان الاجتماعي (CNAS / CASNOS)' : 'Sécurité Sociale (CNAS / CASNOS)',
      desc: isAr
        ? 'تكامل مبرمج لفحص أداء اشتراكات الأجراء والعمال غير الأجراء وإثبات تسوية المستحقات نظامياً بشكل آلي'
        : 'Attestation électronique programmée pour la mise à jour des cotisations sociales et patronales',
      tag: isAr ? 'تنسيق رقمي مستهدف' : 'Audit social programmé',
      icon: ShieldCheck,
    },
    {
      id: 'auth',
      title: isAr ? 'سلطة التصديق الإلكتروني الوطنية' : 'Autorité Nationale de Certification',
      desc: isAr
        ? 'اعتماد مستقبلي موجه للتوقيع الإلكتروني والختم الزمني المشفر وفق أحكام القانون رقم 15-04'
        : 'Adoption future ciblée de la signature électronique qualifiée et de l’horodatage selon la Loi 15-04',
      tag: isAr ? 'اعتماد سيادي مستهدف' : 'Certification ciblée',
      icon: Cpu,
    },
  ];

  const nationalPillars = [
    {
      badge: isAr ? '69 ولاية' : '69 Wilayas',
      label: isAr ? 'تغطية وطنية شاملة' : 'Couverture Nationale Intégrale',
      sub: isAr ? 'هندسة موحدة قابلة للتطبيق في كافة ولايات وبلديات الوطن' : 'Architecture unifiée pour toutes les communes',
      icon: Layers,
    },
    {
      badge: isAr ? 'القانون 23-12' : 'Loi 23-12',
      label: isAr ? 'إطار تشريعي موحد' : 'Cadre Législatif Unifié',
      sub: isAr ? 'تطبيق صارم لمبادئ النزاهة والشفافية وحرية المنافسة' : 'Application stricte des principes de transparence',
      icon: Scale,
    },
    {
      badge: isAr ? 'القانون 15-04' : 'Loi 15-04',
      label: isAr ? 'حجية التوقيع الإلكتروني' : 'Force Probante Numérique',
      sub: isAr ? 'استعداد معماري كامل للمحاضر والعقود الرقمية الملزمة قانوناً' : 'Préparation technique aux actes numériques probants',
      icon: FileCheck,
    },
    {
      badge: isAr ? 'تشفير SHA-256' : 'Chiffrement SHA-256',
      label: isAr ? 'سرية الأظرفة المالية' : 'Inviolabilité des Offres',
      sub: isAr ? 'أقفال زمنية تمنع الاطلاع قبل الجلسات العلنية الرسمية' : 'Verrou temporel jusqu’à l’ouverture officielle',
      icon: Lock,
    },
  ];

  return (
    <section id="interoperability" dir={dir} className="relative w-full bg-[#f8fafc] py-16 sm:py-20 px-4 sm:px-6 overflow-hidden">
      {/* خلفية زليج خفيفة */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(#006233 0.75px, transparent 0.75px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative max-w-[1200px] mx-auto">
        {/* رأس القسم مع توضيح الرؤية المستقبلية والنموذج الأولي */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/70 text-emerald-900 text-xs sm:text-sm font-bold shadow-2xs mb-4">
            <Sparkles className="size-3.5 text-emerald-700" />
            <span>{isAr ? 'الآفاق المستقبلية · خارطة الربط البيني' : 'Perspectives Futures · Feuille de Route d’Intégration'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug">
            {isAr ? 'الآفاق المستقبلية لمنظومة الربط البيني والسيادة الوطنية' : 'Perspectives Futures d’Interconnexion et de Souveraineté Numérique'}
          </h2>

          <p className="mt-3.5 text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            {isAr
              ? 'رؤية معمارية مستهدفة في النموذج الأولي لمنصة صفقات ذكية للتكامل الرقمي المباشر مع المنظومات وقواعد البيانات الحكومية مستقبلاً'
              : 'Une vision d’architecture ciblée dans le prototype Safaqat Dzakia pour l’interconnexion future directe avec les registres de l’État'}
          </p>

          {/* شارة إيضاحية لطبيعة النموذج الأولي وخارطة الطريق */}
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold shadow-2xs">
            <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              {isAr
                ? 'المنصة نموذج أولي ريادي · بروتوكولات الربط البيني الحكومي مبرمجة ضمن مراحل التوسع التشغيلي المستقبلي'
                : 'Prototype souverain innovant · Les protocoles d’interconnexion sont programmés dans les phases futures de déploiement'}
            </span>
          </div>
        </div>

        {/* بطاقات الربط البيني الأربع مع إبراز الطابع المستقبلي */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {integrations.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="p-5 sm:p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-emerald-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {item.tag}
                    </span>
                    <div className="size-9 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
                      <Icon className="size-4.5" />
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-2 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3 text-slate-400" />
                    <span>{isAr ? 'خارطة الطريق' : 'Feuille de route'}</span>
                  </span>
                  <span className="font-semibold text-emerald-800">
                    {isAr ? 'مرحلة الربط المستقبلي' : 'Phase future'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* الركائز السيادية والمعمارية المعتمدة */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
          <div className="mb-6 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isAr ? 'المرتكزات السيادية والمعمارية المعتمدة للمنظومة' : 'Piliers Souverains et Cadre Structurel du Projet'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-100">
            {nationalPillars.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div key={idx} className="pt-4 lg:pt-0 px-3 space-y-2">
                  <div className="inline-flex items-center justify-center size-10 rounded-xl bg-emerald-50 text-[#006233] border border-emerald-100 shadow-2xs mx-auto">
                    <Icon className="size-5" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    {p.badge}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800">
                    {p.label}
                  </div>
                  <div className="text-xs text-slate-500 font-medium leading-relaxed">
                    {p.sub}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default V3InteroperabilitySection;
