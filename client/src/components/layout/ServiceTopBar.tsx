import React, { useState, useRef, useEffect } from 'react';
import { Link, useRoute } from 'wouter';
import { useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/i18n';
import {
  Check,
  Building2,
  Sparkles,
  Search,
  Calendar,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  MoreHorizontal,
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

export interface ServiceTopBarProps {
  title?: string;
  notificationsCount?: number;
}

export function ServiceTopBar({
  notificationsCount = 0,
}: ServiceTopBarProps) {
  const { user, logout } = useAuth();
  const { lang, setLang } = useI18n();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const [isSettingsActive] = useRoute('/authority/settings');

  const orgName = (user?.organizationName || user?.displayName || 'المصلحة المتعاقدة').trim();

  const toggleLang = () => {
    setLang(lang === 'ar' ? 'fr' : 'ar');
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    window.location.href = '/login';
  };

  // Close mobile "More" menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }
    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreOpen]);

  // Close mobile "More" on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isMoreOpen) {
        setIsMoreOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMoreOpen]);

  return (
    <header
      className="h-[72px] min-h-[72px] bg-white border-b border-[#D5DDEA] flex items-center gap-2 sm:gap-2.5 px-3 sm:px-5 select-none w-full box-border relative"
      role="banner"
      dir="rtl"
    >
      {/* ══════════════════════════════════════════════════════════════════
          1. الهوية: الشعار واسم المنصة (دون تكرار)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 text-[#0B4348] font-bold text-sm shrink-0">
        <div className="size-8 rounded-lg bg-[#0B4348] text-white flex items-center justify-center shadow-xs flex-none">
          <Check className="size-5 stroke-[3]" aria-hidden="true" />
        </div>
        <span className="hidden sm:inline tracking-tight font-extrabold text-[#0B1F3A] text-sm">
          صفقات ذكية
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2. السياق: اسم المؤسسة (بعرض مرن ومحدود مع إظهار الاسم كاملاً)
          ══════════════════════════════════════════════════════════════════ */}
      <div
        className="bg-[#E8F5F1] text-[#0B4348] border border-[#A7D9CC] rounded-full px-3 py-1.5 text-xs font-semibold max-w-[120px] sm:max-w-[180px] md:max-w-[260px] truncate shadow-xs shrink-0 flex items-center gap-1.5 cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857]"
        title={orgName}
        tabIndex={0}
        aria-label={`المؤسسة: ${orgName}`}
      >
        <Building2 className="size-3.5 text-[#0B4348] shrink-0" aria-hidden="true" />
        <span className="truncate">{orgName}</span>
      </div>

      {/* فاصل مرن */}
      <div className="flex-1 min-w-[8px]" />

      {/* ══════════════════════════════════════════════════════════════════
          3. الأدوات: أدوات النظام + أدوات الحساب
          تباعد موحد بين 8 و12px، وأبعاد تفاعلية لا تقل عن 40×40px
          ══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* ─── أدوات النظام (المساعد، البحث، التقويم، الرسائل) ─── */}
        {/* على الشاشات الكبيرة تظهر مباشرة، وعلى الشاشات الصغيرة تجمع في قائمة «المزيد» */}
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
          {/* زر المساعد الذكي — مختصر إلى أيقونة 40x40px مع تلميح ووصولية */}
          <button
            type="button"
            className="size-10 rounded-[10px] bg-[#047857]/10 hover:bg-[#047857] text-[#047857] hover:text-white flex items-center justify-center transition-colors flex-none border-0 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857]"
            title="المساعد الذكي"
            aria-label="المساعد الذكي"
          >
            <Sparkles className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          </button>

          {/* بحث */}
          <button
            type="button"
            className="size-10 rounded-[10px] text-[#5B6472] hover:text-[#0B4348] hover:bg-[#F1F5F9] flex items-center justify-center transition-colors flex-none border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857]"
            title="بحث"
            aria-label="بحث"
          >
            <Search className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          </button>

          {/* التقويم */}
          <button
            type="button"
            className="size-10 rounded-[10px] text-[#5B6472] hover:text-[#0B4348] hover:bg-[#F1F5F9] flex items-center justify-center transition-colors flex-none border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857]"
            title="التقويم"
            aria-label="التقويم"
          >
            <Calendar className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          </button>

          {/* الرسائل والاستفسارات */}
          <button
            type="button"
            className="size-10 rounded-[10px] text-[#5B6472] hover:text-[#0B4348] hover:bg-[#F1F5F9] flex items-center justify-center transition-colors flex-none border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857]"
            title="الرسائل والاستفسارات"
            aria-label="الرسائل والاستفسارات"
          >
            <MessageSquare className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        {/* قائمة «المزيد» للشاشات الصغيرة فقط (< 640px) */}
        <div className="relative sm:hidden" ref={moreRef}>
          <button
            type="button"
            onClick={() => setIsMoreOpen((prev) => !prev)}
            aria-expanded={isMoreOpen}
            aria-haspopup="menu"
            className="size-10 rounded-[10px] text-[#5B6472] hover:text-[#0B4348] hover:bg-[#F1F5F9] flex items-center justify-center transition-colors flex-none border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857]"
            title="أدوات إضافية"
            aria-label="أدوات إضافية"
          >
            <MoreHorizontal className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          </button>

          {isMoreOpen && (
            <div
              className="absolute top-[48px] start-0 z-50 bg-white border border-[#D5DDEA] rounded-xl shadow-lg p-2 flex flex-col gap-1 min-w-[200px]"
              role="menu"
              aria-label="أدوات إضافية"
            >
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-[#0B4348] hover:bg-[#E8F5F1] transition-colors text-start border-0 bg-transparent cursor-pointer w-full"
              >
                <Sparkles className="size-4 text-[#047857] shrink-0" aria-hidden="true" />
                <span>المساعد الذكي</span>
              </button>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-[#5B6472] hover:bg-[#F1F5F9] transition-colors text-start border-0 bg-transparent cursor-pointer w-full"
              >
                <Search className="size-4 shrink-0" aria-hidden="true" />
                <span>بحث</span>
              </button>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-[#5B6472] hover:bg-[#F1F5F9] transition-colors text-start border-0 bg-transparent cursor-pointer w-full"
              >
                <Calendar className="size-4 shrink-0" aria-hidden="true" />
                <span>التقويم</span>
              </button>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-[#5B6472] hover:bg-[#F1F5F9] transition-colors text-start border-0 bg-transparent cursor-pointer w-full"
              >
                <MessageSquare className="size-4 shrink-0" aria-hidden="true" />
                <span>الرسائل والاستفسارات</span>
              </button>
            </div>
          )}
        </div>

        {/* الإشعارات (تظهر دائماً في الشريط) */}
        <button
          type="button"
          className="relative size-10 rounded-[10px] text-[#5B6472] hover:text-[#0B4348] hover:bg-[#F1F5F9] flex items-center justify-center transition-colors flex-none border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857]"
          title="الإشعارات"
          aria-label="الإشعارات"
        >
          <Bell className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          {notificationsCount > 0 ? (
            <span className="absolute top-2 inset-inline-end-2 size-2 rounded-full bg-[#B42318] border-2 border-white box-border" />
          ) : (
            <span className="absolute top-2 inset-inline-end-2 size-2 rounded-full bg-[#047857] border-2 border-white box-border" />
          )}
        </button>

        {/* فاصل رأسي خفيف بين مجموعات الأدوات */}
        <div className="hidden sm:block h-6 w-[1px] bg-[#D5DDEA] mx-0.5" aria-hidden="true" />

        {/* ─── مجموعة أدوات الحساب (اللغة، الإعدادات، الخروج) ─── */}
        {/* 1. تبديل اللغة */}
        <button
          type="button"
          onClick={toggleLang}
          className="min-h-[40px] min-w-[40px] px-2.5 rounded-[10px] text-[#14325C] hover:text-[#0B4348] hover:bg-[#F1F5F9] text-xs font-bold transition-colors flex items-center justify-center flex-none border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857]"
          lang="fr"
          dir="ltr"
          title="تغيير اللغة"
          aria-label="تغيير اللغة"
        >
          {lang === 'ar' ? 'FR' : 'عربي'}
        </button>

        {/* 2. الإعدادات */}
        <Link href="/authority/settings">
          <a
            className={`size-10 rounded-[10px] flex items-center justify-center transition-colors flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857] ${
              isSettingsActive
                ? 'bg-[#E8F5F1] text-[#0B4348]'
                : 'text-[#5B6472] hover:text-[#0B4348] hover:bg-[#F1F5F9]'
            }`}
            title="الإعدادات"
            aria-label="الإعدادات"
          >
            <Settings className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          </a>
        </Link>

        {/* 3. تسجيل الخروج — محايد افتراضياً، أحمر عند المرور أو التركيز */}
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="size-10 rounded-[10px] text-[#5B6472] hover:text-[#B42318] hover:bg-[#FEE4E2] focus-visible:text-[#B42318] flex items-center justify-center transition-colors flex-none border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B42318]"
          title="تسجيل الخروج"
          aria-label="تسجيل الخروج"
        >
          <LogOut className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>

      {/* نافذة تأكيد تسجيل الخروج */}
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
              className="bg-[#B42318] hover:bg-[#912018] text-white"
            >
              {lang === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}

export default ServiceTopBar;
