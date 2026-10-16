import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon | React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`py-12 px-4 text-center space-y-3 ${className}`}>
      {Icon && (
        <Icon
          className="w-10 h-10 text-[var(--ink-300)] mx-auto"
          aria-hidden="true"
        />
      )}
      <h3 className="text-sm font-bold text-[var(--ink-900)]">{title}</h3>
      {description && (
        <p className="text-xs text-[var(--ink-500)] max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export default EmptyState;
