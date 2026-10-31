import { useI18n } from '@/i18n';
import { TranslationKey } from '@/i18n/ar';
import { useLocation } from 'wouter';
import type { ComponentType } from 'react';
import {
  Home,
  LayoutDashboard,
  Briefcase,
  Inbox,
  FileText,
  Building2,
  CreditCard,
  Bell,
  Archive,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OperatorNavItem {
  id: string;
  labelKey: TranslationKey;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface OperatorSidebarProps {
  onCloseMobile?: () => void;
  className?: string;
}

export function OperatorSidebar({ onCloseMobile, className }: OperatorSidebarProps) {
  const { t } = useI18n();
  const [location, setLocation] = useLocation();

  // The 8 Primary Workspaces
  const primaryNavItems: OperatorNavItem[] = [
    {
      id: 'home',
      labelKey: 'nav.operator.home',
      href: '/operator',
      icon: Home,
    },
    {
      id: 'overview',
      labelKey: 'nav.operator.overview',
      href: '/operator/overview',
      icon: LayoutDashboard,
    },
    {
      id: 'deals',
      labelKey: 'nav.operator.deals',
      href: '/operator/deals',
      icon: Briefcase,
    },
    {
      id: 'offers',
      labelKey: 'nav.operator.offers',
      href: '/operator/offers',
      icon: Inbox,
    },
    {
      id: 'smart_specs',
      labelKey: 'nav.operator.smart_specs',
      href: '/operator/smart-specs',
      icon: FileText,
    },
    {
      id: 'profile',
      labelKey: 'nav.operator.profile',
      href: '/operator/profile',
      icon: Building2,
    },
    {
      id: 'payments',
      labelKey: 'nav.operator.payments',
      href: '/operator/payments',
      icon: CreditCard,
    },
    {
      id: 'notifications',
      labelKey: 'nav.operator.notifications',
      href: '/operator/notifications',
      icon: Bell,
    },
  ];

  // Secondary Archives & Regulatory tools
  const secondaryNavItems: OperatorNavItem[] = [
    {
      id: 'archive',
      labelKey: 'nav.operator.archive',
      href: '/operator/archive',
      icon: Archive,
    },
    {
      id: 'appeals',
      labelKey: 'nav.operator.appeals',
      href: '/operator/appeals',
      icon: ShieldAlert,
    },
  ];

  const handleNavigate = (href: string) => {
    setLocation(href);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const isItemActive = (href: string) => {
    if (href === '/operator') {
      return location === '/operator';
    }
    return location.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'w-64 flex-none flex flex-col border-e border-white/10 bg-[#0f3154] text-white select-none h-full',
        className
      )}
    >
      {/* Navigation Group Header */}
      <div className="px-4 pt-4 pb-2">
        <span className="text-[11px] font-semibold text-white/80">
          {t('topbar.account_label')}
        </span>
      </div>

      {/* 8 Primary Workspace Items */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto min-h-0">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.href);

          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.href)}
              className={cn(
                'w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors duration-150 group text-start',
                active
                  ? 'bg-white text-navy-900 shadow-sm font-bold'
                  : 'text-white hover:text-white hover:bg-white/15'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={cn(
                    'w-4 h-4 flex-none transition-colors',
                    active ? 'text-navy-900' : 'text-white'
                  )}
                />
                <span className="truncate">{t(item.labelKey)}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-none',
                    active
                      ? 'bg-navy-900/15 text-navy-900'
                      : 'bg-white/20 text-white'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Separator for secondary workspaces */}
        <div className="pt-3 pb-1">
          <div className="h-px bg-white/20" />
        </div>

        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.href);

          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.href)}
              className={cn(
                'w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition-colors duration-150 group text-start',
                active
                  ? 'bg-white text-navy-900 font-bold shadow-sm'
                  : 'text-white/85 hover:text-white hover:bg-white/15'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={cn(
                    'w-3.5 h-3.5 flex-none transition-colors',
                    active ? 'text-navy-900' : 'text-white'
                  )}
                />
                <span className="truncate">{t(item.labelKey)}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Institutional Legal Footprint */}
      <div className="p-3 border-t border-white/20 bg-black/10 flex-none">
        <div className="text-[10px] text-white/80 flex items-center justify-between px-1">
          <span>المرسوم الرئاسي 15-247</span>
          <span className="font-mono text-[9px] text-white/90">RTL · 100dvh</span>
        </div>
      </div>
    </aside>
  );
}
