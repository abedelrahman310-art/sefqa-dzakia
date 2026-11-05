import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/i18n';
import {
  Check,
  Sparkles,
  Search,
  Calendar,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  MoreHorizontal,
  ArrowRight,
  FileText,
  Clock,
  Building2,
} from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { LiveClock } from './LiveClock';
import { OrgLogo } from '@/components/common/OrgLogo';
import { AIChatAssistant } from '@/features/ai/components/AIChatAssistant';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

export function ServiceTopBar(_props: ServiceTopBarProps) {
  const { logout } = useAuth();
  const { lang, setLang, dir, t } = useI18n();
  const [location, setLocation] = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const [isSettingsActive] = useRoute('/authority/settings');

  // 1. المحادثة / الاستفسارات
  const handleChat = () => {
    // توجيه مستخدم المصلحة المتعاقدة إلى مسار المساعد الذكي الخاص بالمصلحة
    setLocation('/authority/assistant');
  };

  // 3. التقويم / جلسات الفتح والمواعيد
  const handleCalendar = () => {
    if (location.startsWith('/operator')) {
      setLocation('/operator/opening-sessions');
    } else if (location.startsWith('/central')) {
      setLocation('/central/deals');
    } else {
      setLocation('/authority/opening-sessions');
    }
  };

  // 4. البحث السريع
  const handleOpenSearch = () => {
    setIsSearchOpen(true);
  };

  const handleSearchSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    setIsSearchOpen(false);
    if (location.startsWith('/operator')) {
      setLocation(q ? `/operator/deals?q=${encodeURIComponent(q)}` : '/operator/deals');
    } else if (location.startsWith('/central')) {
      setLocation(q ? `/central/deals?q=${encodeURIComponent(q)}` : '/central/deals');
    } else {
      setLocation(q ? `/authority/deals?q=${encodeURIComponent(q)}` : '/authority/deals');
    }
  };

  // 5. المساعد الذكي (RAG)
  const handleAssistant = () => {
    setAiAssistantOpen(true);
  };

  // اختصار لوحة المفاتيح Ctrl+K أو Cmd+K لفتح البحث السريع
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      dir={dir}
    >
      {/* ══════════════════════════════════════════════════════════════════
          1. Brand Identity: Logo and platform brand name
          ══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 text-[#0B4348] font-bold text-sm shrink-0">
        <div className="size-8 rounded-lg bg-[#0B4348] text-white flex items-center justify-center shadow-xs flex-none">
          <Check className="size-5 stroke-[3]" aria-hidden="true" />
        </div>
        <span className="hidden sm:inline tracking-tight font-extrabold text-[#0B1F3A] text-sm">
          {t('portal.brand')}
        </span>
        {/* شعار المصلحة المتعاقدة — يُرفع من /authority/settings ويظهر هنا */}
        <Link href="/authority/settings">
          <a
            className="hidden sm:flex size-8 rounded-lg bg-slate-100 border border-[#D5DDEA] items-center justify-center overflow-hidden flex-none transition-colors hover:bg-slate-200/70"
            title={t('settings.logo.title')}
            aria-label={t('settings.logo.title')}
          >
            <OrgLogo
              portal="authority"
              className="size-full"
              fallback={<Building2 className="size-4 text-[#5B6472]" aria-hidden="true" />}
            />
          </a>
        </Link>
      </div>

      {/* فاصل مرن */}
      <div className="flex-1 min-w-[8px]" />

      {/* ══════════════════════════════════════════════════════════════════
          3. Action tools: System tools and Account menu
          Unified 8-12px spacing, min 40x40px touch targets
          ══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* ─── أدوات النظام (المساعد، البحث، التقويم، الرسائل) ─── */}
        {/* على الشاشات الكبيرة تظهر مباشرة، وعلى الشاشات الصغيرة تجمع في قائمة «المزيد» */}
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
          {/* 1. زر المساعد الذكي — أخضر ومميز مع تلميح ووصولية */}
          <button
            type="button"
            onClick={handleAssistant}
            className="size-10 rounded-[10px] bg-[#047857]/10 hover:bg-[#047857] text-[#047857] hover:text-white flex items-center justify-center transition-colors flex-none border-0 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857]"
            title={t('common.assistant_rag')}
            aria-label={t('common.assistant_rag')}
          >
            <Sparkles className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          </button>

          {/* 2. بحث */}
          <button
            type="button"
            onClick={handleOpenSearch}
            className="size-10 rounded-[10px] text-[#5B6472] hover:text-[#0f3154] hover:bg-slate-100 flex items-center justify-center transition-colors flex-none border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f3154]"
            title={t('topbar.quick_search_title')}
            aria-label={t('common.search')}
          >
            <Search className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          </button>

          {/* 3. التقويم */}
          <button
            type="button"
            onClick={handleCalendar}
            className="size-10 rounded-[10px] text-[#5B6472] hover:text-[#0f3154] hover:bg-slate-100 flex items-center justify-center transition-colors flex-none border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f3154]"
            title={t('topbar.calendar_title')}
            aria-label={t('common.calendar')}
          >
            <Calendar className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          </button>

          {/* 4. الرسائل والاستفسارات */}
          <button
            type="button"
            onClick={handleChat}
            className="size-10 rounded-[10px] text-[#5B6472] hover:text-[#0f3154] hover:bg-slate-100 flex items-center justify-center transition-colors flex-none border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f3154]"
            title={t('topbar.chat_title')}
            aria-label={t('topbar.chat_title')}
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
            className="size-10 rounded-[10px] text-[#5B6472] hover:text-[#0f3154] hover:bg-slate-100 flex items-center justify-center transition-colors flex-none border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f3154]"
            title={t('common.more_tools')}
            aria-label={t('common.more_tools')}
          >
            <MoreHorizontal className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          </button>

          {isMoreOpen && (
            <div
              className="absolute top-[48px] start-0 z-50 bg-white border border-[#D5DDEA] rounded-xl shadow-lg p-2 flex flex-col gap-1 min-w-[200px]"
              role="menu"
              aria-label={t('common.more_tools')}
            >
              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  handleAssistant();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-[#047857] hover:bg-[#E8F5F1] transition-colors text-start border-0 bg-transparent cursor-pointer w-full"
              >
                <Sparkles className="size-4 text-[#047857] shrink-0" aria-hidden="true" />
                <span>{t('topbar.assistant_rag')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  handleOpenSearch();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-[#5B6472] hover:bg-slate-100 transition-colors text-start border-0 bg-transparent cursor-pointer w-full"
              >
                <Search className="size-4 shrink-0" aria-hidden="true" />
                <span>{t('topbar.quick_search')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  handleCalendar();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-[#5B6472] hover:bg-slate-100 transition-colors text-start border-0 bg-transparent cursor-pointer w-full"
              >
                <Calendar className="size-4 shrink-0" aria-hidden="true" />
                <span>{t('topbar.calendar_and_sessions')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  handleChat();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-[#5B6472] hover:bg-slate-100 transition-colors text-start border-0 bg-transparent cursor-pointer w-full"
              >
                <MessageSquare className="size-4 shrink-0" aria-hidden="true" />
                <span>{t('topbar.chat_label')}</span>
              </button>
            </div>
          )}
        </div>

        {/* 5. الإشعارات (تظهر دائماً في الشريط مع قائمة منسدلة تفاعلية) */}
        <NotificationDropdown
          allNotificationsHref={
            location.startsWith('/operator')
              ? '/operator/notifications'
              : '/authority/notifications'
          }
        />

        {/* الساعة الرقمية الحية بتوقيت الجزائر */}
        <LiveClock className="mx-1" />

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
          title={t('topbar.language_toggle')}
          aria-label={t('topbar.language_toggle')}
        >
          {t('common.lang_switch_short')}
        </button>

        {/* 2. الإعدادات */}
        <Link href="/authority/settings">
          <a
            className={`size-10 rounded-[10px] flex items-center justify-center transition-colors flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857] ${
              isSettingsActive
                ? 'bg-[#E8F5F1] text-[#0B4348]'
                : 'text-[#5B6472] hover:text-[#0B4348] hover:bg-[#F1F5F9]'
            }`}
            title={t('topbar.settings_title')}
            aria-label={t('topbar.settings_title')}
          >
            <Settings className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          </a>
        </Link>

        {/* 3. تسجيل الخروج — محايد افتراضياً، أحمر عند المرور أو التركيز */}
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="size-10 rounded-[10px] text-[#5B6472] hover:text-[#B42318] hover:bg-[#FEE4E2] focus-visible:text-[#B42318] flex items-center justify-center transition-colors flex-none border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B42318]"
          title={t('topbar.logout_title')}
          aria-label={t('topbar.logout_title')}
        >
          <LogOut className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>

      {/* نافذة تأكيد تسجيل الخروج */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('common.logout_confirm_title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.logout_confirm_message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-[#B42318] hover:bg-[#912018] text-white"
            >
              {t('common.logout')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* نافذة البحث السريع (Search Modal) */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl bg-white border border-[#D5DDEA] shadow-xl" dir={dir}>
          <DialogHeader className="p-4 border-b border-gray-100 bg-slate-50/70 text-start">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-navy-900 text-white">
                <Search className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-navy-900">
                  {t('topbar.search.title')}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  {t('topbar.search.hint')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSearchSubmit} className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                type="search"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('topbar.search.placeholder')}
                className="ps-9 pe-4 py-2.5 text-sm h-11 rounded-xl border-gray-200 focus-visible:ring-[#0f3154]"
              />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-400 block">
                {t('topbar.search.shortcuts')}
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setLocation('/authority/deals');
                  }}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-navy-900 hover:bg-slate-50 transition-colors text-start flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-navy-900" />
                    <span className="font-semibold text-gray-800">{t('topbar.search.deals_log')}</span>
                  </div>
                  <ArrowRight className="size-3 text-gray-400 rtl:rotate-180" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setLocation('/authority/opening-sessions');
                  }}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-navy-900 hover:bg-slate-50 transition-colors text-start flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-emerald-700" />
                    <span className="font-semibold text-gray-800">{t('topbar.search.opening_sessions')}</span>
                  </div>
                  <ArrowRight className="size-3 text-gray-400 rtl:rotate-180" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    // توجيه مستخدم المصلحة المتعاقدة إلى مسار المساعد الذكي الخاص بالمصلحة
                    setLocation('/authority/assistant');
                  }}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-navy-900 hover:bg-slate-50 transition-colors text-start flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-emerald-600" />
                    <span className="font-semibold text-gray-800">{t('topbar.search.legal_assistant')}</span>
                  </div>
                  <ArrowRight className="size-3 text-gray-400 rtl:rotate-180" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setLocation('/authority/audit');
                  }}
                  className="p-2.5 rounded-xl border border-gray-200 hover:border-navy-900 hover:bg-slate-50 transition-colors text-start flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Bell className="size-4 text-amber-600" />
                    <span className="font-semibold text-gray-800">{t('topbar.search.audit_log')}</span>
                  </div>
                  <ArrowRight className="size-3 text-gray-400 rtl:rotate-180" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-400">
              <span>{t('topbar.search.footer')}</span>
              <Button
                type="submit"
                size="sm"
                className="bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold rounded-lg px-3.5 h-8"
              >
                {t('topbar.search.submit')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <AIChatAssistant open={aiAssistantOpen} onOpenChange={setAiAssistantOpen} showTrigger={false} />
    </header>
  );
}

export default ServiceTopBar;
