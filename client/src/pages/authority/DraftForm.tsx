import React, { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, ArrowRight, ArrowLeft, Upload, FileCheck, Send, AlertCircle } from 'lucide-react';

export function DraftForm({ id }: { id?: string }) {
  const { t, dir } = useI18n();
  const [, setLocation] = useLocation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(id ? true : false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [hasDoc, setHasDoc] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/drafts/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then((data) => {
          if (data.draft) {
            setTitle(data.draft.title);
            setDescription(data.draft.description);
            setBudget(data.draft.estimatedBudget || '');
            setStatus(data.draft.status);
            setHasDoc(!!data.draft.documentPath);
          }
        })
        .catch(() => {
          setLocation('/authority/drafts');
        })
        .finally(() => setLoading(false));
    }
  }, [id, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (title.length < 3) {
      setSubmitting(false);
      return setError(t('drafts.msg.error'));
    }
    if (description.length < 5) {
      setSubmitting(false);
      return setError(t('drafts.msg.error'));
    }

    const url = id ? `/api/drafts/${id}` : '/api/drafts';
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-safaqat-csrf': '1',
        },
        body: JSON.stringify({
          title,
          description,
          estimatedBudget: budget || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      setLocation('/authority/drafts');
    } catch (err) {
      setError(t('drafts.msg.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    if (!window.confirm('هل أنت متأكد من رغبتك في إتاحة هذه المسودة تجريبياً للمتعاملين؟ لن تتمكن من تعديلها لاحقاً.')) {
      return;
    }
    try {
      const res = await fetch(`/api/drafts/${id}/publish`, {
        method: 'POST',
        headers: {
          'x-safaqat-csrf': '1',
        },
      });
      if (!res.ok) throw new Error('Publish failed');
      setLocation('/authority/drafts');
    } catch (err) {
      setError(t('drafts.msg.error'));
    }
  };

  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-muted-foreground space-y-2">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">جاري تحميل بيانات المسودة...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <section className="rounded-2xl p-6 md:p-8 text-white bg-gradient-to-r from-navy-900 to-navy-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 p-1.5 h-auto rounded-lg"
              onClick={() => setLocation('/authority/drafts')}
            >
              <ArrowIcon className="w-4 h-4" />
            </Button>
            <span className="text-xs font-bold text-navy-100 uppercase tracking-wider">
              {id ? (status === 'published' ? 'معاينة صفقة متاحة' : 'تعديل مسودة') : 'إنشاء مسودة صفقة جديدة'}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {id ? title || t('drafts.btn.edit') : t('drafts.new')}
          </h2>
          <p className="text-xs text-navy-100">
            {status === 'published'
              ? 'هذه الصفقة متاحة تجريبياً للمتعاملين؛ البيانات مجمّدة ولا يمكن تعديلها.'
              : 'أدخل البيانات الأولية للعملية. يمكنك تعديلها أو إرفاق دفتر الشروط قبل الإتاحة.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          {status === 'published' ? (
            <span className="text-xs bg-emerald-500/20 text-emerald-100 border border-emerald-400/30 px-3 py-1.5 rounded-xl font-bold">
              {t('authority.drafts.badge.published')}
            </span>
          ) : (
            id && (
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-2 shadow"
                onClick={handlePublish}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t('drafts.btn.publish')}</span>
              </Button>
            )
          )}
        </div>
      </section>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Panel */}
      <section className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy-900 block">
              {t('drafts.field.title')} <span className="text-destructive">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              maxLength={255}
              disabled={status === 'published'}
              placeholder="مثال: اقتناء تجهيزات مكتبية للإدارة المركزية"
              className="rounded-xl"
            />
            <span className="text-[11px] text-muted-foreground block">
              عنوان واضح وموجز لعملية الشراء (3 أحرف على الأقل).
            </span>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy-900 block">
              {t('drafts.field.desc')} <span className="text-destructive">*</span>
            </label>
            <textarea
              className="flex min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={5}
              maxLength={2000}
              rows={4}
              disabled={status === 'published'}
              placeholder="صف موضوع الصفقة وشروط التأهيل الأساسية..."
            />
            <span className="text-[11px] text-muted-foreground block">
              وصف تفصيلي لموضوع الحاجة والأهداف (5 أحرف على الأقل).
            </span>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-navy-900 block">
              {t('drafts.field.budget')}
            </label>
            <Input
              type="number"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              disabled={status === 'published'}
              placeholder="مثال: 1500000"
              className="rounded-xl font-mono"
            />
            <span className="text-[11px] text-muted-foreground block">
              الميزانية التقديرية بالدينار الجزائري (دج) — اختياري.
            </span>
          </div>

          {/* Document Section */}
          {id && (
            <div className="pt-4 pb-2 border-t border-border space-y-3">
              <label className="text-sm font-bold text-navy-900 block">
                {t('drafts.doc.upload')}
              </label>

              {status === 'published' ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/30 rounded-xl border border-border">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <span className="text-xs font-semibold block text-navy-900">
                        وثيقة دفتر الشروط
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {t('drafts.doc.frozen')}
                      </span>
                    </div>
                  </div>
                  {hasDoc && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs rounded-xl"
                      onClick={() => window.open(`/api/drafts/${id}/document`, '_blank')}
                    >
                      {t('drafts.doc.view')}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-navy-50 text-navy-900 rounded-xl">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-navy-900">
                          {hasDoc ? 'تحديث دفتر الشروط (PDF)' : 'رفع وثيقة دفتر الشروط (PDF)'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          صيغة PDF فقط، بحد أقصى 10 ميغابايت
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="application/pdf"
                        className="text-xs w-auto file:rounded-lg file:border-0 file:bg-navy-900 file:text-white file:text-xs file:font-semibold"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const formData = new FormData();
                          formData.append('document', file);

                          try {
                            const res = await fetch(`/api/drafts/${id}/document`, {
                              method: 'POST',
                              headers: {
                                'x-safaqat-csrf': '1',
                              },
                              body: formData,
                            });
                            if (!res.ok) {
                              const errData = await res.json().catch(() => ({}));
                              throw new Error(errData.error || 'Upload failed');
                            }
                            setHasDoc(true);
                            alert(t('drafts.doc.success'));
                          } catch (err: any) {
                            alert(err.message || t('drafts.doc.error'));
                          }
                        }}
                      />
                      {hasDoc && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs rounded-xl shrink-0"
                          onClick={() => window.open(`/api/drafts/${id}/document`, '_blank')}
                        >
                          <FileCheck className="w-3.5 h-3.5 me-1 text-emerald-600" />
                          <span>{t('drafts.doc.view')}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              className="text-xs rounded-xl"
              onClick={() => setLocation('/authority/drafts')}
            >
              {t('drafts.btn.cancel')}
            </Button>
            {status === 'draft' && (
              <Button
                type="submit"
                disabled={submitting}
                className="bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl px-5"
              >
                {submitting ? 'جاري الحفظ...' : t('drafts.btn.save')}
              </Button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
