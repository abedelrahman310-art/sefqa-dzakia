import { useState, useEffect } from 'react';

const STORAGE_KEY = 'sidebar-collapsed';

export function useSidebarCollapse() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(STORAGE_KEY) === 'true';
      }
    } catch {
      // ignore security/quota errors
    }
    return false;
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setIsCollapsed(e.newValue === 'true');
      }
    };
    const handleCustom = () => {
      try {
        setIsCollapsed(localStorage.getItem(STORAGE_KEY) === 'true');
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('sidebar-collapse-change', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('sidebar-collapse-change', handleCustom);
    };
  }, []);

  const toggle = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, String(next));
          window.dispatchEvent(new Event('sidebar-collapse-change'));
        }
      } catch {
        // ignore
      }
      return next;
    });
  };

  return { isCollapsed, setIsCollapsed, toggle };
}
export default useSidebarCollapse;
