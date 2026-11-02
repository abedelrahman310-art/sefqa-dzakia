import { UnifiedAuthPage } from './UnifiedAuthPage';

/**
 * صفحة تسجيل المتعامل الاقتصادي — مساحة المصادقة الموحدة لمنصة صفقات ذكية
 */
export function OperatorRegister() {
  return <UnifiedAuthPage initialMode="operator" />;
}

export default OperatorRegister;
