import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { useLocation } from 'wouter';
import { ExternalLink, Building2, ShieldCheck, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { REGISTRY_69W } from '@safaqat/shared/territorial';

interface ProfileData {
  wilayaCode?: string;
  mainSector?: string;
  declaredActivityCodes?: string[];
  declaredQualificationLevel?: string;
}

export function OperatorIdentityCard() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/operator/profile')
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (isMounted && data && data.profile) {
          setProfile(data.profile);
        }
      })
      .catch(() => {
        // Silently handle if profile endpoint is unreachable
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = user?.displayName?.trim() || user?.email || '';
  const organizationName = user?.organizationName?.trim() || '';
  const avatarLetters = (organizationName || displayName || t('operator.card.default_avatar_initial')).slice(0, 2);

  // Derive localized wilaya name if available
  let wilayaName = '';
  if (profile?.wilayaCode) {
    const foundWilaya = REGISTRY_69W.units.find((w) => w.code === profile.wilayaCode);
    if (foundWilaya) {
      wilayaName = lang === 'ar' ? foundWilaya.nameAr : foundWilaya.nameFr;
    }
  }

  // Derive sector label if present
  const sectorLabel = profile?.mainSector
    ? profile.mainSector === 'construction_public_works'
      ? t('operator.sector.btph')
      : profile.mainSector === 'services_studies'
      ? t('operator.sector.services')
      : profile.mainSector === 'supplies'
      ? t('operator.sector.supplies')
      : profile.mainSector
    : '';

  return (
    <section className="flex-none bg-white dark:bg-slate-900 border-b border-border/80 px-4 sm:px-6 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] z-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left / Start: Operator Avatar & Identity Details */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-navy-900 text-gold-400 font-extrabold flex items-center justify-center text-sm shadow-sm ring-1 ring-gold-500/20 flex-none">
            {avatarLetters}
          </div>

          <div className="flex flex-col min-w-0 leading-tight">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-navy-900 dark:text-slate-100 truncate">
                {displayName}
              </h2>

              {/* Status Badge: Active */}
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{t('operator.card.status_active')}</span>
              </span>

              {/* Role badge */}
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 flex-none">
                <ShieldCheck className="w-3 h-3 text-gold-600" />
                <span>{t('operator.card.verified_badge')}</span>
              </span>
            </div>

            {/* Sub-identity row: Organization & Activity & Wilaya */}
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground truncate">
              {organizationName && (
                <span className="flex items-center gap-1 truncate font-medium text-slate-700 dark:text-slate-300">
                  <Building2 className="w-3 h-3 flex-none text-slate-400" />
                  <span className="truncate">{organizationName}</span>
                </span>
              )}

              {sectorLabel && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="truncate text-slate-600 dark:text-slate-400">{sectorLabel}</span>
                </>
              )}

              {wilayaName && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="flex items-center gap-0.5 truncate text-slate-600 dark:text-slate-400">
                    <MapPin className="w-3 h-3 flex-none text-slate-400" />
                    <span className="truncate">{wilayaName}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right / End: Direct Quick Action to Profile */}
        <div className="flex items-center justify-end flex-none">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/operator/profile')}
            className="h-8 px-3 text-xs font-semibold border-slate-200 dark:border-slate-700 hover:border-navy-900 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 gap-1.5 transition-colors"
          >
            <span>{t('operator.card.open_profile')}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Button>
        </div>
      </div>
    </section>
  );
}
