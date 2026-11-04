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
  const { t, dir } = useI18n();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-emerald-600" />
            <span>{t('central.integrity.title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-3xl">
            {t('central.integrity.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAuditDossier}
            disabled={exporting}
            className="text-xs rounded-xl font-bold border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs gap-2 h-9"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? t('central.integrity.exporting') : t('central.integrity.export')}</span>
          </Button>
        </div>
      </div>

      {/* شريط التبويب الرئيسي */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('anti_collusion')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'anti_collusion'
              ? 'bg-emerald-700 text-white shadow-xs border border-emerald-800'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span>{t('central.integrity.tab_anti_collusion')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('delay_predictor')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'delay_predictor'
              ? 'bg-emerald-700 text-white shadow-xs border border-emerald-800'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>{t('central.integrity.tab_delay')}</span>
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
