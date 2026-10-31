import { useI18n } from '@/i18n';
import { Languages, Globe } from 'lucide-react';

export interface LanguageSwitcherProps {
  className?: string;
  variant?: 'minimal' | 'pill' | 'button';
  showLabel?: boolean;
}

export function LanguageSwitcher({
  className = '',
  variant = 'pill',
  showLabel = true,
}: LanguageSwitcherProps) {
  const { lang, setLang, t } = useI18n();

  const toggleLanguage = () => {
    setLang(lang === 'ar' ? 'fr' : 'ar');
  };

  const label = lang === 'ar' ? 'Français' : 'العربية';
  const shortLabel = lang === 'ar' ? 'FR' : 'عربي';

  if (variant === 'minimal') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#0f3154] transition-colors cursor-pointer border-0 bg-transparent ${className}`}
        title={t('common.change_language')}
        aria-label={t('common.change_language')}
      >
        <Languages className="size-4 shrink-0" aria-hidden="true" />
        {showLabel && <span>{shortLabel}</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border border-slate-200 bg-white/90 hover:bg-white text-slate-800 hover:text-[#0f3154] shadow-xs hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857] ${className}`}
      title={t('common.change_language')}
      aria-label={t('common.change_language')}
    >
      <Globe className="size-3.5 shrink-0 text-slate-500" aria-hidden="true" />
      <span>{showLabel ? shortLabel : label}</span>
    </button>
  );
}

export default LanguageSwitcher;
