import { NeumorphicRegister } from '@/components/auth/NeumorphicRegister';

/**
 * صفحة تسجيل المتعامل الاقتصادي — نسخة نمط Neumorphism الفاخر الموحدة.
 *
 * الحقول والتبويبات والمنطق مشتركة مع صفحة المصلحة المتعاقدة عبر
 * المكوّن NeumorphicRegister؛ هذه الصفحة تعلن الدور الابتدائي فقط
 * ويُستخدم useState داخلياً للتبديل بين (متعامل / مصلحة).
 */
export function OperatorRegister() {
  return <NeumorphicRegister initialRole="operator" />;
}

export default OperatorRegister;
