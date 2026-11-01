import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { WilayaDetail } from './WilayaDetailCard';
import { useI18n } from '@/i18n';

export interface SearchBoxProps {
  value: string;
  onChange: (val: string) => void;
  results?: WilayaDetail[];
  onSelect?: (wilaya: WilayaDetail) => void;
  placeholder?: string;
}

export function SearchBox({
  value,
  onChange,
  results = [],
  onSelect,
  placeholder,
}: SearchBoxProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const resolvedPlaceholder = placeholder ?? t('central.map_view.search_placeholder');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasResults = results.length > 0 && value.trim().length > 0;

  return (
    <div ref={containerRef} className="relative z-30">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-[var(--ink-500)] pointer-events-none" />
        <input
          type="text"
          placeholder={resolvedPlaceholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={`
            w-full
            h-10 ps-10 pe-9
            bg-white
            border border-gray-200
            rounded-full shadow-sm
            text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-400)]
            focus:outline-none focus:ring-2 focus:ring-[var(--stamp-green-700)]/20
            focus:border-[var(--stamp-green-700)]
            transition-all
          `}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)] hover:text-[var(--ink-700)] p-0.5"
            aria-label={t('central.ui.clear_search')}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {isOpen && hasResults && (
        <div className="absolute top-12 start-0 end-0 bg-white/95 backdrop-blur-md rounded-xl border border-[var(--color-border-subtle)] shadow-2xl overflow-hidden py-1 max-h-64 overflow-y-auto z-40">
          {results.map((w) => (
            <button
              key={w.code}
              type="button"
              onClick={() => {
                onSelect?.(w);
                setIsOpen(false);
                onChange('');
              }}
              className="w-full text-start px-3.5 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between gap-2 transition-colors border-b last:border-b-0 border-gray-100"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-mono font-bold text-[var(--stamp-green-700)] text-xs bg-gray-50 px-1.5 py-0.5 rounded">
                  {w.code}
                </span>
                <span className="truncate font-bold text-[var(--ink-900)]">{w.name}</span>
                {w.nameFr && (
                  <span className="truncate text-xs text-[var(--ink-500)]">({w.nameFr})</span>
                )}
              </div>
              <span className="shrink-0 font-mono text-xs font-semibold text-[var(--ink-700)]">
                {t('central.ui.deals_count', { count: w.tenders_count })}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBox;
