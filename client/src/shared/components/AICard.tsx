import React from 'react';
import { Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n';

export interface AICardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function AICard({ title, subtitle, children, actions }: AICardProps) {
  const { t } = useI18n();
  return (
    <div className="ai-card">
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="size-4 text-[var(--ai-text)] ai-sparkle" />
            <h3 className="text-h3 font-bold text-[var(--color-text-primary)]">{title}</h3>
            <span className="ai-badge">🤖 AI</span>
          </div>
          {subtitle && (
            <p className="text-body-sm text-[var(--color-text-muted)]">{subtitle}</p>
          )}
        </div>
        <span className="badge badge-amber inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold">
          ⚠️ {t('ai.advisory_badge')}
        </span>
      </div>
      <div className="relative z-10">{children}</div>
      {actions && <div className="mt-4 relative z-10">{actions}</div>}
    </div>
  );
}

export default AICard;
