import React, { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Check,
  MapPin,
  Sparkles,
  Clock,
  Search,
  Calendar,
  MessageSquare,
  Bell,
  LogOut,
  User,
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
  showClock?: boolean;          // default true
  notificationCount?: number;   // default 0
  logoutRedirect?: string;      // default '/login' (retained for compatibility)
  pulseColor?: string;          // CSS var, default 'var(--color-success-500)'
}

const TOPBAR_TRANSLATIONS: Record<string, Record<string, string>> = {
  ar: {
    'portal.brand': 'صفقات ذكية',
    'portal.ai_assistant': 'المساعد الذكي',
    'portal.default_org': 'المؤسسة',
    'portal.live_clock': 'الساعة الحية والتاريخ الميلادي',
    'common.change_language': 'تبديل اللغة',
    'common.notifications': 'التنبيهات',
    'common.search': 'بحث',
    'common.calendar': 'التقويم',
    'common.messages': 'الرسائل',
    'common.logout': 'تسجيل الخروج',
  },
  fr: {
    'portal.brand': 'Safaqat Dhakia',
    'portal.ai_assistant': 'Assistant IA',
    'portal.default_org': 'Organisation',
    'portal.live_clock': 'Horloge et date grégorienne en direct',
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
  showClock = true,
  notificationCount = 0,
  pulseColor = 'var(--color-success-500, var(--stamp-green-500))',
  logoutRedirect = '/login',
}: PortalTopBarProps) {
  const { lang, setLang } = useI18n();
  const { user, logout } = useAuth();
  const loc = useLocation();
  const [now, setNow] = useState(new Date());

  const orgName = user?.organizationName || user?.displayName || TOPBAR_TRANSLATIONS[lang]?.['portal.default_org'] || 'المؤسسة';

  // String pathname matching
  const pathname: string = typeof loc === 'string'
    ? loc
    : Array.isArray(loc) && typeof loc[0] === 'string'
      ? loc[0]
      : ((loc as unknown as { pathname?: string })?.pathname ?? '');

  const setLocation = Array.isArray(loc) && typeof loc[1] === 'function'
    ? loc[1]
    : (url: string) => { window.location.href = url; };

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
      {/* 1. RTL Start: الشعار، كبسولة المؤسسة، زر FR، زر المساعد الذكي */}
      <div className="portal-topbar__start">
        {/* الشعار والاسم: صفقات ذكية */}
        <div className="flex items-center gap-2 text-[var(--ink-900)] font-bold text-sm shrink-0">
          <div className="size-7 rounded-lg bg-[#0b4348] text-white flex items-center justify-center shadow-xs">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="hidden sm:inline tracking-tight font-extrabold text-[var(--ink-900)] text-sm">
            {t('portal.brand')}
          </span>
        </div>

        {/* كبسولة المؤسسة: المؤسسة: [اسم المؤسسة] */}
        <div className="bg-[#e8f5f1] text-[#0b4348] border border-[#a7d9cc] rounded-full px-3 py-1 text-xs font-semibold max-w-[180px] md:max-w-[260px] truncate shadow-xs shrink-0 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#0b4348] shrink-0" />
          <span className="truncate">{`المؤسسة: [${orgName}]`}</span>
        </div>

        {/* زر تبديل اللغة */}
        <button
          type="button"
          onClick={toggleLang}
          className="text-xs font-bold text-[var(--ink-800)] hover:bg-gray-100 px-2.5 py-1 rounded-md transition-colors shrink-0"
          aria-label={t('common.change_language')}
          title={t('common.change_language')}
        >
          <span>{lang === 'ar' ? 'FR' : 'عربي'}</span>
        </button>

        {/* زر المساعد الذكي */}
        <button
          type="button"
          className="flex items-center gap-1.5 bg-[#047857] hover:bg-[#065f46] text-white rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors shadow-xs shrink-0"
          title={t('portal.ai_assistant')}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
          <span className="hidden md:inline">{t('portal.ai_assistant')}</span>
        </button>
      </div>

      {/* 2. RTL Middle: عنوان الصفحة + الساعة والتاريخ (شاشات عريضة) */}
      <div className="portal-topbar__middle">
        {resolvedTitle && (
          <span className="portal-topbar__breadcrumb hidden lg:inline text-xs font-semibold text-[var(--ink-700)]">
            {resolvedTitle}
          </span>
        )}

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
            <span className="portal-topbar__date hidden xl:inline">
              {gregorianDate}
            </span>
            <span className="portal-topbar__pulse" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* 3. RTL End: أيقونات (Search, Calendar, MessageSquare, Bell, Logout, User) */}
      <div className="portal-topbar__end">
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

        {/* زر تسجيل الخروج في الشريط العلوي */}
        <button
          type="button"
          onClick={handleLogout}
          className="portal-topbar__icon-btn text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          aria-label={t('common.logout')}
          title={t('common.logout')}
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* الصورة الرمزية للمستخدم */}
        <div
          className="size-8 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs cursor-pointer"
          title={orgName}
        >
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
}

export default PortalTopBar;
