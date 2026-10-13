import { useLocation } from "wouter";
import { useOpeningSessions } from "../hooks/useOpening";
import { useI18n } from "@/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "lucide-react";
import type { SessionStatus } from "../types";

export function OperatorSessionList() {
  const [, setLocation] = useLocation();
  const { t, dir } = useI18n();
  const { data: sessions, isLoading, error } = useOpeningSessions();

  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  const getStatusBadge = (status: SessionStatus) => {
    switch (status) {
      case "live":
        return (
          <Badge className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 px-2.5 py-1 text-xs animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white inline-block animate-ping" />
            {t("opening.live")}
          </Badge>
        );
      case "scheduled":
        return (
          <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            {t("opening.scheduled")}
          </Badge>
        );
      case "ended":
        return (
          <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {t("opening.ended")}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive">
            {t("opening.cancelled")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-emerald-600 animate-pulse" />
            <h1 className="text-2xl font-black text-navy-900 tracking-tight">
              {t("opening.title")}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            متابعة جلسات فتح الأظرفة العلنية الخاصة بالصفقات المشارك فيها وفق المرسوم الرئاسي 15-247 والقانون 23-12.
          </p>
        </div>

        {/* Data Privacy Badge (Law 18-07) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-xs font-semibold self-start sm:self-auto">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{t("opening.privacy_notice")}</span>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card className="border-red-200 bg-red-50 text-red-900 p-6 text-center text-sm">
          <p>تعذر تحميل قائمة جلسات فتح الأظرفة. يرجى إعادة المحاولة لاحقاً.</p>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!sessions || sessions.length === 0) && (
        <Card className="p-12 text-center space-y-3 border-dashed">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-muted-foreground">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-navy-900">
            {t("opening.no_sessions")}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            ستظهر هنا جلسات فتح الأظرفة المبرمجة والجارية حالياً للصفقات التي أودعت فيها عروضك رسمياً.
          </p>
        </Card>
      )}

      {/* Sessions Grid */}
      {!isLoading && !error && sessions && sessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((session) => {
            const progress =
              session.total_offers > 0
                ? Math.round((session.opened_count / session.total_offers) * 100)
                : 0;

            const isLive = session.status === "live";
            const isEnded = session.status === "ended";

            return (
              <Card
                key={session.id}
                className={`transition-all hover:shadow-md border ${
                  isLive
                    ? "border-emerald-500/60 shadow-emerald-50 dark:border-emerald-700 bg-gradient-to-b from-emerald-50/20 to-transparent"
                    : "border-border"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200">
                          {session.tender_reference}
                        </span>
                        {getStatusBadge(session.status)}
                      </div>
                      <CardTitle className="text-base font-bold text-navy-900 line-clamp-2 leading-snug">
                        {session.tender_title}
                      </CardTitle>
                    </div>
                  </div>
                  {session.location && (
                    <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{session.location}</span>
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Schedule Info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(session.scheduled_at).toLocaleDateString("ar-DZ")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(session.scheduled_at).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium">{t("opening.opened_count")}</span>
                      <span className="font-bold text-navy-900 font-mono">
                        {session.opened_count} / {session.total_offers} ({progress}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isLive ? "bg-emerald-600" : isEnded ? "bg-slate-600" : "bg-blue-600"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 flex items-center justify-end">
                    {isLive ? (
                      <Button
                        onClick={() => setLocation(`/operator/opening-sessions/${session.id}`)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 rounded-xl shadow-sm"
                      >
                        <PlayCircle className="w-4 h-4 text-emerald-200" />
                        <span>متابعة البث المباشر</span>
                        <ArrowIcon className="w-3.5 h-3.5" />
                      </Button>
                    ) : isEnded ? (
                      <Button
                        variant="outline"
                        onClick={() => setLocation(`/operator/opening-sessions/${session.id}`)}
                        className="text-xs font-bold gap-1.5 rounded-xl text-slate-700 dark:text-slate-200"
                      >
                        <FileCheck className="w-4 h-4 text-slate-500" />
                        <span>عرض التسجيل والنتائج</span>
                        <ArrowIcon className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => setLocation(`/operator/opening-sessions/${session.id}`)}
                        className="text-xs font-semibold gap-1.5 rounded-xl"
                      >
                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                        <span>تفاصيل الموعد</span>
                        <ArrowIcon className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
