import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Lock, AlertTriangle, Building, Calendar, DollarSign, FileText } from 'lucide-react';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  estimatedBudget: string | null;
  authorityName: string;
  updatedAt: string;
  hasDocument: boolean;
}

export function OpportunityDetails() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t, dir } = useI18n();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [existingOfferId, setExistingOfferId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/opportunities/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        if (data.opportunity) setOpp(data.opportunity);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    // Check if operator already submitted/drafted an offer for this opportunity
    fetch('/api/offers')
      .then((res) => res.json())
      .then((data) => {
        const found = data.offers?.find((o: any) => o.opportunityId === id);
        if (found) setExistingOfferId(found.id);
      })
      .catch(() => {});
  }, [id]);

  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">...</div>;
  }

  if (error || !opp) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-xl text-sm font-medium">
          الفرصة غير متوفرة أو تم سحبها.
        </div>
        <Button variant="outline" onClick={() => setLocation('/operator/deals')}>
          <ArrowIcon className="w-4 h-4 me-2" />
          <span>العودة للصفقات</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="border-border hover:bg-muted text-xs font-bold gap-2"
          onClick={() => setLocation('/operator/deals')}
        >
          <ArrowIcon className="w-4 h-4" />
          <span>العودة لقائمة الصفقات</span>
        </Button>
      </div>

      {/* Hero section for Opportunity Details */}
      <section className="rounded-2xl p-6 md:p-8 text-white bg-gradient-to-r from-navy-900 to-navy-700 shadow-sm space-y-3">
        <div className="inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-3 py-1 rounded-full">
          {opp.authorityName}
        </div>
        <h2 className="text-xl md:text-2xl font-extrabold text-white leading-snug">
          {opp.title}
        </h2>
        <p className="text-xs text-navy-100 flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>تاريخ التحديث: {new Date(opp.updatedAt).toLocaleDateString()}</span>
        </p>
      </section>

      {/* Main Details Panel */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        {/* Description Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span>تفاصيل وموضوع الصفقة</span>
          </h3>
          <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-xl border border-border leading-relaxed">
            {opp.description}
          </p>
        </div>

        {/* Specifications Grid */}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-muted/20 border border-border rounded-xl p-3.5 space-y-1">
            <dt className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>المصلحة المتعاقدة</span>
            </dt>
            <dd className="text-sm font-bold text-navy-900">{opp.authorityName}</dd>
          </div>

          <div className="bg-muted/20 border border-border rounded-xl p-3.5 space-y-1">
            <dt className="text-xs text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{t('opps.budget')}</span>
            </dt>
            <dd className="text-sm font-bold text-navy-900 font-mono">
              {opp.estimatedBudget ? `${opp.estimatedBudget} د.ج` : 'غير محدد'}
            </dd>
          </div>
        </dl>

        {/* Mandatory Security Notice regarding Document Download */}
        <div className="border border-amber-200 bg-amber-50 text-amber-900 rounded-xl p-4 flex items-start gap-3 text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-none mt-0.5" />
          <div className="space-y-1">
            <strong className="block text-sm font-bold text-amber-900">
              تنبيه تنزيل وثائق دفتر الشروط:
            </strong>
            <p className="text-amber-800">
              {t('doc.download_suspended')}. وفقاً للقواعد المعتمدة، لا يُتاح تنزيل دفتر الشروط للمتعاملين إلا بعد إتمام والتحقق من عملية الدفع خادمياً.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex gap-3">
            {/* Download Button: Explicitly Disabled with Security Notice */}
            <Button
              variant="outline"
              disabled
              title={t('doc.download_suspended')}
              className="border-border bg-muted/50 text-muted-foreground text-xs font-semibold cursor-not-allowed opacity-80 flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{t('doc.download_suspended')}</span>
            </Button>
          </div>

          <div>
            {existingOfferId ? (
              <Button
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm"
                onClick={() => setLocation(`/operator/offers/${existingOfferId}`)}
              >
                {t('opps.btn.view_offer')}
              </Button>
            ) : (
              <Button
                className="w-full sm:w-auto bg-navy-900 hover:bg-navy-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm"
                onClick={() => setLocation(`/operator/opportunities/${id}/offer`)}
              >
                {t('opps.btn.make_offer')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
