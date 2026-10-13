import React, { useState } from "react";
import { useLocation } from "wouter";
import {
  useOpeningSessions,
  useScheduleSession,
  useEligibleTenders,
} from "../hooks/useOpening";
import { useI18n } from "@/i18n";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Radio,
  Plus,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Sliders,
  FolderOpen,
} from "lucide-react";
import type { SessionStatus } from "../types";

export function AuthoritySessionManager() {
  const [, setLocation] = useLocation();
  const { t, dir } = useI18n();

  const { data: sessions, isLoading } = useOpeningSessions();
  const { data: tenders, isLoading: tendersLoading } = useEligibleTenders();
  const scheduleMutation = useScheduleSession();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTenderId, setSelectedTenderId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [locationText, setLocationText] = useState("");
  const [streamUrl, setStreamUrl] = useState("");

  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  const handleOpenDialog = () => {
    // Default to tomorrow 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const isoString = tomorrow.toISOString().slice(0, 16);

    setScheduledAt(isoString);
    setLocationText("قاعة الاجتماعات الرسمية - الطابق الأول");
    setStreamUrl("");
    if (tenders && tenders.length > 0 && !selectedTenderId) {
      setSelectedTenderId(tenders[0].id);
    }
    setIsDialogOpen(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenderId || !scheduledAt || !locationText) return;

    try {
      await scheduleMutation.mutateAsync({
        tender_id: selectedTenderId,
        scheduled_at: new Date(scheduledAt).toISOString(),
        location: locationText,
        stream_url: streamUrl.trim() || undefined,
      });
      setIsDialogOpen(false);
    } catch {
      // Error handled by hook toast
    }
  };

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
          <Badge
            variant="outline"
            className="border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
          >
            {t("opening.scheduled")}
          </Badge>
        );
      case "ended":
        return (
          <Badge
            variant="outline"
            className="border-slate-300 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            {t("opening.ended")}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-navy-900" />
            <h1 className="text-2xl font-black text-navy-900 tracking-tight">
              {t("opening.title")}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            إدارة جلسات فتح الأظرفة العلنية للصفقات، استدعاء المتعهدين، وتسجيل وقائع وقرارات القبول المبدئي وفق القانون 23-12.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{t("opening.privacy_notice")}</span>
          </div>

          <Button
            onClick={handleOpenDialog}
            className="bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs gap-2 rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t("opening.schedule_new")}</span>
          </Button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!sessions || sessions.length === 0) && (
        <Card className="p-12 text-center space-y-4 border-dashed">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-muted-foreground">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-navy-900">
              {t("opening.no_sessions")}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              لم تتم برمجة أي جلسة فتح أظرفة بعد. يمكنك برمجة جلسة فتح جديدة وربطها بإحدى الصفقات المطروحة.
            </p>
          </div>
          <Button
            onClick={handleOpenDialog}
            className="bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs gap-2 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>{t("opening.schedule_new")}</span>
          </Button>
        </Card>
      )}

      {/* Sessions Grid */}
      {!isLoading && sessions && sessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((session) => {
            const progress =
              session.total_offers > 0
                ? Math.round((session.opened_count / session.total_offers) * 100)
                : 0;

            const isLive = session.status === "live";

            return (
              <Card
                key={session.id}
                className={`transition-all hover:shadow-md border ${
                  isLive
                    ? "border-red-500/70 shadow-red-50 bg-gradient-to-b from-red-50/20 to-transparent"
                    : "border-border"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-navy-900 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200">
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
                          isLive ? "bg-red-600" : "bg-navy-900"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <Button
                      onClick={() =>
                        setLocation(`/authority/opening-sessions/${session.id}`)
                      }
                      className="bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs gap-2 rounded-xl"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>إدارة الجلسة / لوحة التحكم</span>
                      <ArrowIcon className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Schedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <form onSubmit={handleScheduleSubmit}>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg font-bold text-navy-900">
                {t("opening.schedule_new")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                حدد الصفقة وموعد ومكان انعقاد جلسة فتح الأظرفة العلنية.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              {/* Tender Select */}
              <div className="space-y-1.5">
                <Label htmlFor="tender" className="text-xs font-semibold">
                  الصفقة المعنية *
                </Label>
                {tendersLoading ? (
                  <Skeleton className="h-9 w-full rounded-xl" />
                ) : tenders && tenders.length > 0 ? (
                  <select
                    id="tender"
                    value={selectedTenderId}
                    onChange={(e) => setSelectedTenderId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">-- اختر صفقة من القائمة --</option>
                    {tenders.map((tender) => (
                      <option key={tender.id} value={tender.id}>
                        {tender.reference_number || tender.reference
                          ? `[${tender.reference_number || tender.reference}] `
                          : ""}
                        {tender.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="tender"
                    placeholder="معرّف الصفقة (UUID)"
                    value={selectedTenderId}
                    onChange={(e) => setSelectedTenderId(e.target.value)}
                    required
                    className="text-xs rounded-xl"
                  />
                )}
              </div>

              {/* Scheduled Date */}
              <div className="space-y-1.5">
                <Label htmlFor="scheduled_at" className="text-xs font-semibold">
                  تاريخ وساعة الجلسة *
                </Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                  className="text-xs rounded-xl"
                />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-semibold">
                  مكان انعقاد الجلسة *
                </Label>
                <Input
                  id="location"
                  placeholder="مثال: قاعة الاجتماعات الكبرى - مقر الولاية"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  required
                  className="text-xs rounded-xl"
                />
              </div>

              {/* Stream URL */}
              <div className="space-y-1.5">
                <Label htmlFor="stream_url" className="text-xs font-semibold">
                  رابط البث المرئي المباشر (اختياري)
                </Label>
                <Input
                  id="stream_url"
                  type="url"
                  placeholder="https://meet.safaqat.dz/session-123"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl text-xs"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={scheduleMutation.isPending}
                className="bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl"
              >
                {scheduleMutation.isPending ? "جاري البرمجة..." : "تأكيد وبرمجة الجلسة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
