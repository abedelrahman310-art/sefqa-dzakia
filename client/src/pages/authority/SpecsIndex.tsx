import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, Scale } from 'lucide-react';

interface Draft {
  id: string;
  title: string;
  description: string;
  status: string;
  updatedAt: string;
}

export function SpecsIndex() {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/drafts')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch drafts');
        return res.json();
      })
      .then((data) => {
        if (data.drafts) setDrafts(data.drafts);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl p-6 md:p-8 text-white bg-gradient-to-r from-navy-900 to-navy-700 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <span className="text-xs font-bold text-navy-100 uppercase tracking-wider">
            سند — سلسلة الإسناد الحيّة
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            {t('specs.index.title')}
          </h2>
          <p className="text-sm text-navy-100 leading-relaxed">
            {t('specs.index.desc')}
          </p>
        </div>
      </section>

      <section className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
          <Scale className="w-4 h-4 text-navy-700" />
          <span>{t('specs.index.select_draft')}</span>
        </h3>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">جاري التحميل...</span>
          </div>
        ) : drafts.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-10 text-center space-y-3 bg-muted/20">
            <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-xs text-muted-foreground">
              لا توجد مسودات صفقات حالياً. أنشئ مسودة أولاً من قسم المسودات.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="p-4 bg-background border border-border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 transition-colors shadow-sm cursor-pointer"
                onClick={() => setLocation(`/authority/drafts/${draft.id}/specs`)}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-navy-900">{draft.title}</h4>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        draft.status === 'published'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-navy-50 text-navy-800 border-navy-200'
                      }`}
                    >
                      {draft.status === 'published' ? 'منشورة' : 'مسودة'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {draft.description || 'بدون وصف'}
                  </p>
                </div>

                <Button
                  size="sm"
                  className="bg-navy-900 hover:bg-navy-800 text-white text-xs rounded-xl px-4 py-1.5 shadow-sm flex items-center gap-1.5 self-end md:self-center shrink-0"
                >
                  <span>{t('specs.view_specs')}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
