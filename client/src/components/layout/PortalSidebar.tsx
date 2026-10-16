import React from 'react';
import { LucideIcon, Languages } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/i18n';
import { LogoutButton, DesktopAppButton } from '@/shared/components';

export interface PortalSidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
}

export interface PortalSidebarProps {
  /** "صفقات ذكية" */
  title: string;
  /** "فضاء المصلحة المتعاقدة" */
  subtitle: string;
  items: PortalSidebarItem[];
  /** CSS var name — default 'var(--stamp-green-700)' */
  accentColor?: string;
  /** حرف واحد — إذا وُجد، نعرض دائرة gradient (Central فقط) */
  brandInitial?: string;
  /** show DesktopAppButton in footer */
  showDesktopAppButton?: boolean;
  /** يُستدعى عند النقر على رابط — لإغلاق Sheet الموبايل */
  onLinkClick?: () => void;
}

export function PortalSidebar({
  title,
  subtitle,
  items,
  accentColor = 'var(--stamp-green-700)',
  brandInitial,
  showDesktopAppButton = false,
  onLinkClick,
}: PortalSidebarProps) {
  const { user } = useAuth();
  const { lang, setLang } = useI18n();

  const orgName = user?.organizationName || user?.displayName || user?.email || '';
  const initial = user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'م';

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* 1. Header — ثابت أعلى */}
      <div className="p-5 border-b border-[var(--color-border-subtle)]">
        <h2 className="text-lg font-bold text-[var(--ink-900)] leading-tight">
          {title}
        </h2>
        <p className="text-xs text-[var(--ink-500)] mt-0.5">
          {subtitle}
        </p>
      </div>

      {/* 2. Nav — scrollable وسط */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <a
                onClick={onLinkClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base transition-colors duration-150 ${
                  item.isActive
                    ? 'text-white font-semibold shadow-sm'
                    : 'text-[var(--ink-700)] hover:bg-[var(--paper-100)]'
                }`}
                style={item.isActive ? { backgroundColor: accentColor } : undefined}
              >
                <Icon className="size-5 shrink-0" strokeWidth={2} />
                <span className="truncate">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      {/* 3. User Info + Language Switcher + Logout — ثابت أسفل */}
      <div className="border-t border-[var(--color-border-subtle)] p-4 bg-[var(--paper-100)] flex flex-col gap-3">
        {/* User row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="size-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-none shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--ink-900)] truncate">
                {user?.displayName || orgName}
              </p>
              <p className="text-xs text-[var(--ink-500)] truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>

          {/* Lang toggle */}
          <button
            type="button"
            onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white text-[var(--ink-700)] hover:bg-[var(--paper-200)] transition-colors border border-[var(--color-border-subtle)] shadow-xs flex-none"
            title="تبديل اللغة / Changer de langue"
          >
            <Languages className="w-3.5 h-3.5 text-[var(--ink-500)]" />
            <span>{lang === 'ar' ? 'FR' : 'عربي'}</span>
          </button>
        </div>

        {/* Optional Desktop App Button */}
        {showDesktopAppButton && (
          <DesktopAppButton className="w-full justify-center bg-white hover:bg-[var(--paper-200)] text-[var(--ink-800)] border border-[var(--color-border-subtle)]" />
        )}

        {/* Logout */}
        <LogoutButton variant="sidebar" />
      </div>
    </div>
  );
}

export default PortalSidebar;
