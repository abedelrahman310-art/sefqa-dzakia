import React, { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, QrCode, Copy, Check } from 'lucide-react';
import { useI18n } from '@/i18n';
import { getPlatformSiteUrl } from '@/config/site';

interface V3QrCodeCardProps {
  className?: string;
  size?: number;
}

export const V3QrCodeCard: React.FC<V3QrCodeCardProps> = ({
  className = '',
  size = 136,
}) => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';
  const [copied, setCopied] = useState(false);

  const siteUrl = useMemo(() => getPlatformSiteUrl(), []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is unavailable
    }
  };

  const headingText = isAr
    ? 'امسح للدخول إلى المنصة'
    : 'Scannez pour accéder à la plateforme';

  const descText = isAr
    ? 'امسح الرمز للوصول إلى منصة صفقات ذكية من هاتفك'
    : 'Scannez le code pour accéder à Safaqat depuis votre smartphone';

  const qrAlt = isAr
    ? 'رمز استجابة سريعة QR للدخول المباشر إلى منصة صفقات ذكية'
    : 'Code QR pour accéder directement à la plateforme Safaqat';

  return (
    <div
      dir={dir}
      className={`group relative rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center justify-between text-center overflow-hidden ${className}`}
    >
      {/* لمسة خلفية خفيفة جداً من درجات الزليج الهادئة */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(#006233 0.75px, transparent 0.75px)`,
          backgroundSize: '16px 16px',
        }}
      />

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* شريط العنوان مع أيقونة الهاتف المضيئة */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <div className="size-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#006233] shadow-2xs group-hover:scale-105 transition-transform">
            <Smartphone className="size-4" strokeWidth={2} />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight select-none">
            {headingText}
          </h3>
        </div>

        {/* إطار رمز QR الأبيض النقي مع حواف كاميرا الماسح الضوئي (Viewfinder brackets) */}
        <div className="relative mx-auto w-fit p-1">
          {/* حواف الماسح الأربعة */}
          <div className="absolute top-0 start-0 size-3 border-t-2 border-s-2 border-emerald-600 rounded-tl-sm pointer-events-none" />
          <div className="absolute top-0 end-0 size-3 border-t-2 border-e-2 border-emerald-600 rounded-tr-sm pointer-events-none" />
          <div className="absolute bottom-0 start-0 size-3 border-b-2 border-s-2 border-emerald-600 rounded-bl-sm pointer-events-none" />
          <div className="absolute bottom-0 end-0 size-3 border-b-2 border-e-2 border-emerald-600 rounded-br-sm pointer-events-none" />

          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs group-hover:border-emerald-300 group-hover:shadow-xs transition-all">
            <QRCodeSVG
              value={siteUrl}
              size={size}
              level="M"
              bgColor="#ffffff"
              fgColor="#0f172a"
              marginSize={1}
              role="img"
              aria-label={qrAlt}
              title={headingText}
            />
          </div>
        </div>

        {/* وصف توجيهي هادئ وخالٍ من الفواصل والنقاط */}
        <p className="mt-3.5 text-xs text-slate-600 font-medium leading-relaxed max-w-[220px]">
          {descText}
        </p>

        {/* زر نسخ الرابط وشارة العنوان */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 hover:bg-emerald-50 border border-slate-200/90 hover:border-emerald-300 text-[11px] font-mono font-semibold text-slate-700 hover:text-emerald-800 transition-colors shadow-2xs cursor-pointer active:scale-95"
          title={isAr ? 'نسخ رابط المنصة' : 'Copier le lien'}
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-600" />
              <span className="font-sans font-bold text-emerald-700">{isAr ? 'تم النسخ' : 'Copié'}</span>
            </>
          ) : (
            <>
              <Copy className="size-3 text-slate-400 group-hover:text-emerald-600" />
              <span className="truncate max-w-[150px]">{siteUrl.replace(/^https?:\/\//, '')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default V3QrCodeCard;
