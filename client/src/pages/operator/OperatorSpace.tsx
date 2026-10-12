import { useI18n } from '@/i18n';
import { useAuth } from '@/components/auth/AuthProvider';
import { AppShell, NavItem } from '@/components/layout/AppShell';
import { Inbox, Archive, CheckSquare, LogOut, Briefcase, LayoutDashboard, Settings, UserCheck } from 'lucide-react';
import { Route, Switch } from 'wouter';
import { OperatorOverview } from './OperatorOverview';
import { OperatorOpportunities } from './OperatorOpportunities';
import { OpportunityDetails } from './OpportunityDetails';
import { OffersList } from './OffersList';
import { OfferForm } from './OfferForm';
import { OperatorProfileView } from './OperatorProfileView';
import { OperatorSmartSpecsView } from './OperatorSmartSpecsView';
import { OperatorArchiveView } from './OperatorArchiveView';
import { OperatorSettingsView } from './OperatorSettingsView';
import { RequirementsResponse } from './RequirementsResponse';
import { PortalNotFound } from '@/components/common/PortalNotFound';

export function OperatorSpace() {
  const { t } = useI18n();
  const { logout, user } = useAuth();

  const orgName = user?.organizationName || user?.displayName || 'المتعامل الاقتصادي';
  const avatarInitials = orgName.trim().slice(0, 2);

  const navItems: NavItem[] = [
    {
      id: 'overview',
      labelKey: 'nav.operator.overview',
      href: '/operator',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'deals',
      labelKey: 'nav.operator.deals',
      href: '/operator/deals',
      icon: <Briefcase className="w-4 h-4" />,
    },
    {
      id: 'profile',
      labelKey: 'nav.operator.profile',
      href: '/operator/profile',
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      id: 'offers',
      labelKey: 'nav.operator.offers',
      href: '/operator/offers',
      icon: <Inbox className="w-4 h-4" />,
    },
    {
      id: 'smart_specs',
      labelKey: 'nav.operator.smart_specs',
      href: '/operator/smart-specs',
      icon: <CheckSquare className="w-4 h-4" />,
    },
    {
      id: 'archive',
      labelKey: 'nav.operator.archive',
      href: '/operator/archive',
      icon: <Archive className="w-4 h-4" />,
    },
    {
      id: 'settings',
      labelKey: 'nav.operator.settings',
      href: '/operator/settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <AppShell
      navItems={navItems}
      footerItem={{
        id: 'logout',
        labelKey: 'nav.logout',
        icon: <LogOut className="w-4 h-4" />,
        onClick: logout,
      }}
      header={
        <div className="w-full flex items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold-500 text-navy-900 font-extrabold flex items-center justify-center text-sm shadow-sm flex-none">
              {avatarInitials}
            </div>
            <div className="leading-tight min-w-0">
              <span className="text-xs text-muted-foreground block">{t('topbar.account_label')}</span>
              <strong className="text-sm font-bold text-navy-900 line-clamp-1" title={orgName}>{orgName}</strong>
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-6">

        {/* Content Views */}
        <Switch>
          <Route path="/operator/deals" component={OperatorOpportunities} />
          <Route path="/operator/profile" component={OperatorProfileView} />
          <Route path="/operator/smart-specs" component={OperatorSmartSpecsView} />
          <Route path="/operator/archive" component={OperatorArchiveView} />
          <Route path="/operator/settings" component={OperatorSettingsView} />
          <Route path="/operator/opportunities/:oppId/requirements" component={RequirementsResponse} />
          <Route path="/operator/opportunities/:oppId/offer">
            {(params) => <OfferForm opportunityId={params.oppId} />}
          </Route>
          <Route path="/operator/opportunities/:id" component={OpportunityDetails} />
          <Route path="/operator/offers" component={OffersList} />
          <Route path="/operator/offers/:id">
            {(params) => <OfferForm offerId={params.id} />}
          </Route>
          <Route path="/operator/overview" component={OperatorOverview} />
          <Route path="/operator" component={OperatorOverview} />
          <Route>
            <PortalNotFound basePath="/operator" baseTitle="الرئيسية للمتعامل" />
          </Route>
        </Switch>
      </div>
    </AppShell>
  );
}
