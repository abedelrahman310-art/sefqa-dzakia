import React, { useId } from 'react';

interface LogoProps {
  size?: number | string;
  className?: string;
}

/**
 * شعار صفقات ذكية — ثلاث طبقات ثلاثية الأبعاد (أخضر، أبيض، أحمر) مع حركة طفو.
 *
 * - المعرّفات (التدرجات) تُولَّد بـ useId وتُنظَّف من النقطتين لأن معرّفات React
 *   تحتوي ": " وقد تفشل مراجع url(#…) في بعض المتصفحات. كل نسخة من الشعار تحصل
 *   على معرّفات فريدة فلا يتعارض شعاران في الصفحة نفسها.
 * - أنماط الحركة في client/src/components/ui/logo.css (مستوردة في index.css
 *   ومحقونة أيضاً داخل Shadow DOM صفحة الهبوط).
 * - يُصدَّر تصديراً مُسمّى وافتراضياً معاً لأن بعض المواضع تستورد { Logo }.
 */
const Logo: React.FC<LogoProps> = ({ size = 44, className = '' }) => {
  const uniqueId = useId().replace(/:/g, '');
  const greenId = `logo-green-${uniqueId}`;
  const whiteId = `logo-white-${uniqueId}`;
  const redId = `logo-red-${uniqueId}`;
  const glossId = `logo-gloss-${uniqueId}`;

  return (
    <svg
      viewBox="0 0 240 260"
      style={{ width: size, height: size }}
      className={`logo-anim ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={greenId} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#54e69b" />
          <stop offset=".5" stopColor="#08a85e" />
          <stop offset="1" stopColor="#006c42" />
        </linearGradient>
        <linearGradient id={whiteId} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ffffff" />
          <stop offset=".65" stopColor="#f5f8f7" />
          <stop offset="1" stopColor="#dce5e1" />
        </linearGradient>
        <linearGradient id={redId} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ff7777" />
          <stop offset=".5" stopColor="#e52332" />
          <stop offset="1" stopColor="#a90020" />
        </linearGradient>
        <linearGradient id={glossId} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ffffff" stopOpacity=".45" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* الطبقة الحمراء */}
      <g className="logo-layer logo-red">
        <path
          d="M120 145 L220 195 L120 250 L20 195 Z"
          fill="#8d1023"
          opacity=".25"
          transform="translate(0 5)"
        />
        <path
          className="logo-face"
          d="M120 135 L220 185 L120 235 L20 185 Z"
          fill={`url(#${redId})`}
        />
        <path d="M120 135 L220 185 L120 205 L20 185 Z" fill={`url(#${glossId})`} />
      </g>

      {/* الطبقة البيضاء */}
      <g className="logo-layer logo-white">
        <path
          d="M120 82 L220 132 L120 182 L20 132 Z"
          fill="#aebcb6"
          opacity=".5"
          transform="translate(0 5)"
        />
        <path
          className="logo-face"
          d="M120 72 L220 122 L120 172 L20 122 Z"
          fill={`url(#${whiteId})`}
          stroke="#dce5e1"
          strokeWidth="1"
        />
        <path d="M120 72 L220 122 L120 142 L20 122 Z" fill={`url(#${glossId})`} />
      </g>

      {/* الطبقة الخضراء */}
      <g className="logo-layer logo-green">
        <path
          d="M120 9 L220 59 L120 109 L20 59 Z"
          fill="#006b40"
          opacity=".3"
          transform="translate(0 5)"
        />
        <path
          className="logo-face"
          d="M120 0 L220 50 L120 100 L20 50 Z"
          fill={`url(#${greenId})`}
        />
        <path d="M120 0 L220 50 L120 70 L20 50 Z" fill={`url(#${glossId})`} />
      </g>
    </svg>
  );
};

export { Logo };
export default Logo;
