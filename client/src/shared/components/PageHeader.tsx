import React from 'react';

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** تخصيص حجم/وزن عنوان الصفحة (افتراضياً heading-h1) */
  titleClassName?: string;
}

export function PageHeader({ eyebrow, title, description, actions, titleClassName = '' }: PageHeaderProps) {
  return (
    <div className="mb-8">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className={`heading-h1 mb-3 ${titleClassName}`}>{title}</h1>
          {description && (
            <p className="text-body-lg text-[var(--color-text-secondary)] max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;
