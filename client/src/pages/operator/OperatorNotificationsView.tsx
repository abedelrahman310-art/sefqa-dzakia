import { useCallback, useEffect, useMemo, useState } from 'react';
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
  RefreshCw,
  AlertCircle,
  CheckCheck,
  Loader2,
  ScrollText,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';

type NotificationType = 'opening' | 'award' | 'matching' | 'update' | 'contract';
type NotificationTab = 'all' | 'unread' | 'deals' | 'contracts';

interface NotificationItem {
  id: string;
  type: NotificationType;
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
  contract: ScrollText,
};

const TAB_LABELS: Record<NotificationTab, { ar: string; fr: string }> = {
  all: { ar: 'الكل', fr: 'Tout' },
  unread: { ar: 'غير مقروء', fr: 'Non lus' },
  deals: { ar: 'صفقات', fr: 'Marchés' },
  contracts: { ar: 'عقود', fr: 'Contrats' },
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

const normalizeType = (value: unknown): NotificationType => {
  const type = String(value || '').toLowerCase();
  if (
    type.includes('contract') ||
    type.includes('execution') ||
    type.includes('milestone') ||
    type.includes('payment') ||
    type.includes('reception') ||
    type.includes('amendment') ||
    type.includes('عقد') ||
    type.includes('تنفيذ') ||
    type.includes('مرحلة')
  ) {
    return 'contract';
  }
  if (type.includes('opening') || type.includes('session') || type.includes('فتح')) {
    return 'opening';
  }
  if (type.includes('award') || type.includes('attrib') || type.includes('منح')) {
    return 'award';
  }
  if (type.includes('match') || type.includes('recommend') || type.includes('مطابق')) {
    return 'matching';
  }
  return 'update';
};

const classifyNotification = (item: NotificationItem): 'deals' | 'contracts' | 'other' => {
  const haystack = `${item.titleAr} ${item.descAr} ${item.linkHref || ''}`.toLowerCase();
  if (
    item.type === 'contract' ||
    /(contract|execution|milestone|payment|reception|amendment|عقد|تنفيذ|مرحلة|مستحق|استلام|تعديل)/i.test(
      haystack,
    )
  ) {
    return 'contracts';
  }
  if (
    ['opening', 'award', 'matching'].includes(item.type) ||
    /(deal|offer|tender|opportunity|opening|award|صفقة|عرض|مناقصة|فتح|منح|ترشح|تقييم)/i.test(
      haystack,
    )
  ) {
    return 'deals';
  }
  return 'other';
};

const extractNotificationItems = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data;
  const record = asRecord(data);
  if (Array.isArray(record.results)) return record.results;
  if (Array.isArray(record.notifications)) return record.notifications;
  return [];
};

const normalizeNotification = (raw: unknown, index: number): NotificationItem => {
  const item = asRecord(raw);
  const titleAr = pickString(item.title_ar, item.titleAr, item.title, item.subject);
  const titleFr = pickString(item.title_fr, item.titleFr, item.title, item.subject);
  const descAr = pickString(
    item.message_ar,
    item.messageAr,
    item.message,
    item.body,
    item.description,
    item.content,
  );
  const descFr = pickString(
    item.message_fr,
    item.messageFr,
    item.message,
    item.body,
    item.description,
    item.content,
  );

  return {
    id: String(item.id ?? item.uuid ?? `notification-${index}`),
    type: normalizeType(item.type ?? item.notification_type ?? item.category ?? item.kind),
    titleAr: titleAr || descAr || 'إشعار',
    titleFr: titleFr || titleAr || descFr || 'Notification',
    descAr,
    descFr,
    date: pickString(item.created_at, item.createdAt, item.date, item.timestamp, item.sent_at),
    linkHref:
      pickString(
        item.link,
        item.link_href,
        item.linkHref,
        item.action_url,
        item.url,
        item.target_url,
      ) || undefined,
    isRead: Boolean(item.is_read ?? item.isRead ?? item.read ?? item.read_at),
  };
};

const formatNotificationDate = (value: string, lang: 'ar' | 'fr') => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export function OperatorNotificationsView() {
  const { t, lang, dir } = useI18n();
  const [, setLocation] = useLocation();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [markError, setMarkError] = useState('');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    setMarkError('');
    try {
      const response = await api.get('/notifications/');
      setNotifications(
        extractNotificationItems(response.data).map((item, index) =>
          normalizeNotification(item, index),
        ),
      );
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setError(
          lang === 'ar'
            ? 'انتهت جلسة الدخول. يرجى تسجيل الدخول مجدداً لعرض الإشعارات.'
            : 'Votre session a expiré. Veuillez vous reconnecter.',
        );
      } else if (status === 404) {
        setError(
          lang === 'ar'
            ? 'خدمة الإشعارات غير متاحة حالياً. يرجى المحاولة لاحقاً.'
            : "Le service de notifications n'est pas disponible pour le moment.",
        );
      } else {
        setError(
          lang === 'ar'
            ? 'تعذر تحميل الإشعارات. يرجى التحقق من الاتصال والمحاولة مجدداً.'
            : 'Impossible de charger les notifications. Veuillez réessayer.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      setMarkingId(id);
      setMarkError('');
      try {
        await api.patch(`/notifications/${id}/mark-read/`);
        setNotifications((previous) =>
          previous.map((notification) =>
            notification.id === id ? { ...notification, isRead: true } : notification,
          ),
        );
      } catch {
        setMarkError(
          lang === 'ar'
            ? 'تعذر تعليم الإشعار كمقروء. يرجى المحاولة مجدداً.'
            : 'Impossible de marquer la notification comme lue. Veuillez réessayer.',
        );
      } finally {
        setMarkingId(null);
      }
    },
    [lang],
  );

  const markAllAsRead = useCallback(async () => {
    setMarkingAll(true);
    setMarkError('');
    try {
      await api.patch('/notifications/mark-all-read/');
      setNotifications((previous) =>
        previous.map((notification) => ({ ...notification, isRead: true })),
      );
    } catch {
      setMarkError(
        lang === 'ar'
          ? 'تعذر تعليم جميع الإشعارات كمقروءة. يرجى المحاولة مجدداً.'
          : 'Impossible de marquer toutes les notifications comme lues.',
      );
    } finally {
      setMarkingAll(false);
    }
  }, [lang]);

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const dealCount = notifications.filter((item) => classifyNotification(item) === 'deals').length;
  const contractCount = notifications.filter(
    (item) => classifyNotification(item) === 'contracts',
  ).length;
  const tabCounts: Record<NotificationTab, number> = {
    all: notifications.length,
    unread: unreadCount,
    deals: dealCount,
    contracts: contractCount,
  };

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter((item) => !item.isRead);
    }
    if (activeTab === 'deals') {
      return notifications.filter((item) => classifyNotification(item) === 'deals');
    }
    if (activeTab === 'contracts') {
      return notifications.filter((item) => classifyNotification(item) === 'contracts');
    }
    return notifications;
  }, [activeTab, notifications]);

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const handleOpenNotification = (item: NotificationItem) => {
    if (!item.linkHref) return;
    if (!item.isRead) {
      void markAsRead(item.id);
    }
    if (/^https?:\/\//i.test(item.linkHref)) {
      window.open(item.linkHref, '_blank', 'noopener,noreferrer');
      return;
    }
    setLocation(item.linkHref);
  };

  const emptyMessage =
    activeTab === 'unread'
      ? lang === 'ar'
        ? 'لا توجد إشعارات غير مقروءة.'
        : 'Aucune notification non lue.'
      : activeTab === 'deals'
        ? lang === 'ar'
          ? 'لا توجد إشعارات مرتبطة بالصفقات حالياً.'
          : 'Aucune notification liée aux marchés.'
        : activeTab === 'contracts'
          ? lang === 'ar'
            ? 'لا توجد إشعارات مرتبطة بالعقود أو التنفيذ حالياً.'
            : 'Aucune notification liée aux contrats ou à l’exécution.'
          : t('operator.notifications.empty');

  return (
    <div className="op-page">
      <div className="op-page-head">
        <div>
          <h1>{t('operator.notifications.title')}</h1>
          <p>{t('operator.notifications.subtitle')}</p>
        </div>
        <div className="op-page-actions">
          {unreadCount > 0 && (
            <button
              type="button"
              className="op-btn op-btn-ghost"
              onClick={() => void markAllAsRead()}
              disabled={markingAll || loading}
            >
              {markingAll ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCheck aria-hidden="true" />
              )}
              <span>{lang === 'ar' ? 'تعليم الكل كمقروء' : 'Tout marquer comme lu'}</span>
            </button>
          )}
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => void loadNotifications()}
            disabled={loading}
          >
            <RefreshCw className={loading ? 'animate-spin' : undefined} aria-hidden="true" />
            <span>{lang === 'ar' ? 'تحديث' : 'Actualiser'}</span>
          </button>
        </div>
      </div>

      <div className="op-tabs" role="tablist" aria-label="تصنيفات الإشعارات">
        {(Object.keys(TAB_LABELS) as NotificationTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={`op-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            <span>{TAB_LABELS[tab][lang === 'ar' ? 'ar' : 'fr']}</span>
            <span className="archive-count">{tabCounts[tab]}</span>
          </button>
        ))}
      </div>

      {markError && (
        <div className="op-alert error" role="alert">
          <AlertCircle aria-hidden="true" />
          <span>{markError}</span>
        </div>
      )}

      {loading ? (
        <div className="op-card" aria-busy="true" aria-label="جارٍ تحميل الإشعارات">
          <div className="op-card-body space-y-4">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 border-b border-[var(--op-line-2)] pb-4 last:border-b-0"
              >
                <div className="op-skeleton size-10 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="op-skeleton h-4 w-2/5" />
                  <div className="op-skeleton h-3 w-4/5" />
                  <div className="op-skeleton h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="op-alert error" role="alert">
          <AlertCircle aria-hidden="true" />
          <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              className="op-btn op-btn-outline op-btn-sm"
              onClick={() => void loadNotifications()}
            >
              <RefreshCw aria-hidden="true" />
              <span>{lang === 'ar' ? 'إعادة المحاولة' : 'Réessayer'}</span>
            </button>
          </div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="op-big-empty">
          <div className="op-big-empty-icon">
            <Bell aria-hidden="true" />
          </div>
          <h3>{emptyMessage}</h3>
          <p>
            {lang === 'ar'
              ? 'ستظهر هنا كافة الإشعارات الإجرائية فور صدورها من المصالح المتعاقدة أو جلسات التقييم.'
              : 'Toutes les notifications procédurales des services contractants apparaîtront ici.'}
          </p>
        </div>
      ) : (
        <div className="op-card">
          <div className="op-card-head">
            <h2>{lang === 'ar' ? 'الإشعارات' : 'Notifications'}</h2>
            <span className="op-card-tag">
              {unreadCount} {lang === 'ar' ? 'غير مقروء' : 'non lues'}
            </span>
          </div>
          <div className="op-card-body py-1">
            {filteredNotifications.map((item) => {
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
                      {desc && (
                        <p className="mt-1 text-xs leading-relaxed text-[var(--op-text)]">{desc}</p>
                      )}
                      {item.date && (
                        <span className="mt-1 block text-[11px] text-[var(--op-muted)]">
                          {formatNotificationDate(item.date, lang)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                    {!item.isRead && (
                      <button
                        type="button"
                        className="op-btn op-btn-ghost op-btn-sm"
                        onClick={() => void markAsRead(item.id)}
                        disabled={markingId === item.id || markingAll}
                      >
                        {markingId === item.id ? (
                          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <CheckCheck aria-hidden="true" />
                        )}
                        <span>{lang === 'ar' ? 'تعليم كمقروء' : 'Marquer comme lu'}</span>
                      </button>
                    )}
                    {item.linkHref && (
                      <button
                        type="button"
                        className="op-btn op-btn-outline op-btn-sm"
                        onClick={() => handleOpenNotification(item)}
                      >
                        <span>{lang === 'ar' ? 'معاينة' : 'Voir'}</span>
                        <ArrowIcon aria-hidden="true" />
                      </button>
                    )}
                  </div>
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
