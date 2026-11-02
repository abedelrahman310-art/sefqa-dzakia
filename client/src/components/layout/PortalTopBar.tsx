import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Check,
  Search,
  Calendar,
  MessageSquare,
  User,
  Languages,
  LogOut,
  Sparkles,
  Mic,
} from 'lucide-react';
import { VoiceCopilotWidget } from '@/features/voice/VoiceCopilotWidget';
import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { useLocation } from 'wouter';
import { NotificationDropdown } from './NotificationDropdown';
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

export function PortalTopBar({
  title,
  navItems,
  defaultTitle,
  routePrefix,
  hiddenOnRoutes = [],
  pulseColor = 'var(--color-success-500, var(--stamp-green-500))',
  showLogout = false,
}: PortalTopBarProps) {
  const { lang, setLang, t, dir } = useI18n();
  const { user, logout } = useAuth();
  const [pathname, setLocation] = useLocation();
  const [voiceCopilotOpen, setVoiceCopilotOpen] = React.useState(false);

  const orgName = user?.organizationName || user?.displayName || t('common.organization');

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

  const toggleLang = () => {
    setLang(lang === 'ar' ? 'fr' : 'ar');
  };

  return (
    <header
      className="portal-topbar"
      role="banner"
      dir={dir}
      style={{ '--portal-pulse-color': pulseColor } as React.CSSProperties}
    >
      {/* 1. RTL Start: الشعار واسم المنصة المعتمد */}
      <div className="portal-topbar__start">
        <div className="flex items-center gap-2 text-[var(--ink-900)] font-bold text-sm shrink-0">
          <div className="size-7 rounded-lg bg-[#0b4348] text-white flex items-center justify-center shadow-xs">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="tracking-tight font-extrabold text-[var(--ink-900)] text-sm">
            {t('common.brand')}
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
          <span className="text-xs font-bold text-gray-800">{t('common.lang_switch_short')}</span>
        </button>

        {/* المساعد الصوتي السيادي (Voice Copilot) */}
        <button
          type="button"
          onClick={() => setVoiceCopilotOpen(true)}
          className="portal-topbar__icon-btn bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white transition-colors"
          aria-label="المساعد الصوتي السيادي (Voice Copilot)"
          title="المساعد الصوتي السيادي (Voice Copilot)"
        >
          <Mic className="w-4 h-4 shrink-0 text-emerald-700 hover:text-white" aria-hidden="true" />
        </button>

        {/* 1. المساعد الذكي — أخضر ومميز */}
        <button
          type="button"
          onClick={() => setLocation('/operator/assistant')}
          className="portal-topbar__icon-btn bg-[#047857]/10 hover:bg-[#047857] text-[#047857] hover:text-white transition-colors"
          aria-label={t('common.assistant_rag')}
          title={t('common.assistant_rag')}
        >
          <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
        </button>

        {/* 2. بحث */}
        <button
          type="button"
          onClick={() => setLocation(routePrefix === '/central' ? '/central/deals' : '/operator/deals')}
          className="portal-topbar__icon-btn hover:text-[#0f3154] hover:bg-slate-100 transition-colors"
          aria-label={t('common.search')}
          title={t('common.search')}
        >
          <Search className="w-4 h-4 text-gray-600" aria-hidden="true" />
        </button>

        {/* 3. التقويم */}
        <button
          type="button"
          onClick={() => setLocation(routePrefix === '/central' ? '/central/deals' : '/operator/opening-sessions')}
          className="portal-topbar__icon-btn hover:text-[#0f3154] hover:bg-slate-100 transition-colors"
          aria-label={t('common.calendar')}
          title={t('common.calendar')}
        >
          <Calendar className="w-4 h-4 text-gray-600" aria-hidden="true" />
        </button>

        {/* 4. الرسائل والمحادثة */}
        <button
          type="button"
          onClick={() => setLocation('/operator/assistant')}
          className="portal-topbar__icon-btn hover:text-[#0f3154] hover:bg-slate-100 transition-colors"
          aria-label={t('common.messages')}
          title={t('common.messages')}
        >
          <MessageSquare className="w-4 h-4 text-gray-600" aria-hidden="true" />
        </button>

        {/* 5. الإشعارات */}
        <NotificationDropdown
          buttonClassName="portal-topbar__icon-btn relative hover:text-[#0f3154] hover:bg-slate-100 transition-colors"
          iconSize={16}
          allNotificationsHref={routePrefix === '/central' ? '/central/notifications' : '/operator/notifications'}
        />

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
      <VoiceCopilotWidget isOpen={voiceCopilotOpen} onClose={() => setVoiceCopilotOpen(false)} />
    </header>
  );
}

export default PortalTopBar;
