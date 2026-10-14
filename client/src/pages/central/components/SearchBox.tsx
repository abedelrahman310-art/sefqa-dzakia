import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { WilayaDetail } from './WilayaDetailCard';

export interface SearchBoxProps {
  value: string;
  onChange: (val: string) => void;
  results?: WilayaDetail[];
  onSelect?: (wilaya: WilayaDetail) => void;
  compact?: boolean;
  placeholder?: string;
}

export function SearchBox({
  value,
  onChange,
  results = [],
  onSelect,
  compact = true,
  placeholder = 'ابحث عن ولاية...',
}: SearchBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={`
            ${compact ? 'w-[240px] sm:w-[280px]' : 'w-full'}
            h-11 ps-10 pe-9
            bg-white/95 backdrop-blur-md
            border border-[var(--color-border-subtle)]
            rounded-xl shadow-lg
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
            aria-label="مسح البحث"
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
              className="w-full text-start px-3.5 py-2.5 text-xs hover:bg-[var(--paper-100)] flex items-center justify-between transition-colors border-b last:border-b-0 border-[var(--color-border-subtle)]/50"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[var(--stamp-green-700)] text-[11px] bg-[var(--paper-100)] px-1.5 py-0.5 rounded">
                  {w.code}
                </span>
                <span className="font-bold text-[var(--ink-900)]">{w.name}</span>
                {w.nameFr && (
                  <span className="text-[10px] text-[var(--ink-500)]">({w.nameFr})</span>
                )}
              </div>
              <span className="font-mono text-[11px] font-semibold text-[var(--ink-700)]">
                {w.tenders_count} صفقة
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBox;
