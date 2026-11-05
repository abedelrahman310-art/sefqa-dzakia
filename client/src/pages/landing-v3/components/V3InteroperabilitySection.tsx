import React from 'react';
import { useI18n } from '@/i18n';
import {
  Network,
  Building2,
  FileCheck,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  TrendingUp,
  Cpu,
} from 'lucide-react';

export const V3InteroperabilitySection: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';

  const integrations = [
    {
      id: 'cnrc',
      title: isAr ? 'المركز الوطني للسجل التجاري (CNRC)' : 'Registre du Commerce (CNRC)',
      desc: isAr
        ? 'تحقق آلي ولحظي من أهلية المؤسسات ورموز النشاط الاقتصادي دون طلب أي مستخرجات ورقية.'
        : 'Vérification automatisée et instantanée de l’existence légale et des codes d’activité.',
      tag: isAr ? 'ربط آلي مباشر' : 'API Directe',
      icon: Building2,
    },
    {
      id: 'dgi',
      title: isAr ? 'المديرية العامة للضرائب (DGI)' : 'Direction Générale des Impôts (DGI)',
      desc: isAr
        ? 'مطابقة تلقائية للرقم التعريفي الجبائي (NIF) واستخراج شهادة الوضعية الجبائية إلكترونياً.'
        : 'Validation immédiate du NIF et contrôle en direct de la situation fiscale des soumissionnaires.',
      tag: isAr ? 'تحقق لحظي' : 'Contrôle Fiscal',
      icon: FileCheck,
    },
    {
      id: 'cnas',
      title: isAr ? 'صناديق الضمان الاجتماعي (CNAS / CASNOS)' : 'Sécurité Sociale (CNAS / CASNOS)',
      desc: isAr
        ? 'فحص فوري لأداء اشتراكات الأجراء والعمال غير الأجراء وإثبات تسوية المستحقات نظامياً.'
        : 'Attestation électronique de mise à jour des cotisations sociales et patronales.',
      tag: isAr ? 'إثبات رقمي' : 'Audit Social',
      icon: ShieldCheck,
    },
    {
      id: 'auth',
      title: isAr ? 'سلطة التصديق الإلكتروني الوطنية' : 'Autorité Nationale de Certification',
      desc: isAr
        ? 'اعتماد التوقيع الإلكتروني والختم الزمني المشفر وفق أحكام القانون رقم 15-04.'
        : 'Signature électronique qualifiée et horodatage probant régis par la Loi 15-04.',
      tag: isAr ? 'سيادة رقمية' : 'Signature 15-04',
      icon: Cpu,
    },
  ];

  const nationalMetrics = [
    {
      value: '58',
      label: isAr ? 'ولاية مغطاة بالكامل' : 'Wilayas couvertes',
      sub: isAr ? 'تغطية وطنية شاملة' : 'Couverture nationale intégrale',
    },
    {
      value: '1,541',
      label: isAr ? 'بلدية مربوطة بالمنظومة' : 'Communes interconnectées',
      sub: isAr ? 'لا مركزية الصفقات' : 'Décentralisation totale',
    },
    {
      value: '100%',
      label: isAr ? 'مبدأ «صفر ورقة» الرقمي' : 'Zéro Papier Intégral',
      sub: isAr ? 'إيداع وتشفير كامل' : 'Dématérialisation absolue',
    },
    {
      value: 'AES-256',
      label: isAr ? 'تشفير سيادي للأظرفة' : 'Chiffrement Souverain',
      sub: isAr ? 'سرية مطلقة حتى الفتح' : 'Inviolabilité des plis',
    },
  ];

  return (
    <section id="interoperability" dir={dir} className="w-full bg-[#ffffff] py-14 sm:py-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Framed Short Section Title */}
        <div className="flex flex-col items-center justify-center text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold shadow-2xs mb-2.5">
            <span className="size-2 rounded-full bg-emerald-600" />
            <span>{isAr ? 'التكامل الحكومي والسيادة' : 'Intégration Gouvernementale'}</span>
          </div>
          <div className="inline-block px-5 sm:px-7 py-2 sm:py-2.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {isAr ? 'الربط البيني والتغطية الوطنية' : 'Interconnexion & Couverture Nationale'}
            </h2>
          </div>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed font-medium">
            {isAr
              ? 'ربط مباشر مع قواعد البيانات الحكومية لتجسيد مبدأ «صفر ورقة» وتغطية كافة ولايات وبلديات الجزائر.'
              : 'Interconnexion directe avec les registres de l’État pour concrétiser le principe Zéro Papier sur 69 wilayas.'}
          </p>
        </div>

        {/* 4 Governmental Integration Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {integrations.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-emerald-300 hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                      {item.tag}
                    </span>
                    <div className="size-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-emerald-700">
                      <Icon className="size-4" />
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-2 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* National Metrics Box */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-6 sm:p-8 shadow-2xs">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-slate-200">
            {nationalMetrics.map((m, idx) => (
              <div key={idx} className="pt-4 sm:pt-0 px-2 space-y-1">
                <div className="text-2xl sm:text-4xl font-black text-[#0f3154] tracking-tight font-sans">
                  {m.value}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-800">
                  {m.label}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {m.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default V3InteroperabilitySection;
