import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { useSearch } from 'wouter/use-location';
import { useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/i18n';
import {
  Search,
  Bell,
  Building2,
  LogOut,
  Menu,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface OperatorTopBarProps {
  /** Current section label shown after the portal breadcrumb. */
  breadcrumb?: string;
  /** Opens the mobile navigation drawer. */
  onMenuClick?: () => void;
  notificationsCount?: number;
}

export function OperatorTopBar({
  breadcrumb = 'مساحة العمل',
  onMenuClick,
  notificationsCount = 0,
}: OperatorTopBarProps) {
  const { logout } = useAuth();
  const { lang, setLang } = useI18n();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setQuery(new URLSearchParams(search).get('q') || '');
  }, [search]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim();
    setLocation(q ? `/operator/deals?q=${encodeURIComponent(q)}` : '/operator/deals');
  };

  const toggleLang = () => {
    setLang(lang === 'ar' ? 'fr' : 'ar');
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    window.location.href = '/login';
  };

  return (
    <header className="op-topbar">
      <button
        type="button"
        onClick={onMenuClick}
        className="op-icon-btn op-menu-btn"
        aria-label="فتح القائمة"
        title="فتح القائمة"
      >
        <Menu aria-hidden="true" />
      </button>

      <div className="op-breadcrumb" aria-label="مسار التنقل">
        <span className="op-breadcrumb-label">المتعامل الاقتصادي</span>
        <span className="op-breadcrumb-sep" aria-hidden="true">
          /
        </span>
        <strong>{breadcrumb}</strong>
      </div>

      <form className="op-search" role="search" onSubmit={handleSearch}>
        <Search aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="بحث في الصفقات والعروض..."
          aria-label="بحث في الصفقات والعروض"
        />
      </form>

      <div className="op-topbar-actions">
        <button
          type="button"
          onClick={toggleLang}
          className="op-icon-btn op-lang-btn"
          lang="fr"
          dir="ltr"
          title={lang === 'ar' ? 'Changer de langue (FR)' : 'تبديل اللغة (عربي)'}
          aria-label={lang === 'ar' ? 'تبديل اللغة إلى الفرنسية' : "Changer la langue vers l'arabe"}
        >
          {lang === 'ar' ? 'FR' : 'عربي'}
        </button>

        <Link href="/operator/notifications">
          <a
            href="/operator/notifications"
            className="op-icon-btn"
            aria-label="الإشعارات"
            title="الإشعارات"
          >
            <Bell aria-hidden="true" />
            {notificationsCount > 0 && (
              <span
                className="absolute top-2 end-2 size-2 rounded-full bg-[#e63946] border-2 border-white"
                aria-hidden="true"
              />
            )}
          </a>
        </Link>

        <Link href="/operator/profile">
          <a
            href="/operator/profile"
            className="op-icon-btn op-hide-sm"
            aria-label="ملف المؤسسة"
            title="ملف المؤسسة"
          >
            <Building2 aria-hidden="true" />
          </a>
        </Link>

        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="op-icon-btn danger"
          aria-label="تسجيل الخروج"
          title="تسجيل الخروج"
        >
          <LogOut aria-hidden="true" />
        </button>
      </div>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {lang === 'ar' ? 'تأكيد تسجيل الخروج' : 'Confirmer la déconnexion'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lang === 'ar'
                ? 'هل أنت متأكد من رغبتك في تسجيل الخروج من منصة صفقات؟'
                : 'Êtes-vous sûr de vouloir vous déconnecter de la plateforme Safaqat ?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {lang === 'ar' ? 'إلغاء' : 'Annuler'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-[#e63946] hover:bg-[#c62f3b] text-white"
            >
              {lang === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}

export default OperatorTopBar;
