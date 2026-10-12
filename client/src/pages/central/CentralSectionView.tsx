import { ReactNode } from 'react';
import { useI18n } from '@/i18n';
import { TranslationKey } from '@/i18n/ar';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';

interface CentralSectionViewProps {
  titleKey: TranslationKey;
  descKey: TranslationKey;
  icon?: ReactNode;
}

export function CentralSectionView({ titleKey, descKey, icon }: CentralSectionViewProps) {
  const { t, dir } = useI18n();
  const [, setLocation] = useLocation();

  const ArrowIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6">
      <section className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-3 bg-navy-50 text-navy-900 rounded-xl border border-navy-100 shrink-0">
                {icon}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-navy-900">
                  {t(titleKey)}
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border">
                  {t('badge.unavailable')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t(descKey)}
              </p>
            </div>
          </div>

          <Button
            className="bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 self-end sm:self-auto shadow-sm"
            onClick={() => setLocation('/central')}
          >
            <ArrowIcon className="w-3.5 h-3.5" />
            <span>لوحة القيادة الوطنية</span>
          </Button>
        </div>

        {/* Informative Under-Development Panel */}
        <div className="border border-dashed border-border rounded-2xl p-8 md:p-12 text-center space-y-4 bg-muted/10">
          <div className="w-12 h-12 rounded-2xl bg-navy-50 text-navy-800 flex items-center justify-center mx-auto border border-navy-100 shadow-xs">
            <Clock className="w-6 h-6 text-navy-700" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-navy-900">
              {t('central.section.under_development')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              تخضع هذه الوظيفة للإشراف المركزي للتخطيط والتفعيل في دفعات المنصة القادمة عند اكتمال قنوات البيانات الموثوقة مع المصالح والمتعاملين.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
