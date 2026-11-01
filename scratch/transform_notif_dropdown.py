# -*- coding: utf-8 -*-

path = 'client/src/components/layout/NotificationDropdown.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

# 1. formatRelativeTime update
old_fmt = """function formatRelativeTime(dateString?: string, lang: 'ar' | 'fr' = 'ar'): string {
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
}"""

new_fmt = """function formatRelativeTime(dateString?: string, t?: (k: string, v?: any) => string, lang: 'ar' | 'fr' = 'ar'): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (t) {
    if (diffSec < 45) return t('notifications.now');
    if (diffMin < 60) return t('notifications.minutes_ago', { n: diffMin });
    if (diffHours < 24) return t('notifications.hours_ago', { n: diffHours });
    if (diffDays === 1) return t('notifications.yesterday');
    if (diffDays < 7) return t('notifications.days_ago', { n: diffDays });
  }

  return date.toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ', { month: 'short', day: 'numeric' });
}"""

assert old_fmt in c, "old_fmt not found"
c = c.replace(old_fmt, new_fmt)

# 2. Hook extraction
c = c.replace(
    "  const { lang, dir } = useI18n();",
    "  const { t, lang, dir } = useI18n();"
)

# 3. Item fallback title
c = c.replace(
    "title: item.title || item.message || (isFr ? 'Nouvelle notification' : 'إشعار جديد'),",
    "title: item.title || item.message || t('notifications.new_item'),"
)

# 4. Bell button title & aria-label
c = c.replace(
    "title={isFr ? 'Notifications et alertes' : 'الإشعارات والتنبيهات'}",
    "title={t('notifications.bell_title')}"
)

c = c.replace(
    """        aria-label={`${isFr ? 'Notifications' : 'الإشعارات'} ${
          unreadCount > 0 ? `(${unreadCount} ${isFr ? 'non lues' : 'غير مقروء'})` : ''
        }`}""",
    "aria-label={unreadCount > 0 ? t('notifications.aria_unread', { n: unreadCount }) : t('notifications.aria')}"
)

# 5. Dropdown region aria-label
c = c.replace(
    "aria-label={isFr ? 'Liste des notifications' : 'قائمة الإشعارات'}",
    "aria-label={t('notifications.list')}"
)

# 6. Header title & unread counter
c = c.replace(
    """              <span className="text-sm font-bold text-slate-800">
                {isFr ? 'Notifications' : 'الإشعارات'}
              </span>""",
    """              <span className="text-sm font-bold text-slate-800">
                {t('notifications.title')}
              </span>"""
)

c = c.replace(
    "{unreadCount} {isFr ? 'nouvelles' : 'جديد'}",
    "{unreadCount} {t('notifications.new')}"
)

c = c.replace(
    "<span>{isFr ? 'Tout marquer comme lu' : 'تعليم الكل كمقروء'}</span>",
    "<span>{t('notifications.mark_all_read')}</span>"
)

# 7. Loading state
c = c.replace(
    "{isFr ? 'Chargement des notifications...' : 'جاري تحميل الإشعارات...'}",
    "{t('notifications.loading')}"
)

# 8. Empty state
c = c.replace(
    "{isFr ? 'Aucune nouvelle notification' : 'لا توجد إشعارات جديدة'}",
    "{t('notifications.empty_title')}"
)

c = c.replace(
    """                  {isFr
                    ? 'Les alertes relatives aux marchés, offres et délais apparaîtront ici.'
                    : 'ستظهر هنا التنبيهات المتعلقة بالصفقات، العروض، والمواعيد القانونية.'}""",
    "{t('notifications.empty_desc')}"
)

# 9. Unread title
c = c.replace(
    "title={isFr ? 'Notification non lue' : 'إشعار غير مقروء'}",
    "title={t('notifications.unread')}"
)

# 10. Time format call & view details
c = c.replace(
    "<span>{formatRelativeTime(notif.createdAt, lang)}</span>",
    "<span>{formatRelativeTime(notif.createdAt, t, lang)}</span>"
)

c = c.replace(
    "<span>{isFr ? 'Voir détails' : 'عرض التفاصيل'}</span>",
    "<span>{t('notifications.view_details')}</span>"
)

# 11. Footer view all
c = c.replace(
    "{isFr ? 'Voir toutes les notifications' : 'عرض جميع الإشعارات'}",
    "{t('notifications.view_all')}"
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated NotificationDropdown.tsx successfully!")
