import React, { useMemo } from 'react';
import { useI18n } from '@/i18n';

interface PasswordStrengthMeterProps {
  password: string;
}

export function evaluatePasswordStrength(pass: string): { score: number; labelKey: string } {
  if (!pass) return { score: 0, labelKey: '' };

  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
  if (/\d/.test(pass)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pass) || pass.length >= 12) score++;

  if (score === 0 && pass.length > 0) score = 1;

  const labelKeys = [
    '',
    'register.redesign.strength.weak',
    'register.redesign.strength.fair',
    'register.redesign.strength.strong',
    'register.redesign.strength.very_strong',
  ];

  return { score, labelKey: labelKeys[score] || '' };
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { t } = useI18n();
  const { score, labelKey } = useMemo(() => evaluatePasswordStrength(password), [password]);

  if (!password) return null;

  const getBarColor = (index: number) => {
    if (index >= score) return 'bg-slate-200';
    switch (score) {
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-amber-500';
      case 3:
        return 'bg-emerald-500';
      case 4:
        return 'bg-sky-600';
      default:
        return 'bg-slate-200';
    }
  };

  const getTextColor = () => {
    switch (score) {
      case 1:
        return 'text-red-600';
      case 2:
        return 'text-amber-600';
      case 3:
        return 'text-emerald-600';
      case 4:
        return 'text-sky-600';
      default:
        return 'text-slate-500';
    }
  };

  return (
    <div className="space-y-1.5 pt-1 select-none">
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`h-full rounded-full transition-all duration-300 ${getBarColor(idx)}`}
          />
        ))}
      </div>
      {labelKey && (
        <div className="flex items-center justify-between text-[11px] leading-none">
          <span className="text-slate-500">{t('register.redesign.password')}</span>
          <span className={`font-bold transition-colors duration-200 ${getTextColor()}`}>
            {t(labelKey as any)}
          </span>
        </div>
      )}
    </div>
  );
}

export default PasswordStrengthMeter;
