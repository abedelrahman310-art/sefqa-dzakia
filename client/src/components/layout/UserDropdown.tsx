import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/i18n';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';

export function UserDropdown() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName = user.displayName || user.organizationName || user.email;
  const initials = displayName.trim().slice(0, 2).toUpperCase();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'central_admin':
        return 'الرقابة المركزية';
      case 'authority':
        return 'مصلحة متعاقدة';
      case 'operator':
        return 'متعامل اقتصادي';
      default:
        return role;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-9 px-2.5 rounded-xl border border-border hover:bg-muted text-foreground text-xs font-medium transition-colors"
        aria-expanded={isOpen}
      >
        <div className="w-6 h-6 rounded-lg bg-navy-900 text-gold-400 font-bold flex items-center justify-center text-[10px] shrink-0">
          {initials || <UserIcon className="w-3.5 h-3.5" />}
        </div>
        <span className="hidden lg:inline-block max-w-[120px] truncate text-navy-900 font-bold">
          {displayName}
        </span>
        <span className="text-[10px] text-muted-foreground">▾</span>
      </button>

      {isOpen && (
        <div className="absolute end-0 top-full mt-1.5 w-52 bg-card border border-border rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-start">
          <div className="px-3 py-2 border-b border-border text-xs space-y-0.5">
            <div className="text-[10px] font-semibold text-primary flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>{getRoleLabel(user.role)}</span>
            </div>
            <div className="font-bold truncate text-foreground text-sm">{displayName}</div>
            <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="w-full text-start px-3 py-2 text-xs text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
