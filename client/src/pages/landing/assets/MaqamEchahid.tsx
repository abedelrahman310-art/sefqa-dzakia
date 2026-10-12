
export function MaqamEchahid({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="رسم معماري لمقام الشهيد"
    >
      {/* Base Platform / Podium Steps */}
      <line x1="10" y1="178" x2="150" y2="178" stroke="#005738" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="20" y1="173" x2="140" y2="173" stroke="#005738" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="32" y1="168" x2="128" y2="168" stroke="#005738" strokeWidth="1.5" strokeLinecap="round" />

      {/* Central Flame Crypt Chamber */}
      <rect x="70" y="152" width="20" height="16" rx="2" stroke="#005738" strokeWidth="1.6" fill="#ffffff" />
      <circle cx="80" cy="160" r="4.5" stroke="#be123c" strokeWidth="1.4" fill="#be123c" fillOpacity="0.25" />

      {/* Left Palm Leaf (Outermost Flared Curve) */}
      <path
        d="M 28 168 C 30 120 48 55 77 22"
        stroke="#005738"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Left Palm Leaf (Inner Flute Curve) */}
      <path
        d="M 54 168 C 56 122 66 65 79 24"
        stroke="#005738"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Left Ribbing Texture Lines */}
      <path d="M 37 168 C 39 122 54 62 77.8 22.8" stroke="#005738" strokeWidth="1" strokeOpacity="0.75" />
      <path d="M 45 168 C 47 122 60 62 78.4 23.4" stroke="#005738" strokeWidth="1" strokeOpacity="0.75" />

      {/* Right Palm Leaf (Outermost Flared Curve) */}
      <path
        d="M 132 168 C 130 120 112 55 83 22"
        stroke="#005738"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Right Palm Leaf (Inner Flute Curve) */}
      <path
        d="M 106 168 C 104 122 94 65 81 24"
        stroke="#005738"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Right Ribbing Texture Lines */}
      <path d="M 123 168 C 121 122 106 62 82.2 22.8" stroke="#005738" strokeWidth="1" strokeOpacity="0.75" />
      <path d="M 115 168 C 113 122 100 62 81.6 23.4" stroke="#005738" strokeWidth="1" strokeOpacity="0.75" />

      {/* Central Leaf Column / Spire */}
      <path
        d="M 73 168 C 74 110 77 55 80 18 C 83 55 86 110 87 168"
        stroke="#005738"
        strokeWidth="1.5"
      />
      <line x1="77" y1="168" x2="78.5" y2="20" stroke="#005738" strokeWidth="0.8" strokeOpacity="0.6" />
      <line x1="83" y1="168" x2="81.5" y2="20" stroke="#005738" strokeWidth="0.8" strokeOpacity="0.6" />

      {/* Turret Assembly & Top Spire */}
      <circle cx="80" cy="22" r="5" stroke="#005738" strokeWidth="1.8" fill="#ffffff" />
      <line x1="74" y1="18" x2="86" y2="18" stroke="#005738" strokeWidth="1.6" />
      <line x1="80" y1="17" x2="80" y2="5" stroke="#005738" strokeWidth="2" strokeLinecap="round" />
      <circle cx="80" cy="4" r="2.2" fill="#005738" />

      {/* Structural Cross-Ties */}
      <path d="M 58 118 C 68 115 92 115 102 118" stroke="#005738" strokeWidth="1.2" strokeOpacity="0.7" />
      <path d="M 66 75 C 73 73 87 73 94 75" stroke="#005738" strokeWidth="1.2" strokeOpacity="0.7" />
    </svg>
  );
}
