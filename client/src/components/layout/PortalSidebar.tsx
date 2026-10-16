import { useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/i18n';
import { Link } from 'wouter';
import { Languages, LucideIcon } from 'lucide-react';
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
  brandInitial,
  showDesktopAppButton = false,
  onLinkClick,
}: PortalSidebarProps) {
  const { user } = useAuth();
  const { lang, setLang } = useI18n();

  const orgName = user?.organizationName || user?.displayName || user?.email || '';
  const initial = user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'م';

  return (
    <div className="flex flex-col h-full bg-[var(--stamp-green-700)] select-none text-white">
      {/* 1. Header — منطقة العنوان */}
      <div className="p-5 border-b border-white/10 flex items-center gap-3">
        {brandInitial && (
          <div className="size-10 rounded-xl bg-white text-[var(--stamp-green-700)] font-bold text-base flex items-center justify-center shadow-sm flex-none">
            {brandInitial}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-white leading-tight truncate">
            {title}
          </h2>
          <p className="text-xs text-white/70 mt-0.5 truncate">
            {subtitle}
          </p>
        </div>
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
                    ? 'bg-white text-[var(--stamp-green-700)] font-semibold shadow-sm'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="size-5 shrink-0" strokeWidth={2} />
                <span className="truncate">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      {/* 3. User Info + Language Switcher + Logout — ثابت أسفل */}
      <div className="border-t border-white/10 p-4 bg-[var(--stamp-green-700)] flex flex-col gap-3">
        {/* User row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-full bg-white text-[var(--stamp-green-700)] flex items-center justify-center font-semibold text-sm flex-none shadow-sm">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {user?.displayName || orgName}
              </p>
              <p className="text-xs text-white/70 truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>

          {/* Lang toggle */}
          <button
            type="button"
            onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors shadow-xs flex-none"
            title="تبديل اللغة / Changer de langue"
          >
            <Languages className="w-3.5 h-3.5 text-white/80" />
            <span>{lang === 'ar' ? 'FR' : 'عربي'}</span>
          </button>
        </div>

        {/* Optional Desktop App Button */}
        {showDesktopAppButton && (
          <DesktopAppButton
            variant="ghost"
            className="w-full justify-center bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:text-white [&_svg]:!text-white"
          />
        )}

        {/* Logout */}
        <LogoutButton
          variant="sidebar"
          className="!text-white/90 hover:!text-white hover:!bg-white/10 [&_svg]:!text-white"
        />
      </div>
    </div>
  );
}

export default PortalSidebar;
