import { useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/i18n';
import { Link } from 'wouter';
import { Languages, LucideIcon, HelpCircle, X, Check } from 'lucide-react';
import { LogoutButton, DesktopAppButton } from '@/shared/components';
import { SafaqatLogo } from '@/components/brand/SafaqatLogo';

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
  /** نمط القائمة الجانبية: 'default' | 'mint' | 'operator' | 'authority' | 'sovereign' */
  variant?: 'default' | 'mint' | 'operator' | 'authority' | 'sovereign';
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
  variant = 'default',
}: PortalSidebarProps) {
  const { user } = useAuth();
  const { lang, setLang } = useI18n();

  const orgName = user?.organizationName || user?.displayName || user?.email || '';
  const initial = user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'م';
  const isOperator = variant === 'operator';
  const isMint = variant === 'mint';

  /**
   * النمط السيادي (الإدارة المركزية): أزرق رسمي عميق، نصوص وأيقونات بيضاء،
   * والعنصر النشط بخلفية بيضاء ونص أزرق داكن.
   */
  if (variant === 'sovereign') {
    return (
      <div className="flex h-full w-full select-none flex-col bg-[#0f3154] font-sans text-white">
        {/* 1. منطقة الهوية */}
        <div className="flex flex-none items-center justify-between gap-3 border-b border-white/10 px-5 py-[18px]">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 flex-none items-center justify-center rounded-xl bg-white text-base font-bold text-[#0f3154] shadow-sm">
              {brandInitial || 'ص'}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold leading-tight text-white">{title}</h2>
              <p className="mt-0.5 truncate text-sm text-white/70">{subtitle}</p>
            </div>
          </div>
          {onLinkClick && (
            <button
              type="button"
              onClick={onLinkClick}
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg border-0 bg-white/10 text-white hover:bg-white/20 md:hidden"
              aria-label="إغلاق القائمة"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* 2. عناصر التنقل */}
        <nav
          className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-4 pb-6"
          aria-label="التنقل الرئيسي"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <a
                  onClick={onLinkClick}
                  aria-current={item.isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                    item.isActive
                      ? 'bg-white font-bold text-[#0f3154] shadow-sm'
                      : 'text-white hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`size-5 shrink-0 ${
                      item.isActive ? 'text-[#0f3154]' : 'text-white'
                    }`}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  if (isOperator) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] select-none text-white font-sans w-full">
        {/* 1. Logo area — crisp header */}
        <div className="h-[72px] flex-none bg-white/10 backdrop-blur-xs flex items-center justify-between gap-2.5 px-4 border-b border-white/20">
          <div className="flex items-center gap-2.5">
            <div className="bg-white p-1 rounded-xl shadow-xs">
              <SafaqatLogo size={36} title="" className="shrink-0" />
            </div>
            <span className="text-[20px] font-extrabold text-white">صفقات ذكية</span>
          </div>
          {onLinkClick && (
            <button
              type="button"
              onClick={onLinkClick}
              className="md:hidden size-11 rounded-[10px] bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer border-0"
              aria-label="إغلاق القائمة"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 2. Role header badge */}
        <div className="flex items-center gap-2 mx-4 mt-4 mb-2 text-[13px] font-bold text-white/90">
          <span className="size-2 rounded-full bg-white inline-block shrink-0 shadow-xs" />
          <span>بوابة المتعامل الاقتصادي</span>
        </div>

        {/* 3. Navigation items */}
        <nav className="flex-1 min-h-0 flex flex-col gap-1.5 p-2 px-3 overflow-y-auto pb-4" aria-label="التنقل الرئيسي">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <a
                  onClick={onLinkClick}
                  className={`flex items-center gap-3 min-h-[46px] px-3.5 py-1.5 rounded-lg text-[15px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    item.isActive
                      ? 'bg-white text-[#0284c7] hover:bg-white hover:text-[#0284c7] shadow-sm font-bold'
                      : 'text-white hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`size-[22px] shrink-0 ${
                      item.isActive ? 'text-[#0284c7]' : 'text-white'
                    }`}
                    strokeWidth={1.8}
                  />
                  <span className="whitespace-normal break-words leading-snug text-start flex-1">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  if (variant === 'authority') {
    return (
      <div className="flex flex-col h-full bg-[#0b4348] select-none text-white font-sans w-full">
        {/* 1. Header — منطقة العنوان */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white text-[#0b4348] font-bold text-base flex items-center justify-center shadow-sm flex-none">
              <Check className="size-6 stroke-[3]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white leading-tight truncate">
                {title}
              </h2>
              <p className="text-xs text-white/70 mt-0.5 truncate">
                {subtitle}
              </p>
            </div>
          </div>
          {onLinkClick && (
            <button
              type="button"
              onClick={onLinkClick}
              className="md:hidden size-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer border-0"
              aria-label="إغلاق القائمة"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 2. Navigation items — تملأ المساحة الرأسية كاملة بسلاسة وبدون أي تذييل */}
        <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1.5 pb-6" aria-label="التنقل الرئيسي">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <a
                  onClick={onLinkClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
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
      </div>
    );
  }

  if (isMint) {
    return (
      <div className="flex flex-col h-full bg-[#F2FBF7] select-none text-[#5B6472] border-l border-[#E7EAED] font-sans">
        {/* 1. Header — منطقة العنوان */}
        <div className="px-4 py-5 border-b border-[#E7EAED] flex items-center justify-between">
          {badgeTitle ? (
            <div className="flex items-center gap-2 text-[#1F6B54] font-bold text-sm tracking-wide">
              <span className="size-2 rounded-full bg-[#3EB489] shrink-0 shadow-xs" />
              <span>{badgeTitle.replace(/^[•\s]+/, '')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {brandInitial && (
                <div className="size-10 rounded-xl bg-white text-[#1F6B54] border border-[#E7EAED] font-bold text-base flex items-center justify-center shadow-xs flex-none">
                  {brandInitial}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[#1F6B54] leading-tight truncate">
                  {title}
                </h2>
                <p className="text-xs text-[#5B6472] mt-0.5 truncate">
                  {subtitle}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 2. Nav — scrollable وسط */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            // فاصل رقيق بين مجموعات التنقل
            const showDivider = item.href === '/operator/archive';

            return (
              <div key={item.href}>
                {showDivider && (
                  <div className="pt-2 pb-2" aria-hidden="true">
                    <div className="h-px bg-[#E7EAED]" />
                  </div>
                )}
                <Link href={item.href}>
                  <a
                    onClick={onLinkClick}
                    className={`group flex items-center justify-between h-10 px-3 rounded-[10px] text-[14px] transition-all [transition-duration:180ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB489] focus-visible:ring-offset-2 ${
                      item.isActive
                        ? 'bg-[#E6F7F0] text-[#1F6B54] font-bold border-r-[3px] border-[#3EB489]'
                        : 'text-[#5B6472] font-semibold bg-transparent hover:bg-[#E9F6F1] hover:text-[#1F6B54] border-r-[3px] border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`size-5 shrink-0 transition-colors [transition-duration:180ms] ${
                          item.isActive
                            ? 'text-[#1F6B54]'
                            : 'text-[#5B6472] group-hover:text-[#1F6B54]'
                        }`}
                        strokeWidth={1.75}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                  </a>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* 3. Footer — إما تذييل المساعدة النظيف أو معلومات المستخدم */}
        {hideUserInfo ? (
          <div className="border-t border-[#E7EAED] p-3 bg-[#F2FBF7] flex flex-col gap-1">
            <Link href="/operator/settings">
              <a
                onClick={onLinkClick}
                className="group flex items-center gap-3 px-3 h-10 rounded-[10px] text-[#5B6472] hover:text-[#1F6B54] hover:bg-[#E9F6F1] transition-all [transition-duration:180ms] text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3EB489] focus-visible:ring-offset-2"
              >
                <HelpCircle
                  className="size-5 shrink-0 text-[#5B6472] group-hover:text-[#1F6B54] transition-colors [transition-duration:180ms]"
                  strokeWidth={1.75}
                />
                <span>{lang === 'ar' ? 'المساعدة' : 'Aide'}</span>
              </a>
            </Link>
          </div>
        ) : (
          <div className="border-t border-[#E7EAED] p-4 bg-[#F2FBF7] flex flex-col gap-3">
            {/* User row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-full bg-[#E6F7F0] text-[#1F6B54] border border-[#3EB489]/20 flex items-center justify-center font-bold text-sm flex-none shadow-xs">
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1F6B54] truncate">
                    {user?.displayName || orgName}
                  </p>
                  <p className="text-xs text-[#5B6472] truncate">
                    {user?.email || ''}
                  </p>
                </div>
              </div>

              {/* Lang toggle */}
              <button
                type="button"
                onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white text-[#1F6B54] border border-[#E7EAED] hover:bg-[#E9F6F1] transition-colors shadow-xs flex-none"
                title="تبديل اللغة / Changer de langue"
              >
                <Languages className="w-3.5 h-3.5 text-[#5B6472]" />
                <span>{lang === 'ar' ? 'FR' : 'عربي'}</span>
              </button>
            </div>

            {/* Optional Desktop App Button */}
            {showDesktopAppButton && (
              <DesktopAppButton
                variant="ghost"
                className="w-full justify-center bg-white text-[#1F6B54] border border-[#E7EAED] hover:bg-[#E9F6F1] hover:text-[#1F6B54]"
              />
            )}

            {/* Logout */}
            <LogoutButton
              variant="sidebar"
              className="!text-[#5B6472] hover:!text-[#1F6B54] hover:!bg-[#E9F6F1]"
            />
          </div>
        )}
      </div>
    );
  }

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
      {hideUserInfo ? null : (
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
