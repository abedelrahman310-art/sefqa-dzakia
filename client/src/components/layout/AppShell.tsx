import { ReactNode, useState } from 'react';
import { useRoute, Link } from 'wouter';
import { useI18n } from '@/i18n';
import { TranslationKey } from '@/i18n/ar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserDropdown } from './UserDropdown';
import { useAuth } from '@/components/auth/AuthProvider';
import { AIChatAssistant, AIHealthBadge } from '@/features/ai';

export interface NavItem {
  id: string;
  labelKey: TranslationKey;
  icon?: ReactNode;
  href: string;
  disabled?: boolean;
  badge?: string;
}

export interface AppShellProps {
  navItems: NavItem[];
  footerItem?: Omit<NavItem, 'href'> & { onClick: () => void };
  header?: ReactNode;
  children: ReactNode;
}

export function AppShell({ navItems, footerItem, header, children }: AppShellProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderNavLinks = (isMobile: boolean = false) => (
    <nav className="flex flex-col gap-2 p-4 h-full">
      <div className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          if (item.disabled) {
            return (
              <div
                key={item.id}
                className="flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-muted-foreground/60 cursor-not-allowed select-none"
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{t(item.labelKey)}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-border bg-muted/60 text-muted-foreground whitespace-nowrap">
                    {item.badge}
                  </span>
                )}
              </div>
            );
          }

          const [isActive] = useRoute(item.href);
          return (
            <Link key={item.id} href={item.href}>
              <a
                aria-current={isActive ? 'page' : undefined}
                onClick={() => isMobile && setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{t(item.labelKey)}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-border bg-muted/60 text-muted-foreground whitespace-nowrap">
                    {item.badge}
                  </span>
                )}
              </a>
            </Link>
          );
        })}
      </div>
      
      {footerItem && (
        <div className="pt-4 border-t border-border mt-auto">
          <button
            onClick={() => {
              footerItem.onClick();
              if (isMobile) setIsMobileMenuOpen(false);
            }}
            className={cn(
              'flex items-center gap-3 px-3 py-2 w-full rounded-md transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'text-destructive hover:bg-destructive/10'
            )}
          >
            {footerItem.icon}
            <span>{t(footerItem.labelKey)}</span>
          </button>
        </div>
      )}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[250px] border-e border-border bg-card">
        <div className="h-14 flex items-center justify-between px-4 border-b border-border">
          <div className="font-bold text-primary">صفقات ذكية</div>
          <LanguageSwitcher />
        </div>
        {renderNavLinks()}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ms-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="start" className="w-[250px] p-0">
                <div className="h-14 flex items-center px-4 border-b border-border font-bold text-primary">
                  صفقات ذكية
                </div>
                {renderNavLinks(true)}
              </SheetContent>
            </Sheet>
            <div className="font-bold text-primary">صفقات ذكية</div>
          </div>

          <div className="flex items-center gap-2">
            {user?.role === "central_admin" && <AIChatAssistant />}
            <LanguageSwitcher />
          </div>
        </header>

        {/* Desktop Custom Header */}
        <header className="hidden md:flex h-14 items-center justify-between px-6 border-b border-border bg-card gap-4">
          <div className="flex-1 min-w-0 flex items-center">
            {header}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {user?.role === "central_admin" && (
              <>
                <AIHealthBadge compact />
                <AIChatAssistant />
              </>
            )}
            <LanguageSwitcher />
            <UserDropdown />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
