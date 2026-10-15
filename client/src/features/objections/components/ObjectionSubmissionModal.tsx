import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Send,
  Loader2,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { objectionsApi } from '../api/objections';
import type { ObjectionType, ObjectionGround, CreateObjectionPayload } from '../types';
import { GROUND_LABELS, TYPE_LABELS } from '../types';

interface ObjectionSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ObjectionSubmissionModal({
  open,
  onOpenChange,
  onSuccess,
}: ObjectionSubmissionModalProps) {
  const [deals, setDeals] = useState<any[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedTenderId, setSelectedTenderId] = useState('');
  const [objectionType, setObjectionType] = useState<ObjectionType>('administrative');
  const [selectedGrounds, setSelectedGrounds] = useState<ObjectionGround[]>(['evaluation']);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      setLoadingDeals(true);
      objectionsApi
        .listEligibleDeals()
        .then((res) => {
          setDeals(res || []);
          if (res && res.length > 0 && !selectedTenderId) {
            setSelectedTenderId(res[0].id);
          }
        })
        .catch(() => {
          toast.error('تعذر جلب الصفقات المتاحة.');
        })
        .finally(() => setLoadingDeals(false));
    }
  }, [open]);

  const toggleGround = (ground: ObjectionGround) => {
    setSelectedGrounds((prev) =>
      prev.includes(ground)
        ? prev.filter((g) => g !== ground)
        : [...prev, ground]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTenderId) {
      toast.error('يرجى اختيار الصفقة محل الطعن.');
      return;
    }

    if (selectedGrounds.length === 0) {
      toast.error('يرجى اختيار سبب واحد للطعن على الأقل.');
      return;
    }

    if (description.trim().length < 20) {
      toast.error('يرجى كتابة تفاصيل الطعن وأسبابه (20 حرفاً على الأقل).');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateObjectionPayload = {
        tender_id: selectedTenderId,
        objection_type: objectionType,
        grounds: selectedGrounds,
        description: description.trim(),
      };

      await objectionsApi.create(payload);
      toast.success('تم إيداع الطعن وتوثيقه بنجاح مع بصمة SHA-256.');
      setDescription('');
      setSelectedGrounds(['evaluation']);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'تعذر إيداع الطعن. يرجى مراجعة الشروط والآجال.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto font-sans text-start">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-slate-200 pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-700" />
              <span>إيداع طعن على قرار الإسناد المؤقت</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              المادة 72 من القانون 23-12: يجب إيداع الطعن خلال مهلة 10 أيام من تاريخ الإعلان، مع وجوب تقديم عرض مسبق في الصفقة.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4 text-sm">
            {/* Tender Selection */}
            <div>
              <Label htmlFor="tender-select" className="text-xs font-bold text-slate-700 mb-1.5 block">
                الصفقة المعنية بالطعن:
              </Label>
              {loadingDeals ? (
                <div className="text-xs text-slate-400 py-2">جاري تحميل الصفقات...</div>
              ) : deals.length > 0 ? (
                <select
                  id="tender-select"
                  value={selectedTenderId}
                  onChange={(e) => setSelectedTenderId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {deals.map((deal) => (
                    <option key={deal.id} value={deal.id}>
                      {deal.reference_number} — {deal.title}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  لم يتم العثور على صفقات نشطة في مرحلة الإسناد المؤقت.
                </div>
              )}
            </div>

            {/* Objection Type */}
            <div>
              <Label className="text-xs font-bold text-slate-700 mb-2 block">نوع الطعن:</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['administrative', 'judicial'] as ObjectionType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setObjectionType(type)}
                    className={`p-3 rounded-xl border text-start transition-all ${
                      objectionType === type
                        ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">{TYPE_LABELS[type]}</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {type === 'administrative'
                        ? 'أمام لجنة الصفقات العمومية للمصلحة المتعاقدة'
                        : 'أمام المحكمة الإدارية المختصة إقليمياً'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Grounds (Multiple selection) */}
            <div>
              <Label className="text-xs font-bold text-slate-700 mb-2 block">
                أسباب وأوجه الطعن القانونية (اختر ما ينطبق):
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(GROUND_LABELS) as ObjectionGround[]).map((ground) => {
                  const isChecked = selectedGrounds.includes(ground);
                  return (
                    <button
                      key={ground}
                      type="button"
                      onClick={() => toggleGround(ground)}
                      className={`px-3 py-2 rounded-lg border text-start flex items-center justify-between text-xs transition-colors ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{GROUND_LABELS[ground]}</span>
                      {isChecked && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="desc-input" className="text-xs font-bold text-slate-700 mb-1.5 block">
                شرح وتفاصيل أسباب الطعن والمآخذ الموضوعية:
              </Label>
              <Textarea
                id="desc-input"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="بيّن بالتفصيل النقاط القانونية والتقنية أو المالية محل الاعتراض ومطابقتها لدفتر الشروط..."
                className="text-xs"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                <span>يجب أن يتضمن الطعن وقائع واضحة قابلة للتدقيق.</span>
                <span className={description.trim().length < 20 ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                  {description.trim().length}/20 حرفاً
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between border-t border-slate-200 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || description.trim().length < 20}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin me-1.5" />
                  جاري الإيداع والتوثيق...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 me-1.5" />
                  إيداع الطعن رسمياً
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
