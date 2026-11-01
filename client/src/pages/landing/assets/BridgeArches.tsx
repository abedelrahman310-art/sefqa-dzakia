
export function BridgeArches({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Dynamic bottom bridging curves */}
      <path
        d="M 10 120 C 60 70 160 55 240 120"
        stroke="#005738"
        strokeWidth="1.6"
        strokeOpacity="0.85"
      />
      <path
        d="M 25 120 C 75 75 165 62 250 120"
        stroke="#be123c"
        strokeWidth="1.2"
        strokeOpacity="0.75"
      />
      <path
        d="M 40 120 C 90 82 170 70 260 120"
        stroke="#10b981"
        strokeWidth="1.4"
        strokeOpacity="0.7"
      />
      <path
        d="M 55 120 C 105 88 175 78 270 120"
        stroke="#005738"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <path
        d="M 70 120 C 120 95 180 86 280 120"
        stroke="#94a3b8"
        strokeWidth="0.8"
        strokeOpacity="0.4"
      />
    </svg>
  );
}

export function SwoopArches({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 350"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Right side swooping arcs */}
      <path
        d="M 200 10 C 110 50 80 180 180 340"
        stroke="#10b981"
        strokeWidth="1.5"
        strokeOpacity="0.65"
      />
      <path
        d="M 200 30 C 125 70 95 190 190 330"
        stroke="#005738"
        strokeWidth="1.8"
        strokeOpacity="0.75"
      />
      <path
        d="M 200 50 C 140 90 110 200 200 320"
        stroke="#be123c"
        strokeWidth="1.2"
        strokeOpacity="0.7"
      />
      <path
        d="M 200 70 C 155 110 125 210 200 300"
        stroke="#059669"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <path
        d="M 200 90 C 170 130 140 220 200 280"
        stroke="#94a3b8"
        strokeWidth="0.8"
        strokeOpacity="0.4"
      />
    </svg>
  );
}
