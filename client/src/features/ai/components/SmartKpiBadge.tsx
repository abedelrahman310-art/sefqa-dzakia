import React from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';
import type { SmartAlertItem } from '../types';

interface SmartKpiBadgeProps {
  alert?: 'critical' | 'high' | 'medium' | 'low';
  value?: number;
  message?: string;
  className?: string;
}

export function SmartKpiBadge({
  alert = 'low',
  value,
  message,
  className = '',
}: SmartKpiBadgeProps) {
  // If no value or zero and no message, return null
  if (value === undefined && !message) return null;

  const colorStyles = {
    critical: 'bg-rose-50 text-rose-800 border-rose-300 font-bold',
    high: 'bg-orange-50 text-orange-800 border-orange-300 font-bold',
    medium: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
    low: 'bg-blue-50 text-blue-800 border-blue-300 font-semibold',
  }[alert];

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border shadow-2xs ${colorStyles} ${className}`}
      title={`رصد ذكي (استشاري): ${message || ''}`}
    >
      <Sparkles className="w-2.5 h-2.5 shrink-0" />
      <span>{message ? message : `${value ?? ''} رصد AI`}</span>
    </div>
  );
}
