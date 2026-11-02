import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import {
  ShieldAlert,
  Clock,
  Sparkles,
  Scale,
  FileCheck2,
  FileSpreadsheet,
  Download,
  Building,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AntiCollusionRadar } from '@/features/governance/AntiCollusionRadar';
import { ProjectDelayPredictor } from '@/features/governance/ProjectDelayPredictor';

export function CentralIntegrityView() {
  const { dir } = useI18n();
  const [activeTab, setActiveTab] = useState<'anti_collusion' | 'delay_predictor'>('anti_collusion');
  const [exporting, setExporting] = useState(false);

  const handleExportAuditDossier = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      window.print();
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir={dir}>
      {/* الترويسة السيادية الوطنية للإدارة المركزية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
              الجمهورية الجزائرية الديمقراطية الشعبية · المفتشية العامة للصفقات العمومية
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-navy-950 flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-primary" />
            <span>منظومة الرقابة المركزية والنزاهة المؤسسية بالذكاء الاصطناعي</span>
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            المنصة الرقابية العليا (عين الصقر) لكشف محاولات التواطؤ، تدوير العطاءات، تجزئة الحاجات، والتنبؤ المبكر بتعثر وتوقف المشاريع العمومية وفق القانون رقم 23-12 والمرسوم الرئاسي 15-247.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAuditDossier}
            disabled={exporting}
            className="text-xs rounded-xl font-bold border-border shadow-sm gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'جاري استخراج الملف...' : 'استخراج تقرير تدقيق معتمد'}</span>
          </Button>
        </div>
      </div>

      {/* شريط التبويب الرئيسي */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('anti_collusion')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'anti_collusion'
              ? 'bg-navy-950 text-white shadow-md'
              : 'bg-card text-muted-foreground hover:bg-muted/80 hover:text-navy-950 border border-border/80'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>رادار كشف التواطؤ والتلاعب في الأسعار (Anti-Collusion & Integrity)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('delay_predictor')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === 'delay_predictor'
              ? 'bg-navy-950 text-white shadow-md'
              : 'bg-card text-muted-foreground hover:bg-muted/80 hover:text-navy-950 border border-border/80'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>مؤشر التنبؤ المبكر بتعثر المشاريع (Project Delay Forecast)</span>
        </button>
      </div>

      {/* المحتوى الفعلي حسب التبويب */}
      <div>
        {activeTab === 'anti_collusion' ? (
          <AntiCollusionRadar />
        ) : (
          <ProjectDelayPredictor />
        )}
      </div>
    </div>
  );
}

export default CentralIntegrityView;
