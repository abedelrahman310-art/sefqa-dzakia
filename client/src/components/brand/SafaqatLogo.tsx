import { useId } from 'react';

export interface SafaqatLogoProps {
  size?: number;
  className?: string;
  /** Accessible label; set to an empty string when the logo is decorative. */
  title?: string;
}

/**
 * Official "صفقات ذكية" logo mark (green tile, gold dot, Arabic ص).
 *
 * Kept as an inline SVG so it inherits crisp rendering and can be reused
 * across the operator, authority, and public-facing shells.
 */
export function SafaqatLogo({
  size = 44,
  className = '',
  title = 'شعار صفقات ذكية',
}: SafaqatLogoProps) {
  const titleId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
      role="img"
      aria-labelledby={title ? titleId : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <rect width="512" height="512" rx="100" fill="#1B4332" />
      <circle cx="256" cy="100" r="20" fill="#B8860B" />
      <text
        x="256"
        y="340"
        fontFamily="'Cairo', 'Tahoma', 'Arial', sans-serif"
        fontSize="280"
        fontWeight="bold"
        fill="#FFFAFA"
        textAnchor="middle"
      >
        ص
      </text>
    </svg>
  );
}

export default SafaqatLogo;
