import React from 'react';

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** تخصيص حجم/وزن عنوان الصفحة (افتراضياً text-xl font-black) */
  titleClassName?: string;
  descriptionClassName?: string;
}

export function PageHeader({ eyebrow, title, description, actions, titleClassName = '', descriptionClassName = '' }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className={`text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1.5 ${titleClassName}`}>{title}</h1>
          {description && (
            <p className={`text-xs sm:text-sm text-slate-500 leading-relaxed max-w-3xl ${descriptionClassName}`}>
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;
