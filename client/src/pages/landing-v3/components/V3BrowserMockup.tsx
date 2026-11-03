import React from 'react';
import { useI18n } from '@/i18n';
import Logo from '@/components/ui/Logo';
import {
  Lock,
  Clock,
  Building2,
  FileCheck,
  CheckCircle2,
  Cpu,
  Download,
  Receipt,
  FileText,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { Link } from 'wouter';

export const V3BrowserMockup: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';

  return (
    <section
      id="live-demo"
      dir={dir}
      className="w-full bg-[#f0f0f0] py-20"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Section Heading */}
        <div className="max-w-[720px] mx-auto text-center space-y-3 mb-12">
          <p className="text-[13px] font-medium tracking-[0.1em] uppercase text-[#5a5a5a] font-mono">
            {isAr ? 'المعاينة المباشرة للمنظومة' : 'DÉMONSTRATION DU SYSTÈME RÉEL'}
          </p>
          <h2 className="text-[26px] sm:text-[40px] font-semibold text-[#080808] leading-[1.04] tracking-[-0.4px]">
            {isAr ? 'الصفقة الرقمية المشفرة... كما يراها المتعامل والمصلحة' : 'L’Appel d’Offres Dématérialisé en Conditions Réelles'}
          </h2>
          <p className="text-[16px] text-[#5a5a5a] leading-[1.6]">
            {isAr
              ? 'وثيقة صفقة رقمية حية متكاملة الأركان وفق المادة 67 من القانون 23-12، تدمج الختم التشفيري للأظرفة المالية، ودرع فحص الامتثال المسبق، ووصل السحب الرقمي.'
              : 'Interface souveraine affichant le scellement cryptographique AES-256, l’audit pré-dépôt et le récépissé certifié de retrait.'}
          </p>
        </div>

        {/* Browser Frame Mockup */}
        <div
          className="w-full max-w-[1040px] mx-auto bg-[#ffffff] rounded-[8px] overflow-hidden border border-[#d8d8d8]"
          style={{
            boxShadow:
              'rgba(0, 0, 0, 0.02) 0px 67px 27px 0px, rgba(0, 0, 0, 0.06) 0px 38px 23px 0px, rgba(0, 0, 0, 0.1) 0px 17px 17px 0px, rgba(0, 0, 0, 0.12) 0px 4px 9px 0px',
          }}
        >
          {/* Browser Chrome Top Bar (28px height, #f0f0f0 bg, traffic dots, centered URL) */}
          <div className="h-[36px] bg-[#f0f0f0] border-b border-[#d8d8d8] px-3.5 flex items-center justify-between select-none">
            {/* Traffic Light Dots */}
            <div className="flex items-center gap-1.5 w-16">
              <span className="size-2.5 rounded-full bg-[#ff5f56] inline-block border border-[#e0443e]" />
              <span className="size-2.5 rounded-full bg-[#ffbd2e] inline-block border border-[#dea123]" />
              <span className="size-2.5 rounded-full bg-[#27c93f] inline-block border border-[#1aab29]" />
            </div>

            {/* Centered URL Bar */}
            <div className="flex-1 max-w-[480px] mx-auto">
              <div className="bg-[#ffffff] border border-[#d8d8d8] rounded-[4px] px-3 py-1 flex items-center justify-center gap-2 text-[13px] font-mono text-[#5a5a5a]">
                <Lock className="size-3 text-[#146ef5]" />
                <span className="truncate">https://safaqat.gov.dz/operator/deals/DZ-2026-084</span>
              </div>
            </div>

            {/* Status dot */}
            <div className="w-16 flex items-center justify-end gap-1.5 text-[13px] font-mono text-[#5a5a5a]">
              <span className="size-1.5 rounded-full bg-[#146ef5]" />
              <span>LIVE</span>
            </div>
          </div>

          {/* Browser Body UI */}
          <div className="p-6 sm:p-8 bg-[#ffffff] space-y-6">
            
            {/* Deal Top Banner inside UI */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#d8d8d8]">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#f0f0f0] text-[#080808] font-mono text-[13px] font-bold">
                    DZ-2026-084
                  </span>
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#146ef5]/10 text-[#146ef5] text-[13px] font-medium">
                    {isAr ? 'طلب عروض وطني مفتوح' : 'Appel d’offres national ouvert'}
                  </span>
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#f0f0f0] text-[#5a5a5a] text-[13px]">
                    {isAr ? 'ولاية الجزائر' : 'Wilaya d’Alger'}
                  </span>
                </div>
                <h3 className="text-[20px] font-semibold text-[#080808] leading-snug">
                  {isAr
                    ? 'مشروع رقمنة وتأهيل شبكات البنية التحتية والمنشآت الذكية'
                    : 'Projet de modernisation des infrastructures numériques de base'}
                </h3>
                <p className="text-[13px] text-[#5a5a5a] flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-[#5a5a5a]" />
                  <span>{isAr ? 'وزارة الأشغال العمومية والمنشآت القاعدية' : 'Ministère des Travaux Publics'}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-[4px] bg-[#146ef5] hover:bg-[#1366e2] text-white text-[13px] font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <Download className="size-3.5" />
                  <span>{isAr ? 'تحميل دفتر الشروط (PDF)' : 'Cahier des charges'}</span>
                </Link>
              </div>
            </div>

            {/* Split UI Canvas: Left Main / Right Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Main (8 cols): Cryptographic Envelope & Status */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Cryptographic Seal Box */}
                <div className="p-5 rounded-[8px] border border-[#d8d8d8] bg-[#ffffff] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-[4px] bg-[#146ef5]/10 text-[#146ef5]">
                        <Lock className="size-4" />
                      </div>
                      <strong className="text-[14px] font-semibold text-[#080808]">
                        {isAr ? 'الظرف المالي مشفر ومقفل سيادياً' : 'Enveloppe financière scellée'}
                      </strong>
                    </div>
                    <span className="font-mono text-[13px] px-2 py-0.5 rounded-[4px] bg-[#f0f0f0] text-[#080808]">
                      AES-256 BIT
                    </span>
                  </div>

                  <p className="text-[13px] text-[#5a5a5a] leading-relaxed">
                    {isAr
                      ? 'مفاتيح فك التشفير مجزأة رقمياً ومحمية بالختم الزمني المشترك. يُحظر ولا يمكن تقنياً فتح أي عرض مالي قبل جلسة الفتح العلنية المحددة قانوناً.'
                      : 'Les clés de déchiffrement sont fragmentées et protégées par scellé temporel inviolable jusqu’à la séance publique.'}
                  </p>

                  <div className="p-3 bg-[#f0f0f0] rounded-[4px] border border-[#d8d8d8] font-mono text-[13px] text-[#080808] flex items-center justify-between">
                    <span className="truncate">SHA256: 7f8a9b2c4e1d0938a1f6c7e2b8c9d0e1f2a3...bf62a</span>
                    <span className="text-[#115ccb] text-[13px] font-bold uppercase ms-2 shrink-0">VERIFIED</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[13px] text-[#5a5a5a]">
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-[#146ef5]" />
                      <span>{isAr ? 'موعد جلسة الفتح العلنية المباشرة:' : 'Séance d’ouverture:'}</span>
                    </span>
                    <strong className="font-mono text-[#080808]">15-11-2026 (10:00)</strong>
                  </div>
                </div>

                {/* Timeline / Progress bar */}
                <div className="p-4 rounded-[8px] border border-[#d8d8d8] bg-[#ffffff] space-y-2">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-[#080808]">
                      {isAr ? 'مرحلة العملية الإجرائية:' : 'Jalon actuel :'}
                    </span>
                    <span className="font-mono text-[13px] font-bold text-[#146ef5]">
                      {isAr ? 'المرحلة 03 / 07 — إيداع العروض' : 'Étape 03 / 07 — Dépôt des plis'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                    <div className="w-[43%] h-full bg-[#146ef5]" />
                  </div>
                </div>

              </div>

              {/* Right Sidebar (5 cols): Bouclier & Receipt */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Bouclier Pre-Audit Box */}
                <div className="p-5 rounded-[8px] border border-[#d8d8d8] bg-[#ffffff] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-mono uppercase tracking-wider text-[#5a5a5a]">
                      {isAr ? 'فاحص المطابقة المسبقة' : 'AUDIT PRÉ-DÉPÔT'}
                    </span>
                    <span className="size-2 rounded-full bg-[#146ef5]" />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-[4px] bg-[#146ef5]/10 text-[#146ef5] flex items-center justify-center">
                      <Cpu className="size-5" />
                    </div>
                    <div>
                      <strong className="text-[14px] font-semibold text-[#080808] block">
                        {isAr ? 'درع الامتثال الاستباقي' : 'Bouclier de Conformité'}
                      </strong>
                      <span className="text-[13px] text-[#5a5a5a]">
                        {isAr ? 'مراجعة تلقائية لـ 14 وثيقة إلزامية' : '14 pièces administratives vérifiées'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 text-[13px] text-[#080808]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-[#146ef5]" />
                      <span>{isAr ? 'شهادة الضرائب والضمان الاجتماعي سارية' : 'Attestations fiscales valides'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-[#146ef5]" />
                      <span>{isAr ? 'جدول الأسعار BPU/DQE متطابق حسابياً' : 'Calculs BPU/DQE vérifiés sans écart'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-[#146ef5]" />
                      <span>{isAr ? 'كفالة التعهد البنكية مسجلة رسمياً' : 'Caution bancaire enregistrée'}</span>
                    </div>
                  </div>
                </div>

                {/* Digital Receipt Status */}
                <div className="p-4 rounded-[8px] border border-[#d8d8d8] bg-[#f0f0f0] space-y-1.5">
                  <div className="flex items-center justify-between text-[13px] font-mono text-[#5a5a5a]">
                    <span>{isAr ? 'وصل سحب دفتر الشروط' : 'RÉCÉPISSÉ DE RETRAIT'}</span>
                    <span className="font-bold text-[#115ccb]">PAID</span>
                  </div>
                  <strong className="font-mono text-[13px] text-[#080808] block">
                    REC-2026-DZ084-7F89B2
                  </strong>
                  <span className="text-[13px] text-[#5a5a5a] block">
                    {isAr ? 'رسوم السحب مسددة عبر Chargily Pay' : 'Acquitté via passerelle nationale'}
                  </span>
                </div>

              </div>

            </div>

          </div>

          {/* Browser Footer Strip */}
          <div className="px-6 py-3 bg-[#f0f0f0] border-t border-[#d8d8d8] flex items-center justify-between text-[13px] text-[#5a5a5a]">
            <span>{isAr ? 'المرجع التشريعي: القانون رقم 23-12 والمرسوم 15-247' : 'Conformité légale : Loi 23-12 & Décret 15-247'}</span>
            <span className="font-mono text-[13px]">DZ-PUBLIC-PROCUREMENT-STANDARD</span>
          </div>

        </div>

      </div>
    </section>
  );
};

export default V3BrowserMockup;
