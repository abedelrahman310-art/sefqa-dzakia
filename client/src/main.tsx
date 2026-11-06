import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/600.css';
import '@fontsource/cairo/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import './theme/tokens/primitives.css';
import './theme/tokens/semantic.css';
import './theme/tokens/components.css';
import './index.css';
import '@/lib/i18n';
import { I18nProvider, useI18n } from '@/i18n';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { App } from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** التوستات تتبع اتجاه الصفحة الحالي (RTL للعربية / LTR للفرنسية). */
function AppToaster() {
  const { dir } = useI18n();
  return <Toaster position="top-center" richColors dir={dir} />;
}

// Security: purge API responses cached by older service-worker versions.
// API traffic is network-only now; this removes stale authenticated or
// financial data that may still exist in the browser's Cache Storage.
if (typeof window !== 'undefined' && 'caches' in window) {
  void window.caches.delete('api-cache').catch(() => undefined);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <App />
          <AppToaster />
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
