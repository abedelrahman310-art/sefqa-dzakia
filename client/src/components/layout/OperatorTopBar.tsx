import React, { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/i18n';
import {
  MapPin,
  Search,
  Calendar,
  Bell,
  MessageSquare,
  Building2,
  LogOut,
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
  notificationsCount?: number;
}

export function OperatorTopBar({
  notificationsCount = 1,
}: OperatorTopBarProps) {
  const { user, status, logout } = useAuth();
  const { lang, setLang } = useI18n();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Strictly use the organization name from the user profile; never fall back to personal name
  const orgName = (user?.organizationName || '').trim();

  const toggleLang = () => {
    setLang(lang === 'ar' ? 'fr' : 'ar');
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    window.location.href = '/login';
  };

  return (
    <header className="h-[72px] min-h-[72px] bg-white border-b border-[#D5DDEA] flex items-center gap-2 sm:gap-2.5 px-3 sm:px-5 select-none w-full box-border">
      {/* 1. RTL Start: شارة اسم المؤسسة (حالة التحميل / مكتمل / استكمال) */}
      {status === 'loading' ? (
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ECFDF5] text-[#065F46] text-[13px] font-bold leading-tight animate-pulse flex-none"
          aria-label="جاري تحميل بيانات المؤسسة"
          title="جاري التحميل..."
        >
          <MapPin className="size-4 shrink-0 text-[#065F46]" aria-hidden="true" />
          <span className="inline-block w-20 sm:w-28 h-4 bg-[#A7F3D0]/60 rounded" />
        </div>
      ) : orgName ? (
        <div
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-[#ECFDF5] text-[#065F46] text-[13px] font-bold leading-tight flex-none max-w-[130px] sm:max-w-[200px] md:max-w-[280px] cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857]"
          title={orgName}
          tabIndex={0}
          aria-label={`المؤسسة: ${orgName}`}
        >
          <MapPin className="size-4 shrink-0 text-[#065F46]" aria-hidden="true" />
          <span className="truncate">{orgName}</span>
        </div>
      ) : (
        <Link href="/operator/profile">
          <a
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] text-[12px] sm:text-[13px] font-bold leading-tight transition-colors border border-[#F59E0B]/30 flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]"
            title={lang === 'ar' ? 'استكمل ملف المؤسسة' : "Complétez le profil de l'entreprise"}
            aria-label={lang === 'ar' ? 'استكمل ملف المؤسسة' : "Complétez le profil de l'entreprise"}
          >
            <MapPin className="size-4 shrink-0 text-[#D97706]" aria-hidden="true" />
            <span>{lang === 'ar' ? 'استكمل ملف المؤسسة' : 'Complétez le profil'}</span>
          </a>
        </Link>
      )}

      {/* 2. تبديل اللغة */}
      <button
        type="button"
        onClick={toggleLang}
        className="min-h-[40px] min-w-[40px] px-2.5 sm:px-3 border-0 rounded-[10px] bg-transparent text-[#14325C] text-[13px] sm:text-[14px] font-bold cursor-pointer hover:bg-[#EEF3FA] transition-colors flex items-center justify-center flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14325C]"
        lang="fr"
        dir="ltr"
        title={lang === 'ar' ? 'Changer de langue (FR)' : 'تبديل اللغة (عربي)'}
        aria-label={lang === 'ar' ? 'تبديل اللغة إلى الفرنسية' : 'Changer la langue vers l\'arabe'}
      >
        {lang === 'ar' ? 'FR' : 'عربي'}
      </button>

      {/* فاصل مرن */}
      <div className="flex-1 min-w-[8px]" />

      {/* 3. أدوات الواجهة الحالية (بحث، تقويم، إشعارات) */}
      <button
        type="button"
        className="hidden sm:flex size-10 md:size-11 border-0 rounded-[10px] bg-transparent text-[#14325C] hover:bg-[#EEF3FA] items-center justify-center cursor-pointer transition-colors flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14325C]"
        aria-label={lang === 'ar' ? 'بحث' : 'Rechercher'}
        title={lang === 'ar' ? 'بحث' : 'Rechercher'}
      >
        <Search className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
      </button>

      <button
        type="button"
        className="hidden sm:flex size-10 md:size-11 border-0 rounded-[10px] bg-transparent text-[#14325C] hover:bg-[#EEF3FA] items-center justify-center cursor-pointer transition-colors flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14325C]"
        aria-label={lang === 'ar' ? 'التقويم وآجال إيداع العروض' : 'Calendrier et délais de soumission'}
        title={lang === 'ar' ? 'التقويم وآجال إيداع العروض' : 'Calendrier et délais de soumission'}
      >
        <Calendar className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
      </button>

      <button
        type="button"
        className="relative size-10 md:size-11 border-0 rounded-[10px] bg-transparent text-[#14325C] hover:bg-[#EEF3FA] flex items-center justify-center cursor-pointer transition-colors flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14325C]"
        aria-label={lang === 'ar' ? 'الإشعارات' : 'Notifications'}
        title={lang === 'ar' ? 'الإشعارات' : 'Notifications'}
      >
        <Bell className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        {notificationsCount > 0 && (
          <span className="absolute top-2 inset-inline-end-2 size-2.5 rounded-full bg-[#B42318] border-2 border-white box-border" />
        )}
      </button>

      {/* 4. المراسلات والاستفسارات (منقولة من الشريط الجانبي) */}
      <Link href="/operator/opening-sessions">
        <a
          className="size-10 md:size-11 rounded-[10px] bg-transparent text-[#14325C] hover:bg-[#EEF3FA] flex items-center justify-center transition-colors flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14325C]"
          aria-label={lang === 'ar' ? 'المراسلات والاستفسارات' : 'Correspondance et demandes'}
          title={lang === 'ar' ? 'المراسلات والاستفسارات' : 'Correspondance et demandes'}
        >
          <MessageSquare className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        </a>
      </Link>

      {/* 5. ملف المؤسسة (منقول من الشريط الجانبي - بديل أيقونة المستخدم لتجنب التكرار) */}
      <Link href="/operator/profile">
        <a
          className="size-10 md:size-11 rounded-[10px] bg-transparent text-[#14325C] hover:bg-[#EEF3FA] flex items-center justify-center transition-colors flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14325C]"
          aria-label={lang === 'ar' ? 'ملف المؤسسة' : "Profil de l'entreprise"}
          title={lang === 'ar' ? 'ملف المؤسسة' : "Profil de l'entreprise"}
        >
          <Building2 className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        </a>
      </Link>

      {/* 6. تسجيل الخروج في النهاية (منقول من الشريط الجانبي مع نافذة تأكيد) */}
      <button
        type="button"
        onClick={() => setShowLogoutConfirm(true)}
        className="size-10 md:size-11 rounded-[10px] bg-transparent text-[#B42318] hover:bg-[#FEE4E2] flex items-center justify-center transition-colors flex-none border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B42318]"
        aria-label={lang === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}
        title={lang === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}
      >
        <LogOut className="size-5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
      </button>

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

export default OperatorTopBar;
