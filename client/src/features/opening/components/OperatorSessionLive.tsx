import { useLocation, useParams } from "wouter";
import { useOpeningSession } from "../hooks/useOpening";
import { useI18n } from "@/i18n";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  ArrowLeft,
  MapPin,
  Clock,
  ShieldAlert,
  Video,
  XCircle,
  Clock4,
  Building2,
  Sparkles,
  Info,
  Check,
} from "lucide-react";

interface OperatorSessionLiveProps {
  sessionId?: string;
  params?: { id?: string };
}

export function OperatorSessionLive({ sessionId, params }: OperatorSessionLiveProps = {}) {
  const routeParams = useParams<{ id: string }>();
  const id = sessionId || params?.id || routeParams.id;
  const [, setLocation] = useLocation();
  const { t, dir } = useI18n();

  const { data: session, isLoading, error } = useOpeningSession(id || null);

  const ArrowIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Card className="p-6 space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-24 w-full" />
        </Card>
      </div>
    );
  }

  if (error || !session) {
    return (
      <Card className="p-8 text-center space-y-4 border-red-200 bg-red-50 text-red-900">
        <h3 className="text-base font-bold">تعذر فتح تفاصيل الجلسة</h3>
        <p className="text-xs text-red-700">
          قد تكون الجلسة غير موجودة أو أن حسابك لا يملك تصريح الحضور لهذه الصفقة.
        </p>
        <Button
          variant="outline"
          onClick={() => setLocation("/operator/opening-sessions")}
          className="rounded-xl text-xs"
        >
          العودة لقائمة الجلسات
        </Button>
      </Card>
    );
  }

  const isLive = session.status === "live";
  const isScheduled = session.status === "scheduled";
  const isEnded = session.status === "ended";

  const progress =
    session.total_offers > 0
      ? Math.round((session.opened_count / session.total_offers) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/operator/opening-sessions")}
          className="gap-2 rounded-xl text-xs font-semibold hover:bg-slate-100 text-slate-700"
        >
          <ArrowIcon className="w-4 h-4" />
          <span>العودة لجلسات الفتح</span>
        </Button>

        {/* Law 18-07 Privacy Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{t("opening.privacy_notice")}</span>
        </div>
      </div>

      {/* Main Live Banner */}
      <Card
        className={`border overflow-hidden shadow-sm ${
          isLive
            ? "border-emerald-500 bg-gradient-to-r from-emerald-950 via-navy-900 to-navy-950 text-white"
            : isEnded
            ? "border-slate-300 bg-gradient-to-r from-slate-900 to-navy-900 text-white"
            : "border-blue-300 bg-gradient-to-r from-blue-950 to-navy-900 text-white"
        }`}
      >
        <div className="p-6 md:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {isLive ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black animate-pulse shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-white inline-block animate-ping" />
                  {t("opening.live")}
                </span>
              ) : isEnded ? (
                <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-200 text-xs font-bold">
                  {t("opening.ended")}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-blue-600 text-blue-100 text-xs font-bold">
                  {t("opening.scheduled")}
                </span>
              )}

              <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-white/10 text-white font-bold border border-white/15">
                {session.tender_reference}
              </span>
            </div>

            {session.stream_url && (
              <a
                href={session.stream_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
              >
                <Video className="w-4 h-4" />
                <span>رابط البث المرئي المباشر</span>
              </a>
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-black text-white leading-tight">
              {session.tender_title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-white/80 pt-1">
              {session.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{session.location}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>الموعد: {new Date(session.scheduled_at).toLocaleString("ar-DZ")}</span>
              </span>
              {session.authority_name && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>المصلحة المتعاقدة: {session.authority_name}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Progress Section */}
      <Card className="p-5 border-border shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-navy-900 text-sm">
                مستوى تقدم فتح أظرفة العروض
              </span>
              {isLive && (
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  تحديث تلقائي كل 3 ثوان ⟳
                </span>
              )}
            </div>
            <span className="font-mono font-bold text-navy-900 text-sm">
              {session.opened_count} / {session.total_offers} ({progress}%)
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${
                isLive
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                  : isEnded
                  ? "bg-slate-600"
                  : "bg-blue-600"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span>{t("opening.opened_count")}: {session.opened_count}</span>
            <span>{t("opening.total_offers")}: {session.total_offers}</span>
          </div>
        </div>
      </Card>

      {/* Waiting state message */}
      {isScheduled && (
        <Card className="p-8 text-center space-y-3 bg-blue-50/50 border-blue-200">
          <Clock4 className="w-10 h-10 text-blue-600 mx-auto animate-pulse" />
          <h3 className="text-base font-bold text-blue-950">
            {t("opening.waiting_start")}
          </h3>
          <p className="text-xs text-blue-800 max-w-md mx-auto leading-relaxed">
            تم تسجيل حضورك الافتراضي في جلسة فتح الأظرفة. سيتم بث مبالغ العروض المعلنة وقرارات القبول المبدئي تباعاً بمجرد افتتاح الجلسة من قبل المصلحة المتعاقدة.
          </p>
        </Card>
      )}

      {/* Events / Opened Offers Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>وقائع فتح الأظرفة المُعلنة</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              يتم إعلان مبالغ العروض علناً وفق المادة 72 من المرسوم الرئاسي 15-247 مع حجب الهويات التجارية للمنافسين احتراماً للقانون 18-07.
            </p>
          </div>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold px-3 py-1 rounded-full border">
            {session.events?.length || 0} أحداث مسجلة
          </span>
        </div>

        {(!session.events || session.events.length === 0) && !isScheduled && (
          <Card className="p-8 text-center text-muted-foreground text-xs border-dashed">
            لم يتم تسجيل أي ظرف مفتوح حتى الآن في هذه الجلسة.
          </Card>
        )}

        <div className="space-y-3">
          {session.events?.map((event, index) => {
            const isMyOffer = event.is_my_offer;

            return (
              <Card
                key={event.id || index}
                className={`p-4 md:p-5 transition-all border ${
                  isMyOffer
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm ring-1 ring-emerald-500/30"
                    : "border-border hover:bg-slate-50/50 dark:hover:bg-slate-900/20"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Left: Order and Bidder Label */}
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                        isMyOffer
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {event.order || index + 1}
                    </span>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong
                          className={`text-sm ${
                            isMyOffer
                              ? "text-emerald-900 dark:text-emerald-300 font-black"
                              : "text-navy-900 font-bold"
                          }`}
                        >
                          {isMyOffer
                            ? `${t("opening.your_offer")} (المتعامل الاقتصادي الحالي)`
                            : event.operator_label || t("opening.competitor")}
                        </strong>

                        {isMyOffer && (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-2 py-0">
                            عرضك المودع
                          </Badge>
                        )}

                        {event.is_accepted ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] gap-1"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>مقبول مبدئياً</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="text-[10px] gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>مرفوض لعدم المطابقة</span>
                          </Badge>
                        )}
                      </div>

                      {event.notes && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{event.notes}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Announced Price and Timestamp */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
                    <div className="text-start sm:text-end">
                      <div className="text-[10px] text-muted-foreground font-medium">
                        {t("opening.announced_price")}
                      </div>
                      <div
                        className={`text-base md:text-lg font-mono font-black ${
                          isMyOffer
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-navy-900 dark:text-slate-100"
                        }`}
                      >
                        {event.announced_price != null
                          ? `${Number(event.announced_price).toLocaleString("ar-DZ")} دج`
                          : "—"}
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {event.created_at
                          ? new Date(event.created_at).toLocaleTimeString("ar-DZ")
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
