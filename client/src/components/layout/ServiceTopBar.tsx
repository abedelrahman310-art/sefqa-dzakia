import React from 'react';
import { PortalTopBar, PortalNavItem } from './PortalTopBar';

export interface ServiceTopBarProps {
  title?: string;
  notificationsCount?: number;
}

const SERVICE_NAV_ITEMS: PortalNavItem[] = [
  { path: '/authority', label: 'نظرة عامة' },
  { path: '/authority/drafts', label: 'مشاريع الصفقات' },
  { path: '/authority/specs', label: 'دفاتر الشروط' },
  { path: '/authority/opening-sessions', label: 'جلسات الفتح' },
  { path: '/authority/committee', label: 'لجان الصفقات' },
  { path: '/authority/offers', label: 'العروض الواردة' },
  { path: '/authority/objections', label: 'الطعون والإسناد' },
  { path: '/authority/reports', label: 'التقارير' },
  { path: '/authority/audit', label: 'سجل التدقيق' },
  { path: '/authority/settings', label: 'الإعدادات' },
];

export function ServiceTopBar({
  title,
  notificationsCount = 0,
}: ServiceTopBarProps) {
  return (
    <PortalTopBar
      title={title}
      navItems={SERVICE_NAV_ITEMS}
      defaultTitle="صفقات ذكية · المصلحة المتعاقدة"
      routePrefix="/authority"
      notificationCount={notificationsCount}
      logoutRedirect="/login"
      pulseColor="var(--stamp-green-500)"
    />
  );
}

export default ServiceTopBar;
