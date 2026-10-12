import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
    >
      {lang === 'ar' ? 'FR' : 'ع'}
    </Button>
  );
}
