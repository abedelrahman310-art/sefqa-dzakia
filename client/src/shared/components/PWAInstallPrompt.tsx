import { useEffect, useState } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Global hook or shared state for deferredPrompt
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((listener) => listener(globalDeferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    promptListeners.forEach((listener) => listener(null));
  });
}

export function usePWAInstall() {
  const { t } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(Boolean(isRunningStandalone));

    const listener = (prompt: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(prompt);
    };
    promptListeners.add(listener);
    return () => {
      promptListeners.delete(listener);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      // If already installed or browser doesn't expose beforeinstallprompt directly,
      // advise the user or open in new window
      if (isStandalone) {
        return;
      }
      alert(t('pwa.install_help'));
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } catch {
      // handled
    }
  };

  return { deferredPrompt, isStandalone, canInstall: Boolean(deferredPrompt), installApp };
}

/**
 * زر مستقل لفتح المنصة أو تثبيتها على سطح المكتب
 * يمكن استخدامه في TopBar، Sidebar، أو لوحة التحكم
 */
export function DesktopAppButton({
  className = '',
  variant = 'outline',
  showIcon = true,
}: {
  className?: string;
  variant?: 'outline' | 'default' | 'ghost' | 'secondary';
  showIcon?: boolean;
}) {
  const { t } = useI18n();
  const { isStandalone, installApp } = usePWAInstall();

  if (isStandalone) {
    return null;
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={installApp}
      className={`gap-2 text-xs font-bold transition-all shadow-xs ${className}`}
      title={t('pwa.desktop_button_title')}
    >
      {showIcon && <Monitor className="w-4 h-4 text-[var(--stamp-green-700)] shrink-0" />}
      <span>{t('pwa.desktop_button')}</span>
    </Button>
  );
}

/**
 * نافذة التنبيه التلقائية السفلية لتثبيت التطبيق
 */
export function PWAInstallPrompt() {
  const { t } = useI18n();
  const { deferredPrompt, isStandalone, installApp } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // تحقق إن كان المستخدم قد رفض سابقاً أو التطبيق مثبت بالفعل
    if (isStandalone) return;
    const wasDismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (wasDismissed === 'true') return;

    // اظهر بعد 15 ثانية من الاستخدام إذا كان التثبيت متاحاً
    const timer = setTimeout(() => {
      if (globalDeferredPrompt) {
        setShowPrompt(true);
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, [isStandalone]);

  const handleInstall = async () => {
    await installApp();
    setShowPrompt(false);
    setDismissed(true);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt || dismissed || !deferredPrompt || isStandalone) return null;

  return (
    <div
      className="
        fixed bottom-4 start-4 end-4 md:start-auto md:end-4 
        md:w-[400px]
        bg-white 
        border border-[var(--color-border-subtle)]
        rounded-2xl 
        shadow-2xl
        p-5 
        z-50
        page-transition
      "
      dir="rtl"
    >
      <div className="flex items-start gap-4">
        <div
          className="
            size-12 rounded-xl 
            bg-[var(--stamp-green-700)]
            flex items-center justify-center
            text-white shrink-0
            shadow-sm
          "
        >
          <Smartphone className="size-6" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[var(--ink-900)] mb-1">
            {t('pwa.install_title')}
          </h3>
          <p className="text-sm text-[var(--ink-500)] leading-relaxed">
            {t('pwa.install_description')}
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="
            text-[var(--ink-400)] 
            hover:text-[var(--ink-700)] 
            transition-colors
            -mt-1 -me-1 p-1 rounded-lg hover:bg-[var(--paper-100)]
          "
          aria-label={t('pwa.dismiss_aria')}
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex gap-2 mt-4">
        <Button
          onClick={handleInstall}
          className="flex-1 gap-2 bg-[var(--stamp-green-700)] hover:bg-[var(--stamp-green-800)] text-white font-bold"
        >
          <Download className="size-4" />
          {t('pwa.install_button')}
        </Button>
        <Button
          variant="ghost"
          onClick={handleDismiss}
          className="text-[var(--ink-700)] hover:bg-[var(--paper-100)] font-semibold"
        >
          {t('pwa.later')}
        </Button>
      </div>
    </div>
  );
}

export default PWAInstallPrompt;
