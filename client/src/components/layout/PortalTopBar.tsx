import React, { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Settings, Bell, LogOut, Languages, Clock } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { useLocation } from 'wouter';
import './PortalTopBar.css';

export interface PortalNavItem {
  path: string;
  label: string;
  icon?: LucideIcon;
}

export interface PortalTopBarProps {
  title?: string;
  navItems: PortalNavItem[];
  defaultTitle: string;
  routePrefix: string;          // e.g. '/central'
  hiddenOnRoutes?: string[];    // full pathnames
  showClock?: boolean;          // default true
  notificationCount?: number;   // default 0
  logoutRedirect?: string;      // default '/login'
  pulseColor?: string;          // CSS var, default 'var(--color-success-500)'
}

const TOPBAR_TRANSLATIONS: Record<string, Record<string, string>> = {
  ar: {
    'portal.live_clock': 'الساعة الحية والتاريخ الميلادي',
    'common.change_language': 'تبديل اللغة',
    'common.notifications': 'التنبيهات',
    'common.settings': 'الإعدادات',
    'common.logout': 'تسجيل الخروج',
  },
  fr: {
    'portal.live_clock': 'Horloge et date grégorienne en direct',
    'common.change_language': 'Changer de langue',
    'common.notifications': 'Notifications',
    'common.settings': 'Paramètres',
    'common.logout': 'Déconnexion',
  },
};

export function PortalTopBar({
  title,
  navItems,
  defaultTitle,
  routePrefix,
  hiddenOnRoutes = [],
  showClock = true,
  notificationCount = 0,
  logoutRedirect = '/login',
  pulseColor = 'var(--color-success-500, var(--stamp-green-500))',
}: PortalTopBarProps) {
  const { lang, setLang } = useI18n();
  const { logout } = useAuth();
  const loc = useLocation();
  const [now, setNow] = useState(new Date());

  // String pathname matching
  const pathname: string = typeof loc === 'string'
    ? loc
    : Array.isArray(loc) && typeof loc[0] === 'string'
      ? loc[0]
      : ((loc as unknown as { pathname?: string })?.pathname ?? '');

  const setLocation = Array.isArray(loc) && typeof loc[1] === 'function'
    ? loc[1]
    : () => { window.location.href = logoutRedirect; };

  useEffect(() => {
    if (!showClock) return;
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [showClock]);

  // Hide on configured routes (e.g. interactive full-screen maps)
  if (hiddenOnRoutes.includes(pathname)) {
    return null;
  }

  // Derive title from active route or explicit override
  let resolvedTitle = title;
  if (!resolvedTitle) {
    const matchedItem = navItems.find((item) => item.path === pathname)
      || navItems.find((item) => pathname.startsWith(item.path) && item.path !== routePrefix);
    resolvedTitle = matchedItem?.label ?? defaultTitle;
  }

  const timeStr = now.toLocaleTimeString('ar-DZ', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const gregorianDate = now.toLocaleDateString('ar-DZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const t = (key: string): string => {
    return TOPBAR_TRANSLATIONS[lang]?.[key] || key;
  };

  const toggleLang = () => {
    setLang(lang === 'ar' ? 'fr' : 'ar');
  };

  const handleLogout = () => {
    logout();
    setLocation(logoutRedirect);
  };

  return (
    <header
      className="portal-topbar"
      role="banner"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{ '--portal-pulse-color': pulseColor } as React.CSSProperties}
    >
      <div className="portal-topbar__start">
        <span className="portal-topbar__breadcrumb">
          {resolvedTitle}
        </span>
      </div>

      {showClock && (
        <div
          className="portal-topbar__clock"
          role="status"
          aria-live="polite"
          aria-label={t('portal.live_clock')}
        >
          <Clock className="portal-topbar__clock-icon" aria-hidden="true" />
          <span className="portal-topbar__time font-mono" dir="ltr">
            {timeStr}
          </span>
          <span className="portal-topbar__divider" aria-hidden="true">|</span>
          <span className="portal-topbar__date hidden md:inline">
            {gregorianDate}
          </span>
          <span className="portal-topbar__pulse" aria-hidden="true" />
        </div>
      )}

      <div className="portal-topbar__end">
        <button
          type="button"
          className="portal-topbar__icon-btn"
          onClick={toggleLang}
          aria-label={t('common.change_language')}
          title={t('common.change_language')}
        >
          <Languages className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline text-xs font-semibold">
            {lang === 'ar' ? 'FR' : 'عربي'}
          </span>
        </button>

        <button
          type="button"
          className="portal-topbar__icon-btn relative"
          aria-label={t('common.notifications')}
          title={t('common.notifications')}
        >
          <Bell className="w-4 h-4" aria-hidden="true" />
          {notificationCount > 0 && (
            <span className="portal-topbar__badge">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className="portal-topbar__icon-btn"
          aria-label={t('common.settings')}
          title={t('common.settings')}
        >
          <Settings className="w-4 h-4" aria-hidden="true" />
        </button>

        <span className="portal-topbar__sep" aria-hidden="true" />

        <button
          type="button"
          className="portal-topbar__logout"
          onClick={handleLogout}
          aria-label={t('common.logout')}
          title={t('common.logout')}
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline text-xs font-semibold">
            {t('common.logout')}
          </span>
        </button>
      </div>
    </header>
  );
}

export default PortalTopBar;
