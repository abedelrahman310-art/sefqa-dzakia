import { useState } from 'react';
import { useI18n } from '@/i18n';
import {
  Bell,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  CheckCheck,
} from 'lucide-react';
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

const TYPE_ICONS = {
  opening: Calendar,
  award: CheckCircle2,
  matching: FileText,
  update: ShieldAlert,
};

export function OperatorNotificationsView() {
  const { t, lang, dir } = useI18n();
  const [, setLocation] = useLocation();

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'matching',
      titleAr: 'تحديث مطابقة الفرص والصفقات',
      titleFr: 'Mise à jour des opportunités ciblées',
      descAr: 'تم تحديث قائمة الصفقات المنشورة المتطابقة مع قطاعك المصرح به ورموز أنشطتك.',
      descFr:
        "La liste des marchés publiés correspondant à votre secteur et codes d'activités a été mise à jour.",
      date: 'اليوم · 09:30',
      linkHref: '/operator/deals',
      isRead: false,
    },
    {
      id: 'notif-2',
      type: 'opening',
      titleAr: 'تأكيد موعد جلسة فتح الأظرفة',
      titleFr: "Confirmation de la séance d'ouverture des plis",
      descAr:
        'تذكير إجرائي: تنعقد جلسة فتح الأظرفة علنياً فور انقضاء أجل إيداع العروض المحدد في دفتر الشروط.',
      descFr:
        "Rappel de procédure : La séance d'ouverture des plis se tiendra publiquement dès clôture des dépôts.",
      date: 'أمس · 14:15',
      linkHref: '/operator/offers',
      isRead: true,
    },
  ]);

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="op-page">
      <div className="op-page-head">
        <div>
          <h1>{t('operator.notifications.title')}</h1>
          <p>{t('operator.notifications.subtitle')}</p>
        </div>
        {notifications.length > 0 && (
          <div className="op-page-actions">
            <button
              type="button"
              className="op-btn op-btn-outline"
              onClick={() => {
                setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
              }}
            >
              <CheckCheck aria-hidden="true" />
              <span>{lang === 'ar' ? 'تحديد الكل كمقروء' : 'Tout marquer comme lu'}</span>
            </button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="op-big-empty">
          <div className="op-big-empty-icon">
            <Bell aria-hidden="true" />
          </div>
          <h3>{t('operator.notifications.empty')}</h3>
          <p>
            {lang === 'ar'
              ? 'ستظهر هنا كافة الإشعارات الإجرائية فور صدورها من المصالح المتعاقدة أو جلسات التقييم.'
              : 'Toutes les notifications procédurales des services contractants apparaîtront ici.'}
          </p>
        </div>
      ) : (
        <div className="op-card">
          <div className="op-card-head">
            <h2>الإشعارات</h2>
            <span className="op-card-tag">{notifications.filter((item) => !item.isRead).length} غير مقروء</span>
          </div>
          <div className="op-card-body py-1">
            {notifications.map((item) => {
              const title = lang === 'ar' ? item.titleAr : item.titleFr;
              const desc = lang === 'ar' ? item.descAr : item.descFr;
              const Icon = TYPE_ICONS[item.type] || Clock;

              return (
                <article
                  key={item.id}
                  className="flex flex-col gap-3 border-b border-[var(--op-line-2)] py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`flex size-10 flex-none items-center justify-center rounded-xl ${
                        item.isRead
                          ? 'bg-[var(--op-line-2)] text-[var(--op-muted)]'
                          : 'bg-[var(--op-gold-soft)] text-[var(--op-gold-dark)]'
                      }`}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="m-0 text-sm font-bold text-[var(--op-ink)]">{title}</h3>
                        {!item.isRead && (
                          <span className="op-chip gold">{lang === 'ar' ? 'جديد' : 'Nouveau'}</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--op-text)]">{desc}</p>
                      <span className="mt-1 block text-[11px] text-[var(--op-muted)]">{item.date}</span>
                    </div>
                  </div>

                  {item.linkHref && (
                    <button
                      type="button"
                      className="op-btn op-btn-outline op-btn-sm flex-none self-end sm:self-center"
                      onClick={() => setLocation(item.linkHref!)}
                    >
                      <span>{lang === 'ar' ? 'معاينة' : 'Voir'}</span>
                      <ArrowIcon aria-hidden="true" />
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default OperatorNotificationsView;
