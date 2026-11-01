
export function SkylineSilhouette({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
      aria-label="الأفق العمراني للمدينة"
    >
      <path
        d={`
          M 0 130
          L 10 130
          L 10 102
          L 18 102
          L 18 82
          L 28 82
          L 28 62
          L 34 50
          L 40 62
          L 40 92
          L 50 92
          L 50 75
          L 58 75
          L 58 130

          /* Stepped Tower */
          M 56 130
          L 68 130
          L 68 85
          L 76 85
          L 76 68
          L 84 68
          L 84 130

          /* Commercial Building with antenna */
          M 82 130
          L 95 130
          L 95 72
          L 102 72
          L 102 60
          L 104 60
          L 104 42
          L 106 42
          L 106 60
          L 112 60
          L 112 130

          /* Dome */
          M 110 130
          L 122 130
          L 122 96
          C 124 82 144 82 146 96
          L 146 130

          /* Great Mosque Minaret (جامع الجزائر) */
          M 144 130
          L 155 130
          L 155 35
          L 158 35
          L 158 26
          L 162 26
          L 162 12
          L 163 2
          L 164 2
          L 165 12
          L 165 26
          L 169 26
          L 169 35
          L 172 35
          L 172 130

          /* Mosque Grand Dome */
          M 170 130
          L 180 130
          L 180 94
          C 184 76 208 76 212 94
          L 212 130

          /* Angled-Roof Skyscraper */
          M 210 130
          L 224 130
          L 224 58
          L 236 40
          L 242 40
          L 242 130

          /* Modern High-Rise Complex */
          M 240 130
          L 254 130
          L 254 70
          L 266 70
          L 266 52
          L 272 52
          L 272 70
          L 282 70
          L 282 130

          /* Waterfront / Port Buildings */
          M 280 130
          L 298 130
          L 298 84
          L 310 84
          L 310 98
          L 325 98
          L 325 106
          L 340 106
          L 340 130
          Z
        `}
        fill="#081422"
      />
    </svg>
  );
}
