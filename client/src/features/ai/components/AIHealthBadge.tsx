import React from 'react';
import { useAIHealth } from '../hooks/useAI';
import { Bot, CheckCircle2, AlertCircle } from 'lucide-react';

interface AIHealthBadgeProps {
  className?: string;
  compact?: boolean;
}

export function AIHealthBadge({ className = '', compact = false }: AIHealthBadgeProps) {
  const { data: health, isLoading } = useAIHealth();

  if (isLoading) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/60 text-muted-foreground text-xs animate-pulse ${className}`}
      >
        <Bot className="w-3.5 h-3.5" />
        <span>فحص الذكاء الاصطناعي...</span>
      </div>
    );
  }

  const isAvailable = health?.is_available ?? false;
  const provider = health?.provider?.replace('Fallback', '') || 'RuleBased';

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
          isAvailable
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        } ${className}`}
        title={`محرك AI: ${provider} (${isAvailable ? 'متصل' : 'غير متصل'})`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
          }`}
        />
        <span>AI: {provider}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card text-xs shadow-xs ${
        isAvailable ? 'border-emerald-200/80' : 'border-rose-200/80'
      } ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <Bot className="w-4 h-4 text-navy-800" />
        <span className="font-bold text-navy-900">AI: {provider}</span>
      </div>
      <div className="h-3 w-px bg-border mx-0.5" />
      <div className="flex items-center gap-1">
        <span
          className={`w-2 h-2 rounded-full ${
            isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
          }`}
        />
        <span
          className={`text-[11px] font-semibold ${
            isAvailable ? 'text-emerald-800' : 'text-rose-800'
          }`}
        >
          {isAvailable ? 'متصل' : 'غير متصل'}
        </span>
      </div>
    </div>
  );
}
