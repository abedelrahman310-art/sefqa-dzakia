import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useI18n } from '@/i18n';
import { ALGERIA_69_WILAYAS } from '@/lib/wilayas';
import {
  Search,
  MapPin,
  Briefcase,
  ArrowLeft,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const V3QuickSearchSection: React.FC = () => {
  const { lang, dir } = useI18n();
  const isAr = lang === 'ar';
  const [, setLocation] = useLocation();

  const [query, setQuery] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [category, setCategory] = useState('');

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (wilaya) params.set('wilaya', wilaya);
    if (category) params.set('category', category);
    const searchString = params.toString();
    setLocation(`/operator/deals${searchString ? `?${searchString}` : ''}`);
  };

  const quickTags = [
    { label: isAr ? 'أشغال عمومية وبناء' : 'Travaux Publics & BTPH', val: 'works' },
    { label: isAr ? 'رقمنة وتكنولوجيا' : 'Numérique & IT', val: 'tech' },
    { label: isAr ? 'منشآت صحية وتعليمية' : 'Santé & Éducation', val: 'infrastructure' },
    { label: isAr ? 'ري وطاقة' : 'Hydraulique & Énergie', val: 'energy' },
  ];

  return (
    <section
      dir={dir}
      className="relative w-full max-w-[1040px] mx-auto -mt-6 sm:-mt-8 px-4 z-20"
    >
      <div className="rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-xl p-5 sm:p-7 shadow-lg hover:shadow-xl transition-all duration-300">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
            
            {/* حقل البحث النصي */}
            <div className="md:col-span-5 relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
                <Search className="size-4.5" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isAr
                    ? 'ابحث عن صفقة عمومية، مشروع، أو قطاع...'
                    : 'Rechercher un marché, projet ou secteur...'
                }
                className="w-full h-12 ps-11 pe-4 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 transition-all"
              />
            </div>

            {/* اختيار الولاية */}
            <div className="md:col-span-3 relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
                <MapPin className="size-4" />
              </div>
              <select
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="w-full h-12 ps-10 pe-8 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer"
              >
                <option value="">
                  {isAr ? 'كافة الولايات (69 ولاية)' : 'Toutes les wilayas (69)'}
                </option>
                {ALGERIA_69_WILAYAS.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.code} - {isAr ? w.ar : w.fr}
                  </option>
                ))}
              </select>
            </div>

            {/* اختيار فئة الصفقة */}
            <div className="md:col-span-2 relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
                <Briefcase className="size-4" />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-12 ps-10 pe-8 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer"
              >
                <option value="">{isAr ? 'كافة المجالات' : 'Toutes catégories'}</option>
                <option value="works">{isAr ? 'أشغال وبناء' : 'Travaux'}</option>
                <option value="supplies">{isAr ? 'لوازم وتجهيز' : 'Fournitures'}</option>
                <option value="studies">{isAr ? 'دراسات واستشارة' : 'Études'}</option>
                <option value="services">{isAr ? 'خدمات وصيانة' : 'Services'}</option>
              </select>
            </div>

            {/* زر البحث الفوري */}
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full h-12 px-5 rounded-xl bg-[#006233] hover:bg-[#004d28] text-white text-sm font-bold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>{isAr ? 'استكشاف' : 'Rechercher'}</span>
                <ArrowIcon className="size-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* وسوم التصفية السريعة */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-semibold inline-flex items-center gap-1">
              <Filter className="size-3" />
              <span>{isAr ? 'تصفية سريعة:' : 'Accès rapide :'}</span>
            </span>
            {quickTags.map((tag) => (
              <button
                key={tag.val}
                type="button"
                onClick={() => setLocation(`/operator/deals?category=${tag.val}`)}
                className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 text-[11px] font-medium text-slate-600 hover:text-emerald-800 transition-colors cursor-pointer"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </form>
      </div>
    </section>
  );
};

export default V3QuickSearchSection;