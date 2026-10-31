import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useI18n } from '@/i18n';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Calendar,
  FileText,
  AlertCircle,
  ScrollText,
  ExternalLink,
  Loader2,
  Clock,
} from 'lucide-react';
import { api } from '@/lib/api';

export interface NotificationDropdownProps {
  /** Optional custom button class name to adapt to different topbar styles */
  buttonClassName?: string;
  /** Optional fallback URL for the "View All" link */
  allNotificationsHref?: string;
  /** Custom icon size */
  iconSize?: number;
}

interface RawNotification {
  id: string | number;
  title?: string;
  text?: string;
  message?: string;
  link_href?: string;
  linkHref?: string;
  is_read?: boolean;
  isRead?: boolean;
  created_at?: string;
  createdAt?: string;
  date?: string;
  notification_type?: string;
  type?: string;
}

interface NormalizedNotification {
  id: string;
  title: string;
  text: string;
  linkHref: string;
  isRead: boolean;
  createdAt: string;
  type: string;
}

function formatRelativeTime(dateString?: string, lang: 'ar' | 'fr' = 'ar'): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  const isFr = lang === 'fr';

  if (diffSec < 45) return isFr ? "À l'instant" : 'الآن';
  if (diffMin < 60) return isFr ? `Il y a ${diffMin} min` : `منذ ${diffMin} دقيقة`;
  if (diffHours < 24) return isFr ? `Il y a ${diffHours} h` : `منذ ${diffHours} س`;
  if (diffDays === 1) return isFr ? 'Hier' : 'أمس';
  if (diffDays < 7) return isFr ? `Il y a ${diffDays} j` : `منذ ${diffDays} أ`;
  return date.toLocaleDateString(isFr ? 'fr-DZ' : 'ar-DZ', { month: 'short', day: 'numeric' });
}

function getNotificationIcon(type?: string) {
  const t = String(type || '').toLowerCase();
  if (t.includes('contract') || t.includes('عقد')) {
    return <ScrollText className="size-4 text-emerald-600 shrink-0" />;
  }
  if (t.includes('award') || t.includes('منح') || t.includes('إسناد')) {
    return <CheckCircle2 className="size-4 text-[#047857] shrink-0" />;
  }
  if (t.includes('opening') || t.includes('session') || t.includes('فتح')) {
    return <Calendar className="size-4 text-[#0f3154] shrink-0" />;
  }
  if (t.includes('reject') || t.includes('رفض')) {
    return <AlertCircle className="size-4 text-[#B42318] shrink-0" />;
  }
  if (t.includes('deal') || t.includes('صفقة')) {
    return <FileText className="size-4 text-sky-600 shrink-0" />;
  }
  return <Bell className="size-4 text-[#0f3154] shrink-0" />;
}

export function NotificationDropdown({
  buttonClassName,
  allNotificationsHref,
  iconSize = 20,
}: NotificationDropdownProps) {
  const { lang, dir, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocation, setLocation] = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const isFr = lang === 'fr';

  // Determine full notifications view path based on route if not provided
  const targetAllHref =
    allNotificationsHref ||
    (currentLocation.startsWith('/central')
      ? '/central/notifications'
      : currentLocation.startsWith('/authority')
      ? '/authority/notifications'
      : '/operator/notifications');

  // Fetch notifications with 60-second polling
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const response = await api.get('/notifications/');
        return response.data;
      } catch {
        return { notifications: [], unread_count: 0 };
      }
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Normalize notifications
  const rawList: RawNotification[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.notifications)
    ? data.notifications
    : Array.isArray(data?.results)
    ? data.results
    : [];

  const notifications: NormalizedNotification[] = rawList.map((item) => ({
    id: String(item.id),
    title: item.title || item.message || (isFr ? 'Nouvelle notification' : 'إشعار جديد'),
    text: item.text || item.message || '',
    linkHref: item.link_href || item.linkHref || '',
    isRead: Boolean(item.is_read ?? item.isRead ?? false),
    createdAt: item.created_at || item.createdAt || item.date || '',
    type: item.notification_type || item.type || '',
  }));

  const unreadCount: number =
    typeof data?.unread_count === 'number'
      ? data.unread_count
      : notifications.filter((n) => !n.isRead).length;

  // Mutation to mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await api.post(`/notifications/${id}/read/`);
      } catch {
        // Fallback to mark-read patch endpoint
        await api.patch(`/notifications/${id}/mark-read/`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mutation to mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      try {
        await api.post('/notifications/mark-all-read/');
      } catch {
        await api.patch('/notifications/mark-all-read/');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = (notif: NormalizedNotification) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
    setIsOpen(false);
    if (notif.linkHref) {
      setLocation(notif.linkHref);
    }
  };

  const latestFive = notifications.slice(0, 5);

  const defaultButtonClass =
    'relative size-10 rounded-[10px] text-[#5B6472] hover:text-[#0f3154] hover:bg-slate-100 flex items-center justify-center transition-colors flex-none border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f3154]';

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* الجرس مع شارة الإشعارات غير المقروءة */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={buttonClassName || defaultButtonClass}
        title={isFr ? 'Notifications et alertes' : 'الإشعارات والتنبيهات'}
        aria-label={`${isFr ? 'Notifications' : 'الإشعارات'} ${
          unreadCount > 0 ? `(${unreadCount} ${isFr ? 'non lues' : 'غير مقروء'})` : ''
        }`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Bell
          style={{ width: iconSize, height: iconSize }}
          className="shrink-0"
          strokeWidth={1.8}
          aria-hidden="true"
        />

        {unreadCount > 0 ? (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#B42318] text-white text-[10px] font-bold flex items-center justify-center shadow-xs border-2 border-white pointer-events-none animate-in fade-in zoom-in-75 duration-200"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {/* القائمة المنسدلة للإشعارات */}
      {isOpen && (
        <div
          dir={dir}
          role="region"
          aria-label={isFr ? 'Liste des notifications' : 'قائمة الإشعارات'}
          className={`absolute z-50 mt-2 ${
            dir === 'rtl' ? 'end-0 start-auto' : 'start-0 end-auto sm:start-auto sm:end-0'
          } w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-xl shadow-slate-900/10 border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 font-sans`}
        >
          {/* ترويسة القائمة */}
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">
                {isFr ? 'Notifications' : 'الإشعارات'}
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-[#047857]/10 text-[#047857]">
                  {unreadCount} {isFr ? 'nouvelles' : 'جديد'}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs font-semibold text-[#047857] hover:text-[#0B4348] hover:underline flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                {markAllReadMutation.isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <CheckCheck className="size-3.5" />
                )}
                <span>{isFr ? 'Tout marquer comme lu' : 'تعليم الكل كمقروء'}</span>
              </button>
            )}
          </div>

          {/* محتوى الإشعارات */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 divide-opacity-60 overscroll-contain">
            {isLoading && notifications.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="size-5 animate-spin text-[#047857]" />
                <span className="text-xs">
                  {isFr ? 'Chargement des notifications...' : 'جاري تحميل الإشعارات...'}
                </span>
              </div>
            ) : latestFive.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="size-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                  <Bell className="size-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  {isFr ? 'Aucune nouvelle notification' : 'لا توجد إشعارات جديدة'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isFr
                    ? 'Les alertes relatives aux marchés, offres et délais apparaîtront ici.'
                    : 'ستظهر هنا التنبيهات المتعلقة بالصفقات، العروض، والمواعيد القانونية.'}
                </p>
              </div>
            ) : (
              latestFive.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-start p-3 sm:p-3.5 transition-colors flex items-start gap-3 cursor-pointer group border-0 ${
                    !notif.isRead
                      ? 'bg-emerald-50/30 hover:bg-emerald-50/60'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  {/* الأيقونة بحسب نوع الإشعار */}
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                      !notif.isRead
                        ? 'bg-white border-emerald-200 shadow-xs'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* نص وتفاصيل الإشعار */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <h4
                        className={`text-xs truncate ${
                          !notif.isRead
                            ? 'font-bold text-slate-900'
                            : 'font-semibold text-slate-700'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span
                          className="size-2 rounded-full bg-[#047857] shrink-0"
                          title={isFr ? 'Notification non lue' : 'إشعار غير مقروء'}
                        />
                      )}
                    </div>

                    {notif.text && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-1.5 font-normal">
                        {notif.text}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Clock className="size-3 shrink-0" />
                      <span>{formatRelativeTime(notif.createdAt, lang)}</span>
                      {notif.linkHref && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-[#047857] group-hover:underline flex items-center gap-0.5">
                            <span>{isFr ? 'Voir détails' : 'عرض التفاصيل'}</span>
                            <ExternalLink className="size-2.5" />
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* تذييل القائمة: رابط لجميع الإشعارات */}
          <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setLocation(targetAllHref);
              }}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-[#0f3154] hover:text-[#047857] hover:bg-white transition-colors cursor-pointer border-0 bg-transparent"
            >
              {isFr ? 'Voir toutes les notifications' : 'عرض جميع الإشعارات'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
