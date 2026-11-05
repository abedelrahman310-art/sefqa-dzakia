import { lazy, Suspense } from 'react';
import { Route, Switch, Redirect } from 'wouter';
import { RequireRole } from './components/auth/RequireRole';
import { PWAInstallPrompt } from '@/shared/components/PWAInstallPrompt';
import { useI18n } from '@/i18n';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Code Splitting with React.lazy
const DevShell = lazy(() => import('./pages/DevShell').then(m => ({ default: m.DevShell })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const OperatorRegister = lazy(() => import('./pages/auth/OperatorRegister').then(m => ({ default: m.OperatorRegister })));
const AuthorityRegister = lazy(() => import('./pages/auth/AuthorityRegister').then(m => ({ default: m.AuthorityRegister })));
const OperatorSpace = lazy(() => import('./pages/operator/OperatorSpace').then(m => ({ default: m.OperatorSpace })));
const AuthoritySpace = lazy(() => import('./pages/authority/AuthoritySpace').then(m => ({ default: m.AuthoritySpace })));
const CentralSpace = lazy(() => import('./pages/central/CentralSpace').then(m => ({ default: m.CentralSpace })));
const AcceptInvite = lazy(() => import('./pages/central/AcceptInvite').then(m => ({ default: m.AcceptInvite })));
const LandingPage = lazy(() => import('./pages/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const LandingV3Page = lazy(() => import('./pages/landing-v3/LandingV3Page').then(m => ({ default: m.LandingV3Page })));
const TermsPage = lazy(() => import('./pages/legal/TermsPage').then(m => ({ default: m.TermsPage })));
const FAQPage = lazy(() => import('./pages/legal/FAQPage').then(m => ({ default: m.FAQPage })));
const AccessibilityPage = lazy(() => import('./pages/legal/AccessibilityPage').then(m => ({ default: m.AccessibilityPage })));
const AISubscriptionPage = lazy(() => import('./pages/pricing/AISubscriptionPage').then(m => ({ default: m.AISubscriptionPage })));
const AIPowerPage = lazy(() => import('./pages/ai/AIPowerPage').then(m => ({ default: m.AIPowerPage })));

function PageFallback({ label }: { label: string }) {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
    </div>
  );
}

export function App() {
  const isDev = import.meta.env.DEV;
  const { t } = useI18n();

  return (
    <>
      <PWAInstallPrompt />
      <Suspense fallback={<PageFallback label={t('common.loading') || 'جاري التحميل...'} />}>
        <ErrorBoundary>
          <Switch>
          {isDev && (
            <Route path="/dev/shell" component={DevShell} />
          )}
          
          <Route path="/login" component={Login} />
          <Route path="/register/operator" component={OperatorRegister} />
          <Route path="/register/authority" component={AuthorityRegister} />
          <Route path="/register">
            <Redirect to="/register/operator" />
          </Route>

          <Route path="/operator/:rest*">
            <RequireRole roles={['operator']}>
              <OperatorSpace />
            </RequireRole>
          </Route>

          <Route path="/authority/:rest*">
            <RequireRole roles={['authority']}>
              <AuthoritySpace />
            </RequireRole>
          </Route>

          <Route path="/central/accept-invite/:token">
            {(params) => <AcceptInvite token={params.token} />}
          </Route>

          <Route path="/central/:rest*">
            <RequireRole roles={['central_admin']}>
              <CentralSpace />
            </RequireRole>
          </Route>

          <Route path="/v3">
            <Redirect to="/" />
          </Route>
          <Route path="/landing-v3">
            <Redirect to="/" />
          </Route>
          <Route path="/landing-v2">
            <Redirect to="/" />
          </Route>
          <Route path="/landing-old" component={LandingPage} />
          <Route path="/terms" component={TermsPage} />
          <Route path="/faq" component={FAQPage} />
          <Route path="/accessibility" component={AccessibilityPage} />
          <Route path="/pricing" component={AISubscriptionPage} />
          <Route path="/ai-capabilities" component={AIPowerPage} />
          <Route path="/ai" component={AIPowerPage} />
          <Route path="/power-of-ai" component={AIPowerPage} />
          <Route path="/" component={LandingV3Page} />

          <Route>
            <div className="flex items-center justify-center min-h-screen">
              <h1 className="text-2xl font-bold text-destructive">{t('common.page_not_found')}</h1>
            </div>
          </Route>
        </Switch>
      </ErrorBoundary>
    </Suspense>
    </>
  );
}
