import React from 'react';
import { User, Landmark, Shield } from 'lucide-react';
import { useLocation } from 'wouter';
import { useI18n } from '@/i18n';

export type RegisterRole = 'operator' | 'authority' | 'central';

interface RegisterRoleTabsProps {
  activeRole: RegisterRole;
  onSelectRole?: (role: RegisterRole) => void;
}

export function RegisterRoleTabs({ activeRole, onSelectRole }: RegisterRoleTabsProps) {
  const [, setLocation] = useLocation();
  const { t } = useI18n();

  const handleTabClick = (role: RegisterRole) => {
    if (onSelectRole) {
      onSelectRole(role);
      return;
    }
    if (role === 'operator') {
      setLocation('/register/operator');
    } else if (role === 'authority') {
      setLocation('/register/authority');
    }
  };

  const tabs: Array<{ role: RegisterRole; label: string; icon: React.ElementType }> = [
    { role: 'operator', label: t('login.demo_operator'), icon: User },
    { role: 'authority', label: t('login.demo_authority'), icon: Landmark },
    { role: 'central', label: t('login.demo_central'), icon: Shield },
  ];

  return (
    <div
      className="flex items-center justify-between w-full bg-[#f1f5f9] p-1.5 rounded-2xl select-none"
      role="tablist"
      aria-label={t('register.roles_tablist')}
    >
      {tabs.map((tab, idx) => {
        const Icon = tab.icon;
        const isActive = activeRole === tab.role;

        return (
          <React.Fragment key={tab.role}>
            {idx > 0 && !isActive && activeRole !== tabs[idx - 1].role && (
              <div className="w-[1px] h-8 bg-[#cbd5e1]/60 shrink-0 mx-0.5" />
            )}
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabClick(tab.role)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-xl transition-all duration-150 cursor-pointer text-center ${
                isActive
                  ? 'bg-[#0A2540] text-white shadow-xs font-bold'
                  : 'text-[#475569] hover:text-[#0A2540] hover:bg-white/60 font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 mb-1 ${isActive ? 'text-white' : 'text-[#64748b]'}`} />
              <span className="text-xs truncate max-w-full">
                {tab.label}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default RegisterRoleTabs;
