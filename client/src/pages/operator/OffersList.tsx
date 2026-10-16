import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { FileText, ArrowLeft, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

interface OfferItem {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  authorityName: string;
  technicalProposal: string;
  financialOffer: string;
  deliveryTimeDays: string | null;
  hasDocument: boolean;
  status: 'draft' | 'submitted';
  submittedAt: string | null;
  updatedAt: string;
}

export function OffersList() {
  const { t, dir } = useI18n();
  const [, setLocation] = useLocation();
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/offers')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch offers');
        return res.json();
      })
      .then((data) => {
        if (data.offers) setOffers(data.offers);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const [tab, setTab] = useState<'list' | 'report' | 'team'>('list');
  const [docStatuses, setDocStatuses] = useState<Record<string, 'ok' | 'todo' | 'nc'>>({
    a1: 'ok',
    a2: 'ok',
    a3: 'ok',
    a4: 'ok',
    a5: 'todo',
    b1: 'ok',
    b2: 'todo',
    b3: 'ok',
    b4: 'nc',
    c1: 'todo',
    c2: 'todo',
    c3: 'todo',
  });

  const setStatus = (id: string, s: 'ok' | 'todo' | 'nc') => {
    setDocStatuses((prev) => ({ ...prev, [id]: s }));
  };

  const groupsDef = [
    {
      id: 'g1',
      title: 'ملف الترشح',
      items: [
        { id: 'a1', title: 'التصريح بالترشح' },
        { id: 'a2', title: 'التصريح بالنزاهة' },
        { id: 'a3', title: 'القانون الأساسي للمؤسسة' },
        { id: 'a4', title: 'السجل التجاري' },
        { id: 'a5', title: 'شهادة الوضعية الجبائية وشبه الجبائية' },
      ],
    },
    {
      id: 'g2',
      title: 'العرض التقني',
      items: [
        { id: 'b1', title: 'التصريح بالاكتتاب' },
        { id: 'b2', title: 'المذكرة التقنية التبريرية' },
        { id: 'b3', title: 'دفتر الشروط ممضى بعبارة «قرئ وقبل»' },
        { id: 'b4', title: 'كفالة التعهد (عند الاقتضاء)' },
      ],
    },
    {
      id: 'g3',
      title: 'العرض المالي',
      items: [
        { id: 'c1', title: 'رسالة التعهد' },
        { id: 'c2', title: 'جدول الأسعار بالوحدة' },
        { id: 'c3', title: 'التفصيل الكمي والتقديري' },
      ],
    },
  ];

  const allStatuses = Object.values(docStatuses);
  const totalDocs = 12;
  const okCount = allStatuses.filter((s) => s === 'ok').length;
  const ncCount = allStatuses.filter((s) => s === 'nc').length;
  const todoCount = allStatuses.filter((s) => s === 'todo').length;
  const readiness = Math.round((okCount / totalDocs) * 100) + '%';

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="font-sans flex flex-col gap-4">
      {/* 1. Page Head */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[26px] font-extrabold text-[#0B1F3A] leading-tight m-0">إعداد العرض</h1>
            <span className="inline-block px-2.5 py-0.5 rounded-full border border-[#EBDDB0] bg-[#FBF3DC] text-[#6B4F0E] text-[12px] font-bold">
              بيانات تجريبية
            </span>
          </div>
          <p className="text-[16px] leading-relaxed text-[#5B6B82] m-0">
            تحضير ملف المشاركة، ومتابعة جاهزية الوثائق، وتوزيع المهام على فريقك.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="deal-select">الصفقة</label>
          <select
            id="deal-select"
            className="h-[46px] w-[260px] max-w-full px-3 rounded-[10px] border-[1.5px] border-[#7C8AA3] bg-white text-[#0B1F3A] text-[16px] font-sans"
            defaultValue="demo"
          >
            <option value="">اختر الصفقة</option>
            <option value="demo">[رقم الإعلان] — [موضوع الصفقة]</option>
          </select>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 rounded-[10px] bg-[#047857] hover:bg-[#065F46] text-white text-[16px] font-bold transition-colors cursor-pointer border-0"
          >
            <FileText className="size-5 shrink-0" strokeWidth={1.8} />
            <span>حفظ التقدم</span>
          </button>
        </div>
      </div>

      {/* 2. Toolbar & KPIs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-1 p-1 rounded-[12px] bg-[#E3E9F2]" role="tablist" aria-label="أقسام إعداد العرض">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'list'}
            onClick={() => setTab('list')}
            className={`min-h-[44px] px-4 rounded-[9px] border-0 text-[16px] font-bold transition-colors cursor-pointer ${
              tab === 'list'
                ? 'bg-white text-[#0B1F3A] shadow-xs'
                : 'bg-transparent text-[#3B4C66] hover:bg-white/60'
            }`}
          >
            قائمة الوثائق
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'report'}
            onClick={() => setTab('report')}
            className={`min-h-[44px] px-4 rounded-[9px] border-0 text-[16px] font-bold transition-colors cursor-pointer ${
              tab === 'report'
                ? 'bg-white text-[#0B1F3A] shadow-xs'
                : 'bg-transparent text-[#3B4C66] hover:bg-white/60'
            }`}
          >
            التحليل والتقرير
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'team'}
            onClick={() => setTab('team')}
            className={`min-h-[44px] px-4 rounded-[9px] border-0 text-[16px] font-bold transition-colors cursor-pointer ${
              tab === 'team'
                ? 'bg-white text-[#0B1F3A] shadow-xs'
                : 'bg-transparent text-[#3B4C66] hover:bg-white/60'
            }`}
          >
            إدارة الفريق
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 min-h-[48px] px-3.5 rounded-[12px] bg-[#E8EFFA] text-[#14325C] border border-[#CFDCF0]">
            <span className="text-[22px] font-extrabold leading-none">{readiness}</span>
            <span className="text-[13px] font-bold">نسبة الجاهزية</span>
          </div>
          <div className="inline-flex items-center gap-2 min-h-[48px] px-3.5 rounded-[12px] bg-white text-[#0B1F3A] border border-[#D5DDEA]">
            <span className="text-[22px] font-extrabold leading-none">{totalDocs}</span>
            <span className="text-[13px] font-bold">الوثائق المطلوبة</span>
          </div>
          <div className="inline-flex items-center gap-2 min-h-[48px] px-3.5 rounded-[12px] bg-[#FCEBEA] text-[#B42318] border border-[#F4C9C5]">
            <span className="text-[22px] font-extrabold leading-none">{ncCount}</span>
            <span className="text-[13px] font-bold">وثائق ناقصة</span>
          </div>
          <div className="inline-flex items-center gap-2 min-h-[48px] px-3.5 rounded-[12px] bg-[#FBF3DC] text-[#6B4F0E] border border-[#EBDDB0]">
            <span className="text-[22px] font-extrabold leading-none">{todoCount}</span>
            <span className="text-[13px] font-bold">قيد الإنجاز</span>
          </div>
        </div>
      </div>

      {/* 3. Tab Contents */}
      {tab === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {groupsDef.map((group, gi) => {
            const groupItems = group.items;
            const okInGroup = groupItems.filter((it) => (docStatuses[it.id] || 'todo') === 'ok').length;

            return (
              <section key={group.id} className="bg-white border border-[#D5DDEA] rounded-[16px] overflow-hidden shadow-xs" aria-label={group.title}>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#F7F9FC] border-b border-[#E3E9F2]">
                  <h2 className="text-[16.5px] font-extrabold m-0 text-[#0B1F3A]">{group.title}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EEF3FA] text-[#14325C] text-[12px] font-bold">
                    {groupItems.length} وثائق
                  </span>
                  <span className="ms-auto text-[12.5px] font-semibold text-[#5B6B82]">
                    {okInGroup} من {groupItems.length} مكتملة
                  </span>
                </div>
                <div>
                  {groupItems.map((item, ii) => {
                    const st = docStatuses[item.id] || 'todo';
                    const ref = `${gi + 1}.${ii + 1}`;

                    return (
                      <div key={item.id} className="flex flex-col gap-1.5 p-3 px-3.5 border-b border-[#EEF2F7] last:border-b-0">
                        <div className="flex items-start gap-2.5">
                          <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-[#EEF3FA] text-[#14325C] font-mono text-[12px] font-bold mt-0.5">
                            {ref}
                          </span>
                          <span className="text-[16px] font-bold leading-normal text-[#0B1F3A]">
                            {item.title}
                          </span>
                        </div>
                        <div className="flex gap-1 p-0.5 rounded-[12px] bg-[#F1F4F9]" role="group" aria-label={`حالة الوثيقة: ${item.title}`}>
                          <button
                            type="button"
                            aria-pressed={st === 'ok'}
                            onClick={() => setStatus(item.id, 'ok')}
                            className={`flex-1 min-h-[36px] px-2 border-0 rounded-[9px] text-[13px] font-bold cursor-pointer transition-colors ${
                              st === 'ok'
                                ? 'bg-[#047857] text-white shadow-xs'
                                : 'bg-transparent text-[#14325C] hover:bg-[#E3E9F2]'
                            }`}
                          >
                            مكتمل
                          </button>
                          <button
                            type="button"
                            aria-pressed={st === 'todo'}
                            onClick={() => setStatus(item.id, 'todo')}
                            className={`flex-1 min-h-[36px] px-2 border-0 rounded-[9px] text-[13px] font-bold cursor-pointer transition-colors ${
                              st === 'todo'
                                ? 'bg-[#F5EBCF] text-[#5C430C] shadow-xs'
                                : 'bg-transparent text-[#14325C] hover:bg-[#E3E9F2]'
                            }`}
                          >
                            قيد الإنجاز
                          </button>
                          <button
                            type="button"
                            aria-pressed={st === 'nc'}
                            onClick={() => setStatus(item.id, 'nc')}
                            className={`flex-1 min-h-[36px] px-2 border-0 rounded-[9px] text-[13px] font-bold cursor-pointer transition-colors ${
                              st === 'nc'
                                ? 'bg-[#B42318] text-white shadow-xs'
                                : 'bg-transparent text-[#14325C] hover:bg-[#E3E9F2]'
                            }`}
                          >
                            ناقص
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {tab === 'report' && (
        <div className="flex flex-col items-center justify-center text-center gap-2 p-10 border-[1.5px] border-dashed border-[#AEB9CB] rounded-[16px] bg-white min-h-[220px]">
          <div className="size-[52px] rounded-full bg-[#E8EFFA] text-[#14325C] flex items-center justify-center shrink-0">
            <FileText className="size-[26px]" strokeWidth={1.8} />
          </div>
          <h3 className="text-[17px] font-extrabold text-[#0B1F3A] mt-1 m-0">لا يوجد تقرير بعد</h3>
          <p className="text-[16px] leading-relaxed text-[#5B6B82] max-w-[460px] m-0">
            سيظهر هنا تحليل جاهزية العرض وتقرير الوثائق الناقصة بعد اختيار الصفقة واستكمال قائمة الوثائق.
          </p>
        </div>
      )}

      {tab === 'team' && (
        <div className="flex flex-col items-center justify-center text-center gap-2 p-10 border-[1.5px] border-dashed border-[#AEB9CB] rounded-[16px] bg-white min-h-[220px]">
          <div className="size-[52px] rounded-full bg-[#E8EFFA] text-[#14325C] flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-[26px]" strokeWidth={1.8} />
          </div>
          <h3 className="text-[17px] font-extrabold text-[#0B1F3A] mt-1 m-0">لم تُضَف أي أعضاء بعد</h3>
          <p className="text-[16px] leading-relaxed text-[#5B6B82] max-w-[460px] m-0">
            أضف أعضاء فريقك لتوزيع إعداد وثائق العرض بينهم وتحديد من يراجع كل ظرف قبل الإيداع.
          </p>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-[10px] bg-[#047857] hover:bg-[#065F46] text-white text-[16px] font-bold cursor-pointer border-0 mt-2"
          >
            إضافة عضو
          </button>
        </div>
      )}

      {/* 4. Live Offers Database Listing */}
      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 mt-2">
        <div className="pb-3 border-b border-border">
          <h3 className="text-lg font-bold text-navy-900">{t('offers.title')}</h3>
          <p className="text-xs text-muted-foreground">قائمة العروض والملفات المرتبطة بها في المنصة.</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            ...
          </div>
        ) : offers.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-10 text-center bg-muted/20 space-y-3">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-bold text-navy-900">{t('offers.empty')}</p>
            <Button
              variant="outline"
              className="text-xs font-bold"
              onClick={() => setLocation('/operator/deals')}
            >
              {t('opps.title')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {offers.map((offer) => (
              <article
                key={offer.id}
                className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-navy-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-bold text-navy-900">{offer.opportunityTitle}</h4>
                    {offer.status === 'submitted' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t('offers.status.submitted')}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-gold-50 text-gold-900 border border-gold-200 font-bold px-2.5 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        <span>{t('offers.status.draft')}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="font-semibold text-emerald-800 bg-emerald-50/70 border border-emerald-100 px-2.5 py-0.5 rounded-md text-[11px]">
                      {offer.authorityName}
                    </span>
                    <span>
                      <strong className="text-foreground font-semibold">{t('offers.field.financial')}:</strong>{' '}
                      <span className="font-mono text-navy-900">{offer.financialOffer} د.ج</span>
                    </span>
                    {offer.deliveryTimeDays && (
                      <span>
                        ({offer.deliveryTimeDays} {t('offers.field.delivery')})
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    {offer.status === 'submitted' && offer.submittedAt
                      ? `${t('offers.status.submitted')}: ${new Date(offer.submittedAt).toLocaleDateString()}`
                      : `آخر تعديل: ${new Date(offer.updatedAt).toLocaleDateString()}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <Button
                    className={`text-xs font-bold px-4 py-2 rounded-xl ${
                      offer.status === 'draft'
                        ? 'bg-navy-900 hover:bg-navy-700 text-white'
                        : 'border border-border bg-card hover:bg-muted text-foreground'
                    }`}
                    onClick={() => setLocation(`/operator/offers/${offer.id}`)}
                  >
                    {offer.status === 'draft' ? t('offers.edit') : t('offers.view')}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
