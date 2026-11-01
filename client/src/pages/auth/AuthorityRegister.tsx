import { NeumorphicRegister } from '@/components/auth/NeumorphicRegister';

/**
 * صفحة تسجيل المصلحة المتعاقدة — نسخة نمط Neumorphism الفاخر الموحدة.
 *
 * الحقول والتبويبات والمنطق مشتركة مع صفحة المتعامل الاقتصادي عبر
 * المكوّن NeumorphicRegister؛ هذه الصفحة تعلن الدور الابتدائي فقط
 * ويُستخدم useState داخلياً للتبديل بين (متعامل / مصلحة).
 */
export function AuthorityRegister() {
  return <NeumorphicRegister initialRole="authority" />;
}

export default AuthorityRegister;
