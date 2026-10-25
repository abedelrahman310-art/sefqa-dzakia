import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Check,
  Search,
  Calendar,
  MessageSquare,
  Bell,
  User,
  Languages,
  LogOut,
} from 'lucide-react';
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
  showClock?: boolean;          // deprecated / omitted
  notificationCount?: number;   // default 0
  logoutRedirect?: string;      // default '/login' (retained for compatibility)
  pulseColor?: string;          // CSS var, default 'var(--color-success-500)'
  /** إظهار زر تسجيل الخروج في نهاية الشريط (بوابة الرقابة المركزية) */
  showLogout?: boolean;
}

const TOPBAR_TRANSLATIONS: Record<string, Record<string, string>> = {
  ar: {
    'portal.brand': 'صفقات ذكية',
    'portal.default_org': 'المؤسسة',
    'common.change_language': 'تبديل اللغة',
    'common.notifications': 'التنبيهات',
    'common.search': 'بحث',
    'common.calendar': 'التقويم',
    'common.messages': 'الرسائل',
    'common.logout': 'تسجيل الخروج',
  },
  fr: {
    'portal.brand': 'Safaqat Dhakia',
    'portal.default_org': 'Organisation',
    'common.change_language': 'Changer de langue',
    'common.notifications': 'Notifications',
    'common.search': 'Recherche',
    'common.calendar': 'Calendrier',
    'common.messages': 'Messages',
    'common.logout': 'Déconnexion',
  },
};

export function PortalTopBar({
  title,
  navItems,
  defaultTitle,
  routePrefix,
  hiddenOnRoutes = [],
  notificationCount = 0,
  pulseColor = 'var(--color-success-500, var(--stamp-green-500))',
  showLogout = false,
}: PortalTopBarProps) {
  const { lang, setLang } = useI18n();
  const { user, logout } = useAuth();
  const loc = useLocation();

  const orgName = user?.organizationName || user?.displayName || TOPBAR_TRANSLATIONS[lang]?.['portal.default_org'] || 'المؤسسة';

  // String pathname matching
  const pathname: string = typeof loc === 'string'
    ? loc
    : Array.isArray(loc) && typeof loc[0] === 'string'
      ? loc[0]
      : ((loc as unknown as { pathname?: string })?.pathname ?? '');

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

  const t = (key: string): string => {
    return TOPBAR_TRANSLATIONS[lang]?.[key] || key;
  };

  const toggleLang = () => {
    setLang(lang === 'ar' ? 'fr' : 'ar');
  };

  return (
    <header
      className="portal-topbar"
      role="banner"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{ '--portal-pulse-color': pulseColor } as React.CSSProperties}
    >
      {/* 1. RTL Start: الشعار واسم المنصة المعتمد */}
      <div className="portal-topbar__start">
        <div className="flex items-center gap-2 text-[var(--ink-900)] font-bold text-sm shrink-0">
          <div className="size-7 rounded-lg bg-[#0b4348] text-white flex items-center justify-center shadow-xs">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="tracking-tight font-extrabold text-[var(--ink-900)] text-sm">
            {t('portal.brand')}
          </span>
        </div>
      </div>

      {/* 2. RTL Middle: عنوان الصفحة المحددة */}
      <div className="portal-topbar__middle shrink-0">
        {resolvedTitle && (
          <span className="portal-topbar__breadcrumb text-sm font-bold text-[var(--ink-800)] truncate max-w-[280px]">
            {resolvedTitle}
          </span>
        )}
      </div>

      {/* 3. RTL End: أيقونة اللغة + أدوات العمل (Search, Calendar, MessageSquare, Bell, User) */}
      <div className="portal-topbar__end">
        {/* أيقونة اللغة في الشريط العلوي */}
        <button
          type="button"
          onClick={toggleLang}
          className="portal-topbar__icon-btn portal-topbar__lang-btn"
          aria-label={t('common.change_language')}
          title={t('common.change_language')}
        >
          <Languages className="w-4 h-4 text-gray-700 shrink-0" aria-hidden="true" />
          <span className="text-xs font-bold text-gray-800">{lang === 'ar' ? 'FR' : 'عربي'}</span>
        </button>

        <button
          type="button"
          className="portal-topbar__icon-btn"
          aria-label={t('common.search')}
          title={t('common.search')}
        >
          <Search className="w-4 h-4 text-gray-600" aria-hidden="true" />
        </button>

        <button
          type="button"
          className="portal-topbar__icon-btn"
          aria-label={t('common.calendar')}
          title={t('common.calendar')}
        >
          <Calendar className="w-4 h-4 text-gray-600" aria-hidden="true" />
        </button>

        <button
          type="button"
          className="portal-topbar__icon-btn"
          aria-label={t('common.messages')}
          title={t('common.messages')}
        >
          <MessageSquare className="w-4 h-4 text-gray-600" aria-hidden="true" />
        </button>

        <button
          type="button"
          className="portal-topbar__icon-btn relative"
          aria-label={t('common.notifications')}
          title={t('common.notifications')}
        >
          <Bell className="w-4 h-4 text-gray-600" aria-hidden="true" />
          {notificationCount > 0 ? (
            <span className="portal-topbar__badge">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          ) : (
            <span className="size-2 rounded-full bg-rose-500 absolute top-1.5 inset-inline-end-1.5" />
          )}
        </button>

        {/* الصورة الرمزية للمستخدم */}
        <div
          className="size-8 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs cursor-pointer"
          title={orgName}
        >
          <User className="w-4 h-4" />
        </div>

        {/* تسجيل الخروج — يظهر في بوابة الرقابة المركزية فقط */}
        {showLogout && (
          <button
            type="button"
            onClick={() => {
              void logout();
            }}
            className="portal-topbar__icon-btn text-[var(--stamp-red-700)] hover:bg-red-50"
            aria-label={t('common.logout')}
            title={t('common.logout')}
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="text-sm font-bold">{t('common.logout')}</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default PortalTopBar;
