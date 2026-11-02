import { UnifiedAuthPage } from './auth/UnifiedAuthPage';

/**
 * صفحة تسجيل الدخول الموحدة لمنصة صفقات ذكية
 * بتصميم The Split Stage المستوحى من مهارة design-taste-frontend (tasteskill v2)
 */
export function Login() {
  return <UnifiedAuthPage initialMode="login" />;
}

export default Login;
