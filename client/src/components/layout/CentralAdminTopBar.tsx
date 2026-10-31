import { PortalTopBar, PortalNavItem } from './PortalTopBar';
import { useI18n } from '@/i18n';

export interface CentralAdminTopBarProps {
  title?: string;
  notificationsCount?: number;
}

const CENTRAL_NAV_ITEMS = (t: (key: string) => string): PortalNavItem[] => [
  { path: '/central/dashboard', label: t('nav.central.dashboard') },
  { path: '/central/overview', label: t('nav.central.overview') },
  { path: '/central/map', label: t('nav.central.map') },
  { path: '/central/authorities', label: t('nav.central.authorities') },
  { path: '/central/operators', label: t('nav.central.operators') },
  { path: '/central/deals', label: t('nav.central.deals') },
  { path: '/central/appeals', label: t('nav.central.appeals') },
  { path: '/central/reports', label: t('nav.central.reports') },
  { path: '/central/permissions', label: t('nav.central.permissions') },
];

export function CentralAdminTopBar({
  title,
  notificationsCount = 0,
}: CentralAdminTopBarProps) {
  const { t } = useI18n();

  return (
    <PortalTopBar
      title={title}
      navItems={CENTRAL_NAV_ITEMS(t)}
      defaultTitle={t('central.workspace.title')}
      routePrefix="/central"
      notificationCount={notificationsCount}
      logoutRedirect="/login"
      pulseColor="var(--stamp-green-500)"
      showLogout
    />
  );
}

export default CentralAdminTopBar;
