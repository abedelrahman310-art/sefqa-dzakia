import { PortalTopBar, PortalNavItem } from './PortalTopBar';
import { useI18n } from '@/i18n';

export interface CentralAdminTopBarProps {
  title?: string;
  notificationsCount?: number;
}

const CENTRAL_NAV_ITEMS: PortalNavItem[] = [
  { path: '/central/dashboard', label: 'لوحة القيادة' },
  { path: '/central/overview', label: 'مركز المراقبة والتحليل' },
  { path: '/central/map', label: 'الخريطة الحرارية' },
  { path: '/central/authorities', label: 'المصالح المتعاقدة' },
  { path: '/central/operators', label: 'المتعاملين الاقتصاديين' },
  { path: '/central/deals', label: 'الصفقات' },
  { path: '/central/appeals', label: 'الطعون' },
  { path: '/central/reports', label: 'التقارير والإحصائيات' },
  { path: '/central/permissions', label: 'إدارة الصلاحيات' },
];

export function CentralAdminTopBar({
  title,
  notificationsCount = 0,
}: CentralAdminTopBarProps) {
  const { t } = useI18n();

  return (
    <PortalTopBar
      title={title}
      navItems={CENTRAL_NAV_ITEMS}
      defaultTitle={t('central.workspace.title')}
      routePrefix="/central"
      notificationCount={notificationsCount}
      logoutRedirect="/login"
      pulseColor="var(--stamp-green-500)"
    />
  );
}

export default CentralAdminTopBar;
