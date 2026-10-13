import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/600.css';
import '@fontsource/cairo/700.css';
import '@fontsource/cairo/800.css';
import './index.css';
import { I18nProvider } from '@/i18n';
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <App />
          <Toaster position="top-center" richColors dir="rtl" />
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
