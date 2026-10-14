import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useI18n } from '@/i18n';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LogoutButtonProps {
  variant?: 'sidebar' | 'dropdown';
  className?: string;
}

export function LogoutButton({ variant = 'sidebar', className = '' }: LogoutButtonProps) {
  const { logout } = useAuth();
  const { t } = useI18n();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    setShowConfirm(false);
    logout();
  };

  if (variant === 'dropdown') {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className={`flex items-center gap-2 w-full px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors ${className}`}
        >
          <LogOut className="size-4 shrink-0" />
          <span>{t('common.logout')}</span>
        </button>
        <ConfirmDialog
          open={showConfirm}
          onOpenChange={setShowConfirm}
          onConfirm={handleLogout}
          t={t}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className={`group flex items-center gap-3 w-full px-4 py-3.5 rounded-lg text-[15px] font-medium text-[var(--stamp-red-700)] hover:bg-[var(--stamp-red-700)]/8 transition-colors duration-150 ${className}`}
      >
        <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
        <span>{t('common.logout')}</span>
      </button>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={handleLogout}
        t={t}
      />
    </>
  );
}

function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  t: (key: any) => string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('common.logout_confirm_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('common.logout_confirm_message')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {t('common.logout')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default LogoutButton;
