import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/i18n';
import { MapPin, Sparkles, Search, Calendar, MessageSquare, Bell, User } from 'lucide-react';

export interface OperatorTopBarProps {
  title?: string;
  notificationsCount?: number;
}

export function OperatorTopBar({
  notificationsCount = 1,
}: OperatorTopBarProps) {
  const { user } = useAuth();
  const { lang, setLang } = useI18n();

  const orgName = user?.organizationName || user?.displayName || 'اسم المؤسسة';

  const toggleLang = () => {
    setLang(lang === 'ar' ? 'fr' : 'ar');
  };

  return (
    <header className="h-[72px] min-h-[72px] bg-white border-b border-[#D5DDEA] flex items-center gap-2.5 px-5 select-none w-full box-border">
      {/* 1. RTL Start: شارة المؤسسة، زر اللغة، زر المساعد الذكي */}
      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ECFDF5] text-[#065F46] text-[13px] font-bold leading-tight flex-none">
        <MapPin className="size-4 shrink-0 text-[#065F46]" strokeWidth={1.8} />
        <span>المؤسسة: [{orgName}]</span>
      </span>

      <button
        type="button"
        onClick={toggleLang}
        className="min-h-[44px] px-3 border-0 rounded-[10px] bg-transparent text-[#14325C] text-[14px] font-bold cursor-pointer hover:bg-[#EEF3FA] transition-colors flex-none"
        lang="fr"
        dir="ltr"
        title="Changer de langue / تبديل اللغة"
      >
        {lang === 'ar' ? 'FR' : 'عربي'}
      </button>

      <button
        type="button"
        className="inline-flex items-center gap-2 min-h-[44px] px-3.5 border-0 rounded-[10px] bg-[#047857] hover:bg-[#065F46] text-white text-[14px] font-bold cursor-pointer transition-colors shadow-xs flex-none"
        title="المساعد الذكي"
      >
        <Sparkles className="size-5 shrink-0 text-[#A7F3D0]" strokeWidth={1.8} />
        <span className="hidden sm:inline">المساعد الذكي</span>
      </button>

      {/* 2. Middle Spacer */}
      <div className="flex-1" />

      {/* 3. RTL End: أدوات (بحث، تقويم، رسائل، إشعارات، حسابي) */}
      <button
        type="button"
        className="size-11 border-0 rounded-[10px] bg-transparent text-[#14325C] hover:bg-[#EEF3FA] flex items-center justify-center cursor-pointer transition-colors flex-none"
        aria-label="بحث"
        title="بحث"
      >
        <Search className="size-[22px] shrink-0" strokeWidth={1.8} />
      </button>

      <button
        type="button"
        className="size-11 border-0 rounded-[10px] bg-transparent text-[#14325C] hover:bg-[#EEF3FA] flex items-center justify-center cursor-pointer transition-colors flex-none"
        aria-label="التقويم وآجال إيداع العروض"
        title="التقويم وآجال إيداع العروض"
      >
        <Calendar className="size-[22px] shrink-0" strokeWidth={1.8} />
      </button>

      <button
        type="button"
        className="size-11 border-0 rounded-[10px] bg-transparent text-[#14325C] hover:bg-[#EEF3FA] flex items-center justify-center cursor-pointer transition-colors flex-none"
        aria-label="الرسائل"
        title="الرسائل"
      >
        <MessageSquare className="size-[22px] shrink-0" strokeWidth={1.8} />
      </button>

      <button
        type="button"
        className="relative size-11 border-0 rounded-[10px] bg-transparent text-[#14325C] hover:bg-[#EEF3FA] flex items-center justify-center cursor-pointer transition-colors flex-none"
        aria-label="الإشعارات"
        title="الإشعارات"
      >
        <Bell className="size-[22px] shrink-0" strokeWidth={1.8} />
        {notificationsCount > 0 && (
          <span className="absolute top-2 inset-inline-end-2 size-2.5 rounded-full bg-[#B42318] border-2 border-white box-border" />
        )}
      </button>

      <div
        className="size-10 rounded-full bg-[#14325C] text-white flex items-center justify-center cursor-pointer flex-none shadow-xs"
        aria-label="حسابي"
        title={orgName}
      >
        <User className="size-5 shrink-0" strokeWidth={1.8} />
      </div>
    </header>
  );
}

export default OperatorTopBar;
