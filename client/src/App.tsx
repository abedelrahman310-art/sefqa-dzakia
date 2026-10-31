import { Route, Switch, Redirect } from 'wouter';
import { DevShell } from './pages/DevShell';
import { Login } from './pages/Login';
import { OperatorRegister } from './pages/auth/OperatorRegister';
import { AuthorityRegister } from './pages/auth/AuthorityRegister';
import { OperatorSpace } from './pages/operator/OperatorSpace';
import { AuthoritySpace } from './pages/authority/AuthoritySpace';
import { CentralSpace } from './pages/central/CentralSpace';
import { RequireRole } from './components/auth/RequireRole';
import { LandingPage } from './pages/landing/LandingPage';
import { LandingV2Page } from './pages/landing-v2/LandingV2Page';
import { TermsPage } from './pages/legal/TermsPage';
import { FAQPage } from './pages/legal/FAQPage';
import { AccessibilityPage } from './pages/legal/AccessibilityPage';
import { PWAInstallPrompt } from '@/shared/components/PWAInstallPrompt';

export function App() {
  const isDev = import.meta.env.DEV;

  return (
    <>
      <PWAInstallPrompt />
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

      <Route path="/central/:rest*">
        <RequireRole roles={['central_admin']}>
          <CentralSpace />
        </RequireRole>
      </Route>

      <Route path="/landing-v2" component={LandingV2Page} />
      <Route path="/landing-old" component={LandingPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/accessibility" component={AccessibilityPage} />
      <Route path="/" component={LandingV2Page} />

      <Route>
        <div className="flex items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold text-destructive">404 - الصفحة غير موجودة</h1>
        </div>
      </Route>
    </Switch>
    </>
  );
}
