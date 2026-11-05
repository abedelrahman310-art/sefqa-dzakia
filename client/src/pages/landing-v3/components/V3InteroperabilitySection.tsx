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
} from 'lucide-react';

export const V3InteroperabilitySection: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';

  const integrations = [
    {
      id: 'cnrc',
      title: isAr ? 'المركز الوطني للسجل التجاري (CNRC)' : 'Registre du Commerce (CNRC)',
      desc: isAr
        ? 'تحقق آلي ولحظي من أهلية المؤسسات ورموز النشاط الاقتصادي دون طلب أي مستخرجات ورقية'
        : 'Vérification automatisée et instantanée de l’existence légale et des codes d’activité sans papier',
      tag: isAr ? 'ربط آلي مباشر' : 'API Directe',
      icon: Building2,
    },
    {
      id: 'dgi',
      title: isAr ? 'المديرية العامة للضرائب (DGI)' : 'Direction Générale des Impôts (DGI)',
      desc: isAr
        ? 'مطابقة تلقائية للرقم التعريفي الجبائي (NIF) واستخراج شهادة الوضعية الجبائية إلكترونياً'
        : 'Validation immédiate du NIF et contrôle en direct de la situation fiscale des soumissionnaires',
      tag: isAr ? 'تحقق لحظي' : 'Contrôle Fiscal',
      icon: FileCheck,
    },
    {
      id: 'cnas',
      title: isAr ? 'صناديق الضمان الاجتماعي (CNAS / CASNOS)' : 'Sécurité Sociale (CNAS / CASNOS)',
      desc: isAr
        ? 'فحص فوري لأداء اشتراكات الأجراء والعمال غير الأجراء وإثبات تسوية المستحقات نظامياً'
        : 'Attestation électronique de mise à jour des cotisations sociales et patronales',
      tag: isAr ? 'إثبات رقمي' : 'Audit Social',
      icon: ShieldCheck,
    },
    {
      id: 'auth',
      title: isAr ? 'سلطة التصديق الإلكتروني الوطنية' : 'Autorité Nationale de Certification',
      desc: isAr
        ? 'اعتماد التوقيع الإلكتروني والختم الزمني المشفر وفق أحكام القانون رقم 15-04'
        : 'Signature électronique qualifiée et horodatage probant régis par la Loi 15-04',
      tag: isAr ? 'سيادة رقمية' : 'Signature 15-04',
      icon: Cpu,
    },
  ];

  const nationalPillars = [
    {
      badge: isAr ? '58 ولاية' : '58 Wilayas',
      label: isAr ? 'تغطية وطنية شاملة' : 'Couverture Nationale Intégrale',
      sub: isAr ? 'نظام موحد لكافة بلديات وقطاعات الوطن' : 'Système unifié pour toutes les communes',
      icon: Layers,
    },
    {
      badge: isAr ? 'القانون 23-12' : 'Loi 23-12',
      label: isAr ? 'إطار تشريعي موحد' : 'Cadre Législatif Unifié',
      sub: isAr ? 'تطبيق صارم للمبادئ الدستورية والنزاهة' : 'Application stricte des principes de transparence',
      icon: Scale,
    },
    {
      badge: isAr ? 'القانون 15-04' : 'Loi 15-04',
      label: isAr ? 'حجية التوقيع الإلكتروني' : 'Force Probante Numérique',
      sub: isAr ? 'محاضر وعقود رقمية ملزمة رسمياً' : 'Actes et procès-verbaux certifiés et opposables',
      icon: FileCheck,
    },
    {
      badge: isAr ? 'تشفير SHA-256' : 'Chiffrement SHA-256',
      label: isAr ? 'سرية الأظرفة المالية' : 'Inviolabilité des Offres',
      sub: isAr ? 'أقفال زمنية تمنع الفتح قبل الجلسة' : 'Verrou temporel jusqu’à l’ouverture officielle',
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
        {/* رأس القسم */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-slate-800 text-xs sm:text-sm font-bold shadow-2xs mb-4">
            <span className="size-2 rounded-full bg-emerald-600" />
            <span>{isAr ? 'التكامل الحكومي والربط البيني' : 'Écosystème Gouvernemental'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug">
            {isAr ? 'منظومة الربط البيني والسيادة الوطنية' : 'Interconnexion et Souveraineté Numérique'}
          </h2>

          <p className="mt-3.5 text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            {isAr
              ? 'ربط مباشر مع قواعد البيانات الحكومية لتجسيد مبدأ «صفر ورقة» وتغطية كافة ولايات وبلديات الجزائر'
              : 'Interconnexion directe avec les registres de l’État pour concrétiser le principe Zéro Papier sur les 58 wilayas'}
          </p>
        </div>

        {/* بطاقات الربط البيني الأربع */}
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
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                      {item.tag}
                    </span>
                    <div className="size-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-emerald-700 shadow-2xs">
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
              </div>
            );
          })}
        </div>

        {/* الركائز السيادية المعتمدة بدلاً من الأرقام الوهمية */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
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
                  <div className="text-xs text-slate-500 font-medium">
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
