import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { useSearch } from 'wouter/use-location';
import { useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/i18n';
import {
  Search,
  Building2,
  LogOut,
  Menu,
  Sparkles,
  Calendar,
  Settings,
} from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { OrgLogo } from '@/components/common/OrgLogo';
import { AIChatAssistant } from '@/features/ai/components/AIChatAssistant';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface OperatorTopBarProps {
  /** Current section label shown after the portal breadcrumb. */
  breadcrumb?: string;
  /** Opens the mobile navigation drawer. */
  onMenuClick?: () => void;
  notificationsCount?: number;
}

export function OperatorTopBar({
  breadcrumb,
  onMenuClick,
}: OperatorTopBarProps) {
  const { logout } = useAuth();
  const { lang, setLang, t, dir } = useI18n();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [query, setQuery] = useState('');
  const currentBreadcrumb = breadcrumb ?? t('nav.operator.workspace');

  useEffect(() => {
    setQuery(new URLSearchParams(search).get('q') || '');
  }, [search]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim();
    setLocation(q ? `/operator/deals?q=${encodeURIComponent(q)}` : '/operator/deals');
  };

  const toggleLang = () => {
    setLang(lang === 'ar' ? 'fr' : 'ar');
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    window.location.href = '/login';
  };

  return (
    <header className="op-topbar">
      <button
        type="button"
        onClick={onMenuClick}
        className="op-icon-btn op-menu-btn"
        aria-label={t('common.open_menu')}
        title={t('common.open_menu')}
      >
        <Menu aria-hidden="true" />
      </button>

      <div className="op-breadcrumb" aria-label={t('common.breadcrumb')}>
        <span className="op-breadcrumb-label">{t('common.operator_breadcrumb')}</span>
        <span className="op-breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <strong>{currentBreadcrumb}</strong>
      </div>

      <form className="op-search" role="search" onSubmit={handleSearch}>
        <Search aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('common.search_deals_placeholder')}
          aria-label={t('common.search_deals_placeholder')}
        />
      </form>

      <div className="op-topbar-actions">
        <button
          type="button"
          onClick={toggleLang}
          className="op-icon-btn op-lang-btn"
          lang="fr"
          dir="ltr"
          title={t('common.change_language')}
          aria-label={t('common.change_language')}
        >
          {t('common.lang_switch_short')}
        </button>

        <button
          type="button"
          onClick={() => setAiAssistantOpen(true)}
          className="op-icon-btn bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
          aria-label={t('common.assistant_rag')}
          title={t('common.assistant_rag')}
        >
          <Sparkles className="size-4" aria-hidden="true" />
        </button>

        <Link href="/operator/opening-sessions">
          <a
            href="/operator/opening-sessions"
            className="op-icon-btn op-hide-sm"
            aria-label={t('common.opening_schedule')}
            title={t('common.opening_schedule')}
          >
            <Calendar className="size-4" aria-hidden="true" />
          </a>
        </Link>

        <NotificationDropdown
          buttonClassName="op-icon-btn relative"
          iconSize={16}
          allNotificationsHref="/operator/notifications"
        />

        <Link href="/operator/settings">
          <a
            href="/operator/settings"
            className="op-icon-btn op-hide-sm"
            aria-label={t('common.settings') || 'الإعدادات'}
            title={t('common.settings') || 'الإعدادات'}
          >
            <Settings className="size-4 text-gray-600" aria-hidden="true" />
          </a>
        </Link>

        <Link href="/operator/profile">
          <a
            href="/operator/profile"
            className="op-icon-btn op-hide-sm"
            aria-label={t('nav.operator.profile')}
            title={t('nav.operator.profile')}
          >
            <OrgLogo
              portal="operator"
              className="size-full rounded-[10px]"
              fallback={<Building2 aria-hidden="true" />}
            />
          </a>
        </Link>

        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="op-icon-btn danger"
          aria-label={t('common.logout')}
          title={t('common.logout')}
        >
          <LogOut aria-hidden="true" />
        </button>
      </div>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.logout_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.logout_confirm_message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-[#e63946] hover:bg-[#c62f3b] text-white"
            >
              {t('common.logout')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AIChatAssistant open={aiAssistantOpen} onOpenChange={setAiAssistantOpen} showTrigger={false} />
    </header>
  );
}

export default OperatorTopBar;
