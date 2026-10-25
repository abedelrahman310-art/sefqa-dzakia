import React, { useRef, useEffect, useState, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/i18n';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

export interface PortalShellProps {
  /** <PortalSidebar ... /> */
  sidebar: ReactNode;

  /** <ServiceTopBar /> أو <CentralAdminTopBar /> أو <OperatorTopBar /> */
  topBar?: ReactNode;

  /** "صفقات ذكية · المصلحة المتعاقدة" — للـ Mobile header فقط */
  mobileTitle: string;

  /** إخفاء Sidebar على routes معينة (مثل /central/map) */
  hideSidebar?: boolean;

  /** إخفاء TopBar على routes معينة */
  hideTopBar?: boolean;

  /** إظهار TopBar على الشاشات الصغيرة (افتراضياً: مخفي على الموبايل ومرئي من md) */
  showTopBarOnMobile?: boolean;

  /** Override لحشوة المحتوى — default "p-6 md:p-8" */
  contentClassName?: string;

  /** خلفية مساحة العمل (main) — default شفافة ترث خلفية الهيكل */
  workspaceClassName?: string;

  /** عرض القائمة الجانبية لسطح المكتب — default "w-[280px]" */
  sidebarWidth?: string;

  /** المحتوى */
  children: ReactNode;
}

export function PortalShell({
  sidebar,
  topBar,
  mobileTitle,
  hideSidebar = false,
  hideTopBar = false,
  showTopBarOnMobile = false,
  contentClassName = 'p-6 md:p-8',
  workspaceClassName = '',
  sidebarWidth = 'w-[280px]',
  children,
}: PortalShellProps) {
  const { lang, setLang } = useI18n();
  const [location] = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-scroll main container to top upon route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
    setMobileOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--paper-50)]" dir="rtl">
      {/* Desktop Sidebar: 280px fixed (أو مخصص) */}
      {!hideSidebar && (
        <aside className={`hidden md:flex flex-col ${sidebarWidth} h-screen bg-white border-e border-[var(--color-border-subtle)] flex-none print:hidden`}>
          {sidebar}
        </aside>
      )}

      {/* Main Content Area */}
      <main
        ref={mainRef}
        className={`flex-1 h-screen overflow-y-auto flex flex-col min-w-0 ${workspaceClassName}`}
      >
        {/* Mobile Header Bar with Sheet (side="start") */}
        {!hideSidebar && (
          <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-[var(--color-border-subtle)] sticky top-0 z-30 print:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="p-2 rounded-lg bg-[var(--paper-100)] text-[var(--ink-900)] hover:bg-[var(--paper-200)] transition-colors"
                  aria-label="فتح القائمة"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="start" className="p-0 w-[280px] border-e border-[var(--color-border-subtle)]">
                {React.isValidElement(sidebar)
                  ? React.cloneElement(sidebar as React.ReactElement<{ onLinkClick?: () => void }>, {
                      onLinkClick: () => {
                        setMobileOpen(false);
                        (sidebar as React.ReactElement<{ onLinkClick?: () => void }>).props.onLinkClick?.();
                      },
                    })
                  : sidebar}
              </SheetContent>
            </Sheet>

            <span className="font-bold text-lg text-[var(--ink-900)]">
              {mobileTitle}
            </span>

            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'fr' : 'ar')}
              className="text-base font-bold px-2.5 py-1 rounded-lg bg-[var(--paper-100)] text-[var(--ink-700)] border border-[var(--color-border-subtle)]"
            >
              {lang === 'ar' ? 'FR' : 'عربي'}
            </button>
          </div>
        )}

        {/* TopBar */}
        {!hideTopBar && topBar && (
          <div className={`${showTopBarOnMobile ? 'block relative md:sticky md:top-0' : 'hidden md:block sticky top-0'} z-20 print:hidden`}>
            {topBar}
          </div>
        )}

        {/* Dynamic Route View */}
        <div className={`page-transition flex-1 ${contentClassName}`}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default PortalShell;
