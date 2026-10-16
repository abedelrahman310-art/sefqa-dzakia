import { useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/i18n';
import { Link } from 'wouter';
import { Languages, LucideIcon, HelpCircle } from 'lucide-react';
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
  /** عنوان شارة مميز بأيقونة صفراء مثل: "• بوابة المتعامل الاقتصادي" */
  badgeTitle?: string;
  /** إخفاء اسم وبيانات المستخدم من التذييل */
  hideUserInfo?: boolean;
}

export function PortalSidebar({
  title,
  subtitle,
  items,
  brandInitial,
  showDesktopAppButton = false,
  onLinkClick,
  badgeTitle,
  hideUserInfo = false,
}: PortalSidebarProps) {
  const { user } = useAuth();
  const { lang, setLang } = useI18n();

  const orgName = user?.organizationName || user?.displayName || user?.email || '';
  const initial = user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'م';

  return (
    <div className="flex flex-col h-full bg-[#0b4348] select-none text-white">
      {/* 1. Header — منطقة العنوان */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        {badgeTitle ? (
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm tracking-wide">
            <span className="size-2 rounded-full bg-amber-400 shrink-0 shadow-xs" />
            <span>{badgeTitle.replace(/^[•\s]+/, '')}</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {brandInitial && (
              <div className="size-10 rounded-xl bg-white text-[#0b4348] font-bold text-base flex items-center justify-center shadow-sm flex-none">
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
        )}
      </div>

      {/* 2. Nav — scrollable وسط */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <a
                onClick={onLinkClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  item.isActive
                    ? 'bg-white text-[#0b4348] font-bold shadow-xs'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`size-5 shrink-0 ${item.isActive ? 'text-[#0b4348]' : 'text-white/85'}`} strokeWidth={2} />
                <span className="truncate">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      {/* 3. Footer — إما تذييل المساعدة النظيف أو معلومات المستخدم */}
      {hideUserInfo ? (
        <div className="border-t border-white/10 p-3 bg-[#0b4348] flex flex-col gap-1">
          <Link href="/operator/settings">
            <a
              onClick={onLinkClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
            >
              <HelpCircle className="size-5 shrink-0 text-white/80" />
              <span>{lang === 'ar' ? 'المساعدة' : 'Aide'}</span>
            </a>
          </Link>
        </div>
      ) : (
        <div className="border-t border-white/10 p-4 bg-[#0b4348] flex flex-col gap-3">
          {/* User row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-full bg-white text-[#0b4348] flex items-center justify-center font-semibold text-sm flex-none shadow-sm">
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
      )}
    </div>
  );
}

export default PortalSidebar;
