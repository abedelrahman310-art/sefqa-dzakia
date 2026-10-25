import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  History,
  Lock,
} from 'lucide-react';
import type { ObjectionDetailItem } from '../types';
import { GROUND_LABELS, TYPE_LABELS } from '../types';

interface ObjectionDetailModalProps {
  objection: ObjectionDetailItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWithdraw?: (id: string) => void;
  canWithdraw?: boolean;
}

export function ObjectionDetailModal({
  objection,
  open,
  onOpenChange,
  onWithdraw,
  canWithdraw = false,
}: ObjectionDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!objection) return null;

  const handleCopyChecksum = () => {
    navigator.clipboard.writeText(objection.checksum);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-blue-50 text-blue-800 border-blue-200">مُودع رسمياً</Badge>;
      case 'under_review':
        return <Badge className="bg-amber-50 text-amber-800 border-amber-300">قيد الدراسة أمام اللجنة</Badge>;
      case 'accepted':
        return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300">مقبول — إلغاء الإسناد المؤقت</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-50 text-rose-800 border-rose-300">مرفوض — تثبيت الإسناد</Badge>;
      case 'withdrawn':
        return <Badge className="bg-slate-100 text-slate-700 border-slate-300">مسحوب بطلب المُطعِن</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto font-sans text-start">
        <DialogHeader className="border-b border-slate-200 pb-3">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-700" />
              <span>ملف الطعن: {objection.reference}</span>
            </DialogTitle>
            {getStatusBadge(objection.status)}
          </div>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            وفق أحكام المادة 72 من القانون 23-12 المتعلق بالصفقات العمومية
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3 text-sm">
          {/* Tender & Subject Information */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>الصفقة محل الطعن:</span>
              <span className="font-mono font-bold text-slate-800">{objection.tender_reference}</span>
            </div>
            {objection.tender_title && (
              <div className="text-sm font-semibold text-slate-900">
                {objection.tender_title}
              </div>
            )}
            <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-200 text-xs text-slate-600">
              <div>
                <span className="text-slate-500">نوع الطعن: </span>
                <strong className="text-slate-800">{TYPE_LABELS[objection.objection_type] || objection.objection_type}</strong>
              </div>
              <div>
                <span className="text-slate-500">المُطعِن: </span>
                <strong className="text-slate-800">{objection.objector_name}</strong>
              </div>
            </div>
          </div>

          {/* Grounds / الأسباب */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2">أسباب وأوجه الطعن القانونية:</h4>
            <div className="flex flex-wrap gap-2">
              {objection.grounds.map((g, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200"
                >
                  {GROUND_LABELS[g] || g}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-1.5">بيان تفاصيل وأسباب الطعن:</h4>
            <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs leading-relaxed whitespace-pre-wrap">
              {objection.description}
            </div>
          </div>

          {/* Decision Section if decided */}
          {objection.decision && (
            <div
              className={`p-4 rounded-xl border ${
                objection.decision === 'accepted'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-2 text-sm">
                {objection.decision === 'accepted' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-700" />
                )}
                <span>
                  قرار لجنة الصفقات: {objection.decision === 'accepted' ? 'قبول الطعن وإلغاء الإسناد المؤقت' : 'رفض الطعن وتثبيت الإسناد'}
                </span>
              </div>
              <p className="text-xs leading-relaxed">
                {objection.decision_reason || 'لا يوجد تبرير مرفق.'}
              </p>
              {objection.review_ended_at && (
                <div className="text-[11px] text-slate-500 mt-2">
                  تاريخ صدور القرار: {new Date(objection.review_ended_at).toLocaleString('ar-DZ')}
                </div>
              )}
            </div>
          )}

          {/* Timeline / السجل الزمني */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-600" />
              <span>السجل الزمني للأحداث الإجرائية:</span>
            </h4>
            <div className="space-y-2 border-s-2 border-slate-200 ms-2 ps-3 text-xs">
              {objection.timeline && objection.timeline.length > 0 ? (
                objection.timeline.map((item, idx) => (
                  <div key={idx} className="relative pb-3">
                    <div className="absolute -start-[19px] top-0 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white ring-1 ring-emerald-200" />
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>{item.actor_name || 'النظام'}</span>
                      <span>{new Date(item.created_at).toLocaleString('ar-DZ')}</span>
                    </div>
                    <div className="font-semibold text-slate-800 mt-0.5">{item.notes}</div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-xs">لا توجد أحداث مسجلة بعد.</div>
              )}
            </div>
          </div>

          {/* Legal Security & Checksum */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] text-slate-500">بصمة النزاهة الرقمية (SHA-256) — القانون 18-07:</div>
                <div className="font-mono text-[10px] text-slate-800 truncate select-all">{objection.checksum}</div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs shrink-0"
              onClick={handleCopyChecksum}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="ms-1">{copied ? 'تم النسخ' : 'نسخ'}</span>
            </Button>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between border-t border-slate-200 pt-3">
          {canWithdraw && (objection.status === 'submitted' || objection.status === 'under_review') ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onWithdraw && onWithdraw(objection.id)}
            >
              سحب الطعن
            </Button>
          ) : (
            <div />
          )}
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
