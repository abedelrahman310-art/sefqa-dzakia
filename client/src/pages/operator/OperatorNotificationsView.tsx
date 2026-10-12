import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n';
import { Bell, CheckCircle2, Clock, Calendar, FileText, ArrowLeft, ArrowRight, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface NotificationItem {
  id: string;
  type: 'opening' | 'award' | 'matching' | 'update';
  titleAr: string;
  titleFr: string;
  descAr: string;
  descFr: string;
  date: string;
  linkHref?: string;
  isRead: boolean;
}

export function OperatorNotificationsView() {
  const { t, lang, dir } = useI18n();
  const [, setLocation] = useLocation();

  // Procedural notifications grounded in system lifecycle
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'matching',
      titleAr: 'تحديث مطابقة الفرص والصفقات',
      titleFr: 'Mise à jour des opportunités ciblées',
      descAr: 'تم تحديث قائمة الصفقات المنشورة المتطابقة مع قطاعك المصرح به ورموز أنشطتك.',
      descFr: 'La liste des marchés publiés correspondant à votre secteur et codes d\'activités a été mise à jour.',
      date: 'اليوم · 09:30',
      linkHref: '/operator/deals',
      isRead: false,
    },
    {
      id: 'notif-2',
      type: 'opening',
      titleAr: 'تأكيد موعد جلسة فتح الأظرفة',
      titleFr: 'Confirmation de la séance d\'ouverture des plis',
      descAr: 'تذكير إجرائي: تنعقد جلسة فتح الأظرفة علنياً فور انقضاء أجل إيداع العروض المحدد في دفتر الشروط.',
      descFr: 'Rappel de procédure : La séance d\'ouverture des plis se tiendra publiquement dès clôture des dépôts.',
      date: 'أمس · 14:15',
      linkHref: '/operator/offers',
      isRead: true,
    },
  ]);

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-navy-900 dark:text-slate-100 flex items-center gap-2">
            <span>{t('operator.notifications.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {t('operator.notifications.subtitle')}
          </p>
        </div>

        {notifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            }}
            className="text-xs self-start sm:self-auto"
          >
            {lang === 'ar' ? 'تحديد الكل كمقروء' : 'Tout marquer comme lu'}
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Bell className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-navy-900 dark:text-slate-100">
              {t('operator.notifications.empty')}
            </h4>
            <p className="text-xs text-muted-foreground">
              {lang === 'ar'
                ? 'ستظهر هنا كافة الإشعارات الإجرائية فور صدورها من المصالح المتعاقدة أو جلسات التقييم.'
                : 'Toutes les notifications procédurales des services contractants apparaîtront ici.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => {
            const title = lang === 'ar' ? item.titleAr : item.titleFr;
            const desc = lang === 'ar' ? item.descAr : item.descFr;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !item.isRead
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-card border-border hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-none mt-0.5 ${
                      !item.isRead
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-navy-900 dark:text-slate-100">
                        {title}
                      </h4>
                      {!item.isRead && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-600 text-white">
                          {lang === 'ar' ? 'جديد' : 'Nouveau'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {desc}
                    </p>
                    <span className="text-[11px] text-slate-400 block pt-0.5">
                      {item.date}
                    </span>
                  </div>
                </div>

                {item.linkHref && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocation(item.linkHref!)}
                    className="text-xs font-semibold text-navy-900 dark:text-slate-200 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1.5 self-end sm:self-auto flex-none"
                  >
                    <span>{lang === 'ar' ? 'معاينة' : 'Voir'}</span>
                    <ArrowIcon className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
