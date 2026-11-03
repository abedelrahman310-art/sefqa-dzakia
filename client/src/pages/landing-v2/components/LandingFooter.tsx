import React from 'react';
import { Link } from 'wouter';
import { useI18n } from '@/i18n';
import Logo from '@/components/ui/Logo';
import { Mail, MapPin, Clock, ShieldCheck } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  const { lang } = useI18n();
  const isAr = lang === 'ar';

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
          
          {/* العمود 1 و 2: هوية المنظومة */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 inline-block">
                <Logo size={36} />
              </div>
              <span className="text-xl font-black text-white font-cairo">
                {isAr ? 'صفقات ذكية' : 'Safaqat Dhakia'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm font-medium">
              {isAr
                ? 'المنظومة الوطنية الموحدة لتسيير ومراقبة وتجريد الصفقات العمومية في الجزائر. تجمع الفاعلين، وتسرع الإجراءات، وترسخ الشفافية بالذكاء الاصطناعي السيادي.'
                : 'Plateforme nationale unifiée de gestion et de dématérialisation des marchés publics en Algérie sous l’égide des lois de la République.'}
            </p>

            <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold pt-2">
              <ShieldCheck className="w-4 h-4" />
              <span>{isAr ? 'القانون 23-12 • المادة 67 (التجريد المادي الكامل)' : 'Loi 23-12 • Article 67'}</span>
            </div>
          </div>

          {/* العمود 3: البوابات السيادية */}
          <div className="space-y-3">
            <strong className="text-sm font-bold text-white font-cairo block tracking-wide">
              {isAr ? 'البوابات السيادية' : 'Portails'}
            </strong>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/operator" className="hover:text-emerald-400 transition-colors">
                  {isAr ? 'فضاء المتعامل الاقتصادي' : 'Opérateur Économique'}
                </Link>
              </li>
              <li>
                <Link href="/authority" className="hover:text-emerald-400 transition-colors">
                  {isAr ? 'فضاء المصلحة المتعاقدة' : 'Autorité Contractante'}
                </Link>
              </li>
              <li>
                <Link href="/central" className="hover:text-emerald-400 transition-colors">
                  {isAr ? 'الإدارة المركزية (عين الصقر)' : 'Administration Centrale'}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-400 transition-colors">
                  {isAr ? 'بوابة الدخول الموحدة' : 'Connexion Unifiée'}
                </Link>
              </li>
            </ul>
          </div>

          {/* العمود 4: الروابط القانونية والدعم */}
          <div className="space-y-3">
            <strong className="text-sm font-bold text-white font-cairo block tracking-wide">
              {isAr ? 'التنظيم والمعايير' : 'Réglementation'}
            </strong>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/terms" className="hover:text-emerald-400 transition-colors">
                  {isAr ? 'شروط الاستخدام والامتثال' : 'Conditions d’utilisation'}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-emerald-400 transition-colors">
                  {isAr ? 'الأسئلة الشائعة والإرشادات' : 'Foire aux Questions'}
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="hover:text-emerald-400 transition-colors">
                  {isAr ? 'إمكانية الوصول (A11y)' : 'Accessibilité numérique'}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-emerald-400 transition-colors">
                  {isAr ? 'تفعيل الذكاء الاصطناعي' : 'Services IA'}
                </Link>
              </li>
            </ul>
          </div>

          {/* العمود 5: الاتصال والتواصل */}
          <div className="space-y-3 text-xs text-slate-400">
            <strong className="text-sm font-bold text-white font-cairo block tracking-wide">
              {isAr ? 'التواصل الرسمي' : 'Contact'}
            </strong>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isAr ? 'الجزائر العاصمة، الجزائر' : 'Alger, Algérie'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>contact@safaqat-dz.ai</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isAr ? 'الأحد — الخميس: 08:30 - 16:30' : 'Dim — Jeu: 08:30 - 16:30'}</span>
            </div>
          </div>

        </div>

        {/* الشريط السفلي للحقوق والسيادة */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            {isAr
              ? '© 2026 الجمهورية الجزائرية الديمقراطية الشعبية — منصة «صفقات ذكية». جميع الحقوق محفوظة.'
              : '© 2026 République Algérienne Démocratique et Populaire — Plateforme « Safaqat Dhakia ». Tous droits réservés.'}
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>{isAr ? 'تشفير وطني سيادي' : 'Chiffrement Souverain'}</span>
            <span>•</span>
            <span>AES-256</span>
            <span>•</span>
            <span>SHA-256</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
