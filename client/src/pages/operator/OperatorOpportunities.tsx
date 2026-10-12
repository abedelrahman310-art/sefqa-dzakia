import { useEffect, useState, useMemo } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileText, Lock, Sparkles, UserCheck } from 'lucide-react';
import { SuitabilityModal } from './SuitabilityModal';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  estimatedBudget: string | null;
  authorityName: string;
  status: string;
  submissionDeadline?: string | null;
  hasDocument: boolean;
  matching?: {
    isClassified: boolean;
    overallSignal: 'relevant' | 'partial' | 'neutral' | 'unclassified';
  };
}

export function OperatorOpportunities() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [profileConfigured, setProfileConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuitabilityId, setSelectedSuitabilityId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/operator/opportunities/matched')
      .then((res) => res.json())
      .then((data) => {
        if (data.opportunities) {
          setOpportunities(data.opportunities);
        }
        if (typeof data.operatorProfileConfigured === 'boolean') {
          setProfileConfigured(data.operatorProfileConfigured);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredOpportunities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return opportunities;
    return opportunities.filter(
      (opp) =>
        opp.title.toLowerCase().includes(q) ||
        opp.authorityName.toLowerCase().includes(q) ||
        opp.description.toLowerCase().includes(q)
    );
  }, [opportunities, searchQuery]);

  const renderSignalPill = (signal?: string) => {
    switch (signal) {
      case 'relevant':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
            {t('operator.suitability.signal_relevant')}
          </span>
        );
      case 'partial':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
            {t('operator.suitability.signal_partial')}
          </span>
        );
      case 'unclassified':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
            {t('operator.suitability.signal_unclassified')}
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
            {t('operator.suitability.signal_neutral')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Streamlined */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-1.5">
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-navy-50 text-navy-800 border border-navy-100 inline-block">
          {t('topbar.brand_sub')}
        </span>
        <h2 className="text-2xl font-extrabold text-navy-900">
          {t('opps.title')}
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground max-w-2xl leading-relaxed">
          {t('topbar.brand_desc')}
        </p>
      </section>

      {/* Profile Setup Reminder Banner */}
      {!profileConfigured && (
        <div className="bg-muted/40 border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-primary flex-none" />
            <div>
              <strong className="block text-navy-900 font-bold">
                خصص ملف نشاطك وشهاداتك المصرح بها للحصول على مطابقة دقيقة:
              </strong>
              <p className="text-muted-foreground text-xs">
                أدخل قطاعك الرئيسي وولايتك ورموز الأنشطة التجارية لتسهيل فرز ومطابقة الفرص.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setLocation('/operator/profile')}
            className="bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl flex-none"
          >
            إعداد ملف النشاط
          </Button>
        </div>
      )}

      {/* Main Panel with Search and Listing */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-navy-900">{t('toolbar.pill_deals')}</h3>
            <p className="text-xs text-muted-foreground">{t('overview.discovery.desc')}</p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('deals.search.placeholder')}
              className="ps-9 text-xs h-10 rounded-xl border-border bg-background"
            />
          </div>
        </div>

        {/* Opportunities List */}
        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-xs">
            جاري استرجاع الصفقات والمطابقة الأولية...
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-10 text-center bg-muted/20 space-y-3">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
            <h4 className="text-sm font-bold text-navy-900">
              {searchQuery ? t('deals.search.empty_title') : t('opps.empty')}
            </h4>
            <p className="text-xs text-muted-foreground">
              {searchQuery ? t('deals.search.empty_desc') : ''}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs rounded-xl"
                onClick={() => setSearchQuery('')}
              >
                إلغاء التصفية
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredOpportunities.map((opp) => (
              <article
                key={opp.id}
                className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-navy-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100"
                      title={opp.authorityName}
                    >
                      {opp.authorityName}
                    </span>
                    {opp.status === 'submission_closed' ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                        أجل الإيداع منتهٍ
                      </span>
                    ) : (
                      renderSignalPill(opp.matching?.overallSignal)
                    )}
                  </div>
                  <h4 className="text-base font-bold text-navy-900 line-clamp-1" title={opp.title}>{opp.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {opp.description}
                  </p>
                  {opp.estimatedBudget && (
                    <div className="text-xs text-muted-foreground">
                      <strong className="text-navy-900 font-semibold">{t('opps.budget')}:</strong>{' '}
                      <span className="font-mono font-semibold text-navy-900">{Number(opp.estimatedBudget).toLocaleString()} د.ج</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end self-stretch sm:self-center shrink-0 pt-2 sm:pt-0">
                  {/* Suitability Explain Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold gap-1.5 border-emerald-200 text-emerald-800 hover:bg-emerald-50 rounded-xl"
                    onClick={() => setSelectedSuitabilityId(opp.id)}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t('operator.suitability.view_btn')}</span>
                  </Button>

                  <Button
                    size="sm"
                    className="text-xs font-bold px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-xl shadow-sm"
                    onClick={() => setLocation(`/operator/opportunities/${opp.id}`)}
                  >
                    {t('opps.details')}
                  </Button>

                  {/* Document Download: Disabled with clear notice as required */}
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled
                    title={t('doc.download_suspended')}
                    className="text-xs font-medium px-3 py-2 bg-muted text-muted-foreground cursor-not-allowed opacity-80 flex items-center gap-1.5 rounded-xl"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{t('doc.download_suspended_short')}</span>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Suitability Modal */}
      <SuitabilityModal
        opportunityId={selectedSuitabilityId}
        onClose={() => setSelectedSuitabilityId(null)}
      />
    </div>
  );
}
