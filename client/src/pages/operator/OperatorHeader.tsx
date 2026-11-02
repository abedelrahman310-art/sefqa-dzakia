import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { useLocation } from 'wouter';
import { Settings, Bell, Globe, User, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OperatorHeaderProps {
  onToggleMobileSidebar?: () => void;
  unreadNotificationsCount?: number;
}

export function OperatorHeader({
  onToggleMobileSidebar,
  unreadNotificationsCount = 0,
}: OperatorHeaderProps) {
  const { t, lang, setLang } = useI18n();
  const { logout, user } = useAuth();
  const [, setLocation] = useLocation();

  const handleLanguageToggle = () => {
    setLang(lang === 'ar' ? 'fr' : 'ar');
  };

  const orgName = user?.organizationName || user?.displayName || user?.email || '';

  return (
    <header className="h-14 flex-none border-b border-border bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-30 px-3 sm:px-6 flex items-center justify-between gap-3">
      {/* Start: Platform Branding & Mobile Toggle */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onToggleMobileSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMobileSidebar}
            className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Toggle navigation"
          >
            <Menu className="w-4 h-4" />
          </Button>
        )}

        <div
          onClick={() => setLocation('/operator')}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded-lg bg-navy-900 text-gold-500 font-extrabold flex items-center justify-center text-xs shadow-sm ring-1 ring-gold-500/20 group-hover:ring-gold-500/40 transition-all flex-none">
            {t('brand.short')}
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-xs font-bold text-navy-900 dark:text-slate-100 tracking-tight">
              {t('brand.title')}
            </span>
            <span className="text-xs text-muted-foreground font-medium mt-0.5">
              {t('operator.header.portal_badge')}
            </span>
          </div>
        </div>
      </div>

      {/* End: Account & System Tools */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* 1. Settings */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/operator/settings')}
          className="h-8 px-2 sm:px-2.5 text-xs text-muted-foreground hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors gap-1.5"
          title={t('header.tools.settings')}
        >
          <Settings className="w-3.5 h-3.5 flex-none" />
          <span className="hidden md:inline">{t('header.tools.settings')}</span>
        </Button>

        {/* 2. Notifications with Badge */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/operator/notifications')}
          className="h-8 px-2 sm:px-2.5 text-xs text-muted-foreground hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative gap-1.5"
          title={t('header.tools.notifications')}
        >
          <Bell className="w-3.5 h-3.5 flex-none" />
          <span className="hidden md:inline">{t('header.tools.notifications')}</span>
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -end-1 bg-amber-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
              {unreadNotificationsCount}
            </span>
          )}
        </Button>

        {/* 3. Language Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLanguageToggle}
          className="h-8 px-2 sm:px-2.5 text-xs text-muted-foreground hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors gap-1.5 font-bold"
          title={t('header.tools.language')}
        >
          <Globe className="w-3.5 h-3.5 flex-none text-emerald-600 dark:text-emerald-400" />
          <span>{lang === 'ar' ? 'Français' : 'العربية'}</span>
        </Button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 sm:mx-1" />

        {/* 4. Profile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/operator/profile')}
          className="h-8 px-2 sm:px-2.5 text-xs text-muted-foreground hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors gap-1.5"
          title={t('header.tools.profile')}
        >
          <User className="w-3.5 h-3.5 flex-none text-navy-700 dark:text-slate-300" />
          <span className="hidden lg:inline max-w-[120px] truncate font-medium">
            {orgName || t('header.tools.profile')}
          </span>
        </Button>

        {/* 5. Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="h-8 px-2 sm:px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors gap-1.5"
          title={t('header.tools.logout')}
        >
          <LogOut className="w-3.5 h-3.5 flex-none" />
          <span className="hidden sm:inline">{t('header.tools.logout')}</span>
        </Button>
      </div>
    </header>
  );
}
