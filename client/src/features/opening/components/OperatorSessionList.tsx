import { useLocation } from 'wouter';
import { useOpeningSessions } from '../hooks/useOpening';
import { useI18n } from '@/i18n';
import {
  Radio,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  PlayCircle,
  FileCheck,
  CheckCircle2,
  FolderOpen,
  RefreshCw,
} from 'lucide-react';
import type { SessionStatus } from '../types';

export function OperatorSessionList() {
  const [, setLocation] = useLocation();
  const { t, dir } = useI18n();
  const { data: sessions, isLoading, error, refetch } = useOpeningSessions();

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const liveLabel = t('opening.live').replace('🔴', '').trim();
  const privacyLabel = t('opening.privacy_notice').replace('⚠️', '').trim();

  const getStatusBadge = (status: SessionStatus) => {
    switch (status) {
      case 'live':
        return (
          <span className="op-chip red">
            <span className="op-live-dot" aria-hidden="true" />
            <span>{liveLabel}</span>
          </span>
        );
      case 'scheduled':
        return <span className="op-chip blue">{t('opening.scheduled')}</span>;
      case 'ended':
        return <span className="op-chip">{t('opening.ended')}</span>;
      case 'cancelled':
        return <span className="op-chip red">{t('opening.cancelled')}</span>;
      default:
        return <span className="op-chip">{status}</span>;
    }
  };

  return (
    <div className="op-page">
      <div className="op-page-head">
        <div>
          <span className="op-chip gold mb-2">
            <Radio aria-hidden="true" />
            <span>جلسات علنية</span>
          </span>
          <h1>{t('opening.title')}</h1>
          <p>
            متابعة جلسات فتح الأظرفة العلنية الخاصة بالصفقات المشارك فيها وفق المرسوم الرئاسي
            15-247 والقانون 23-12.
          </p>
        </div>
        <div className="op-page-actions">
          <span className="op-chip gold">
            <ShieldAlert aria-hidden="true" />
            <span>{privacyLabel}</span>
          </span>
          <button
            type="button"
            className="op-btn op-btn-outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={isLoading ? 'animate-spin' : undefined} aria-hidden="true" />
            <span>{t('ai.refresh')}</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="op-grid-2" aria-label={t('operator.req.loading')}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="op-card p-5">
              <div className="op-skeleton mb-4 h-6 w-3/4" />
              <div className="op-skeleton mb-4 h-4 w-1/2" />
              <div className="flex gap-2">
                <div className="op-skeleton h-8 w-24" />
                <div className="op-skeleton h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="op-alert error">
          <ShieldAlert aria-hidden="true" />
          <span>تعذر تحميل قائمة جلسات فتح الأظرفة. يرجى إعادة المحاولة لاحقاً.</span>
        </div>
      )}

      {!isLoading && !error && (!sessions || sessions.length === 0) && (
        <div className="op-big-empty">
          <div className="op-big-empty-icon">
            <FolderOpen aria-hidden="true" />
          </div>
          <h3>{t('opening.no_sessions')}</h3>
          <p>
            ستظهر هنا جلسات فتح الأظرفة المبرمجة والجارية حالياً للصفقات التي أودعت فيها
            عروضك رسمياً.
          </p>
        </div>
      )}

      {!isLoading && !error && sessions && sessions.length > 0 && (
        <div className="op-grid-2">
          {sessions.map((session) => {
            const progress =
              session.total_offers > 0
                ? Math.round((session.opened_count / session.total_offers) * 100)
                : 0;

            const isLive = session.status === 'live';
            const isEnded = session.status === 'ended';

            return (
              <article
                key={session.id}
                className={`op-card p-5${isLive ? ' ring-1 ring-[var(--op-green)]' : ''}`}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="op-mono rounded-md border border-[var(--op-gold-line)] bg-[var(--op-gold-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--op-gold-dark)]">
                      {session.tender_reference}
                    </span>
                    {getStatusBadge(session.status)}
                  </div>

                  <div>
                    <h2 className="line-clamp-2 text-[15px] font-bold leading-7 text-[var(--op-ink)]">
                      {session.tender_title}
                    </h2>
                    {session.location && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--op-muted)]">
                        <MapPin className="size-3.5 flex-none" aria-hidden="true" />
                        <span className="truncate">{session.location}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--op-line-2)] bg-[var(--op-surface-2)] p-3 text-xs text-[var(--op-text)]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-[var(--op-muted)]" aria-hidden="true" />
                      <span>{new Date(session.scheduled_at).toLocaleDateString('ar-DZ')}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-[var(--op-muted)]" aria-hidden="true" />
                      <span>
                        {new Date(session.scheduled_at).toLocaleTimeString('ar-DZ', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--op-muted)]">
                      <span className="font-medium">{t('opening.opened_count')}</span>
                      <span className="op-mono font-bold text-[var(--op-ink)]">
                        {session.opened_count} من {session.total_offers} ({progress}%)
                      </span>
                    </div>
                    <div className={`op-progress${isLive ? ' green' : isEnded ? ' slate' : ' blue'}`}>
                      <span style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    {isLive ? (
                      <button
                        type="button"
                        className="op-btn op-btn-green"
                        onClick={() => setLocation(`/operator/opening-sessions/${session.id}`)}
                      >
                        <PlayCircle aria-hidden="true" />
                        <span>متابعة البث المباشر</span>
                        <ArrowIcon aria-hidden="true" />
                      </button>
                    ) : isEnded ? (
                      <button
                        type="button"
                        className="op-btn op-btn-outline"
                        onClick={() => setLocation(`/operator/opening-sessions/${session.id}`)}
                      >
                        <FileCheck aria-hidden="true" />
                        <span>عرض التسجيل والنتائج</span>
                        <ArrowIcon aria-hidden="true" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="op-btn op-btn-outline"
                        onClick={() => setLocation(`/operator/opening-sessions/${session.id}`)}
                      >
                        <CheckCircle2 aria-hidden="true" />
                        <span>تفاصيل الموعد</span>
                        <ArrowIcon aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
