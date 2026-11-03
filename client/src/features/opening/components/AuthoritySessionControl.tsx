import React, { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  useOpeningSession,
  useStartSession,
  useEndSession,
  useOpenOffer,
  useSessionOffers,
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
  ArrowRight,
  ArrowLeft,
  PlayCircle,
  StopCircle,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldAlert,
  FileText,
  Video,
  AlertCircle,
  Layers,
  History,
  Download,
} from "lucide-react";
import { downloadPdfBlob } from "@/lib/pdfDownloader";
import type { DealOfferSummary } from "../types";
import { CommitteeQuorumCeremony } from "./CommitteeQuorumCeremony";

export function AuthoritySessionControl() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [, setLocation] = useLocation();
  const { t, lang, dir } = useI18n();

  const { data: session, isLoading, error } = useOpeningSession(id || null);
  const { data: dealOffers, isLoading: offersLoading } = useSessionOffers(
    session?.id
  );

  const startMutation = useStartSession();
  const isUnlocked = Boolean(session?.ceremony_status === "unlocked" || session?.quorum_reached);
  const endMutation = useEndSession();
  const openOfferMutation = useOpenOffer();

  // Dialog state for opening an offer
  const [selectedOffer, setSelectedOffer] = useState<DealOfferSummary | null>(null);
  const [announcedPrice, setAnnouncedPrice] = useState<string>("");
  const [isAccepted, setIsAccepted] = useState<boolean>(true);
  const [offerNotes, setOfferNotes] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // Dialog state for ending the session
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  const handleDownloadPdf = async () => {
    if (!session?.id) return;
    setIsDownloadingPdf(true);
    try {
      const filename = `PV_Opening_${session.tender_reference || session.id}.pdf`;
      await downloadPdfBlob(`/procurements/sessions/${session.id}/pdf/`, filename);
    } catch (err: any) {
      alert(t("opening.pdf_export_error"));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const ArrowIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  const handleStartSession = async () => {
    if (!session?.id) return;
    try {
      await startMutation.mutateAsync(session.id);
    } catch {
      // Error handled by hook toast
    }
  };

  const handleEndSession = async () => {
    if (!session?.id) return;
    try {
      await endMutation.mutateAsync(session.id);
      setIsEndConfirmOpen(false);
    } catch {
      // Error handled by hook toast
    }
  };

  const handleOpenOfferClick = (offer: DealOfferSummary) => {
    setSelectedOffer(offer);
    const initialPrice =
      offer.financial_amount != null ? String(offer.financial_amount) : "";
    setAnnouncedPrice(initialPrice);
    setIsAccepted(true);
    setOfferNotes("");
    setIsDialogOpen(true);
  };

  const handleSubmitOpenOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.id || !selectedOffer?.id) return;

    const priceNum = parseFloat(announcedPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      return;
    }

    try {
      await openOfferMutation.mutateAsync({
        id: session.id,
        payload: {
          offer_id: selectedOffer.id,
          announced_price: priceNum,
          is_accepted: isAccepted,
          notes: offerNotes.trim() || undefined,
        },
      });
      setIsDialogOpen(false);
      setSelectedOffer(null);
    } catch {
      // Error handled by hook toast
    }
  };

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
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold text-navy-900">
          {t("opening.load_session_error")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("opening.session_not_found")}</p>
        <Button
          onClick={() => setLocation("/authority/opening-sessions")}
          variant="outline"
          className="rounded-xl text-xs gap-2"
        >
          <ArrowIcon className="w-4 h-4" />
          <span>{t("opening.back_to_sessions")}</span>
        </Button>
      </div>
    );
  }

  const isLive = session.status === "live";
  const isScheduled = session.status === "scheduled";
  const isEnded = session.status === "ended";

  const progress =
    session.total_offers > 0
      ? Math.min(100, Math.round((session.opened_count / session.total_offers) * 100))
      : 0;

  // Set of offer IDs already opened in events
  const openedOfferIds = new Set(
    session.events.filter((e) => e.offer_id).map((e) => e.offer_id)
  );

  return (
    <div className="space-y-6">
      {/* Top Navigation & Compliance Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/authority/opening-sessions")}
            className="rounded-xl text-xs gap-1.5"
          >
            <ArrowIcon className="w-4 h-4" />
            <span>{t("opening.sessions_breadcrumb")}</span>
          </Button>

          <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-navy-900 px-2.5 py-1 rounded-md border border-slate-200">
            {session.tender_reference}
          </span>
        </div>

        {/* Badge Law 18-07 */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs py-1 px-3 flex items-center gap-1.5 font-medium rounded-full"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>{t("opening.privacy_notice")}</span>
          </Badge>
        </div>
      </div>

      {/* Main Session Control Header Card */}
      <Card
        className={`border shadow-sm overflow-hidden ${
          isLive
            ? "border-red-500/50 shadow-red-50/50"
            : isEnded
            ? "border-slate-300"
            : "border-blue-300"
        }`}
      >
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/60 dark:to-slate-900/20 border-b pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {isLive && (
                  <Badge className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 px-3 py-1 text-xs animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white inline-block animate-ping" />
                    <span>{t("opening.live")}</span>
                  </Badge>
                )}
                {isScheduled && (
                  <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs">
                    <Clock className="w-3 h-3 me-1" />
                    <span>{t("opening.scheduled")}</span>
                  </Badge>
                )}
                {isEnded && (
                  <Badge className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1 text-xs">
                    <CheckCircle2 className="w-3 h-3 me-1" />
                    <span>{t("opening.ended")}</span>
                  </Badge>
                )}

                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {session.location || t("opening.location_hq")}
                </span>

                {session.stream_url && (
                  <a
                    href={session.stream_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 ms-2"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>{t("opening.live_stream_link")}</span>
                  </a>
                )}
              </div>

              <CardTitle className="text-lg sm:text-xl font-bold text-navy-900">
                {session.tender_title}
              </CardTitle>

              <CardDescription className="text-xs text-slate-500">
                {t("opening.session_date_label")}{" "}
                <strong className="text-navy-900">
                  {new Date(session.scheduled_at).toLocaleString("ar-DZ")}
                </strong>
                {session.started_at && (
                  <span className="ms-3">
                    {t("opening.session_started_label")}{" "}
                    <strong>{new Date(session.started_at).toLocaleTimeString("ar-DZ")}</strong>
                  </span>
                )}
                {session.ended_at && (
                  <span className="ms-3">
                    {t("opening.session_ended_label")}{" "}
                    <strong>{new Date(session.ended_at).toLocaleTimeString("ar-DZ")}</strong>
                  </span>
                )}
              </CardDescription>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Button
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs gap-1.5 rounded-xl shadow-sm px-3.5 py-2"
                title={t("opening.download_minutes_tooltip")}
              >
                <FileText className="w-4 h-4 text-blue-700" />
                <span>{isDownloadingPdf ? t("opening.generating") : t("opening.download_minutes_pdf")}</span>
              </Button>

              {isScheduled && (
                <Button
                  onClick={handleStartSession}
                  disabled={startMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 rounded-xl shadow-sm px-4 py-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>
                    {startMutation.isPending ? t("opening.starting") : t("opening.start")}
                  </span>
                </Button>
              )}

              {isLive && (
                <Button
                  variant="destructive"
                  onClick={() => setIsEndConfirmOpen(true)}
                  disabled={endMutation.isPending}
                  className="font-bold text-xs gap-2 rounded-xl shadow-sm px-4 py-2"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>{t("opening.end")}</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {t("opening.opened_count")}:{" "}
                <span className="font-bold text-navy-900 font-mono">
                  {session.opened_count}
                </span>{" "}
                {t("opening.of_total")}{" "}
                <span className="font-bold text-navy-900 font-mono">
                  {session.total_offers}
                </span>{" "}
                {t("opening.deposited_offers")}
              </span>
              <span className="font-bold text-navy-900 font-mono text-sm">
                {progress}%
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isLive ? "bg-red-600" : isEnded ? "bg-slate-700" : "bg-blue-600"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Committee Shamir Threshold Quorum Ceremony (المادة 70 من القانون 23-12) */}
      <CommitteeQuorumCeremony session={session} />

      {/* Grid: Offers to open vs Live Session Events Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Submitted Offers List */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-navy-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>{t("opening.deposited_offers_title")}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t("opening.deposited_offers_desc")}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {t("opening.offers_count", { count: dealOffers?.length ?? session.total_offers })}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {offersLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              ) : dealOffers && dealOffers.length > 0 ? (
                dealOffers.map((offer, idx) => {
                  const isOpened = openedOfferIds.has(offer.id);
                  const matchingEvent = session.events.find(
                    (e) => e.offer_id === offer.id
                  );

                  return (
                    <div
                      key={offer.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isOpened
                          ? "bg-slate-50/80 dark:bg-slate-900/30 border-slate-200 text-muted-foreground"
                          : "bg-white dark:bg-slate-900 border-slate-200 hover:border-slate-300 shadow-xs"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 px-2 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-sm text-navy-900">
                              {offer.operator_name || offer.operator || t("opening.default_operator")}
                            </span>
                            {isOpened && (
                              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[11px] px-2 py-0.5 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 me-1" />
                                <span>{t("opening.status_opened")}</span>
                              </Badge>
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground flex items-center gap-3">
                            {offer.financial_amount != null && (
                              <span>
                                {t("opening.proposed_price_label")}{" "}
                                <strong className="text-navy-900 font-mono">
                                  {Number(offer.financial_amount).toLocaleString("ar-DZ")}{" "}
                                  {t("common.dzd")}
                                </strong>
                              </span>
                            )}
                            {matchingEvent && matchingEvent.announced_price != null && (
                              <span className="text-emerald-700 font-medium">
                                {t("opening.announced_officially_label")}{" "}
                                <strong className="font-mono">
                                  {Number(matchingEvent.announced_price).toLocaleString(
                                    "ar-DZ"
                                  )}{" "}
                                  {t("common.dzd")}
                                </strong>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action: Open Offer Button */}
                        <div>
                          {!isOpened && (
                            <Button
                              onClick={() => handleOpenOfferClick(offer)}
                              disabled={!isLive || openOfferMutation.isPending || !isUnlocked}
                              title={
                                !isLive
                                ? t("opening.must_start_first_tooltip")
                                : !isUnlocked
                                ? "يجب اكتمال النصاب القانوني لمراسم التشفير التعددي للجنة أولاً (المادة 70 من القانون 23-12)"
                                : undefined
                              }
                              className={`font-bold text-xs gap-1.5 rounded-xl whitespace-nowrap shadow-xs ${
                                !isUnlocked
                                  ? "bg-slate-300 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                                  : "bg-navy-900 hover:bg-navy-800 text-white"
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>
                                {!isUnlocked
                                  ? "بانتظار نصاب اللجنة"
                                  : t("opening.open_offer")}
                              </span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-muted-foreground text-xs space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>{t("opening.no_offers_yet")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (5 cols): Events Record Feed */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-navy-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>{t("opening.minutes_records_title")}</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[11px] font-mono">
                    {t("opening.events_count", { count: session.events.length })}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    className="h-7 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50 px-2 rounded-lg gap-1 font-semibold"
                    title={t("opening.export_minutes_pdf_tooltip")}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t("opening.export_pdf")}</span>
                  </Button>
                </div>
              </div>
              <CardDescription className="text-xs">
                {t("opening.records_timeline_desc")}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {session.events && session.events.length > 0 ? (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pe-1">
                  {session.events.map((event, idx) => {
                    const isAcceptedEvent = event.is_accepted !== false;
                    return (
                      <div
                        key={event.id || idx}
                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-600 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border text-[11px]">
                              #{event.order || idx + 1}
                            </span>
                            <span className="font-bold text-navy-900">
                              {event.operator_display ||
                                event.operator_label ||
                                t("opening.bidder_offer")}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(event.created_at).toLocaleTimeString("ar-DZ", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>

                        {event.announced_price != null && (
                          <div className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100">
                            <span className="text-muted-foreground">
                              {t("opening.announced_price")}:
                            </span>
                            <span className="font-mono font-bold text-navy-900 text-sm">
                              {Number(event.announced_price).toLocaleString(lang === "fr" ? "fr-DZ" : "ar-DZ")} {t("common.dzd")}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          {isAcceptedEvent ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] px-2 py-0.5">
                              {t("opening.status_accepted")}
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-[10px] px-2 py-0.5">
                              {t("opening.status_rejected")}
                            </Badge>
                          )}

                          {event.notes && (
                            <span className="text-[11px] text-slate-600 italic">
                              &ldquo;{event.notes}&rdquo;
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-xs space-y-2">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>{t("opening.waiting_start")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog: Open Offer and Announce Price */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-navy-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>{t("opening.modal_open_title")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t("opening.modal_open_desc")}
            </DialogDescription>
          </DialogHeader>

          {selectedOffer && (
            <form onSubmit={handleSubmitOpenOffer} className="space-y-4 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border text-xs space-y-1">
                <span className="text-muted-foreground block">{t("opening.modal_operator_label")}</span>
                <strong className="text-navy-900 text-sm block">
                  {selectedOffer.operator_name || selectedOffer.operator || t("opening.default_operator")}
                </strong>
              </div>

              {/* Announced Price Input */}
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-xs font-semibold">
                  {t("opening.announced_price")} ({t("common.dzd")}) *
                </Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={announcedPrice}
                    onChange={(e) => setAnnouncedPrice(e.target.value)}
                    required
                    className="text-sm font-mono font-bold rounded-xl pe-12"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    {t("common.dzd")}
                  </span>
                </div>
              </div>

              {/* Status / Acceptance checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_accepted"
                  checked={isAccepted}
                  onChange={(e) => setIsAccepted(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <Label
                  htmlFor="is_accepted"
                  className="text-xs font-medium cursor-pointer"
                >
                  {t("opening.formal_compliance_label")}
                </Label>
              </div>

              {/* Notes Input */}
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-semibold">
                  {t("opening.remarks_label")}
                </Label>
                <textarea
                  id="notes"
                  rows={2}
                  placeholder={t("opening.remarks_placeholder")}
                  value={offerNotes}
                  onChange={(e) => setOfferNotes(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background p-2.5 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-xl text-xs"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={openOfferMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                >
                  {openOfferMutation.isPending ? t("opening.saving") : t("opening.btn_confirm_open")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: End Session Confirmation */}
      <Dialog open={isEndConfirmOpen} onOpenChange={setIsEndConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl" dir={dir}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-navy-900 flex items-center gap-2">
              <StopCircle className="w-5 h-5 text-red-600" />
              <span>{t("opening.end")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t("opening.modal_end_desc")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEndConfirmOpen(false)}
              className="rounded-xl text-xs"
            >
              {t("opening.btn_continue_session")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={endMutation.isPending}
              onClick={handleEndSession}
              className="font-bold text-xs rounded-xl"
            >
              {endMutation.isPending ? t("opening.ending") : t("opening.btn_confirm_end")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
