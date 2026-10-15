import React from 'react';
import { PortalTopBar, PortalNavItem } from './PortalTopBar';

export interface OperatorTopBarProps {
  title?: string;
  notificationsCount?: number;
}

const OPERATOR_NAV_ITEMS: PortalNavItem[] = [
  { path: '/operator', label: 'نظرة عامة' },
  { path: '/operator/deals', label: 'الفرص والصفقات' },
  { path: '/operator/opportunities', label: 'الفرص المتاحة' },
  { path: '/operator/profile', label: 'الملف التعريفي' },
  { path: '/operator/offers', label: 'العروض المقدمة' },
  { path: '/operator/opening-sessions', label: 'جلسات فتح الأظرفة' },
  { path: '/operator/objections', label: 'الطعون والمنازعات' },
  { path: '/operator/smart-specs', label: 'دفاتر الشروط الذكية' },
  { path: '/operator/archive', label: 'الأرشيف' },
  { path: '/operator/settings', label: 'الإعدادات' },
];

export function OperatorTopBar({
  title,
  notificationsCount = 0,
}: OperatorTopBarProps) {
  return (
    <PortalTopBar
      title={title}
      navItems={OPERATOR_NAV_ITEMS}
      defaultTitle="صفقات ذكية · المتعامل الاقتصادي"
      routePrefix="/operator"
      notificationCount={notificationsCount}
      logoutRedirect="/login"
      pulseColor="var(--sepia-500, var(--stamp-gold-500))"
    />
  );
}

export default OperatorTopBar;
