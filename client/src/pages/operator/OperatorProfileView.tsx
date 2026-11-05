import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useI18n, type TranslationKey } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, Building2, MapPin, Award, Layers, ShieldCheck, ArrowLeft } from 'lucide-react';
import { REGISTRY_69W } from '@safaqat/shared/territorial';
import { api } from '@/lib/api';

export function OperatorProfileView() {
  const { t, lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [wilayaCode, setWilayaCode] = useState('');
  const [mainSector, setMainSector] = useState('construction_public_works');
  const [activityCodesStr, setActivityCodesStr] = useState('');
  const [qualificationLevel, setQualificationLevel] = useState('');
  const [qualificationSector, setQualificationSector] = useState('');

  useEffect(() => {
    api.get('/operator/profile')
      .then((res) => res.data)
      .then((data) => {
        if (data.profile) {
          setWilayaCode(data.profile.wilayaCode || '');
          setMainSector(data.profile.mainSector || 'construction_public_works');
          setActivityCodesStr((data.profile.declaredActivityCodes || []).join(', '));
          setQualificationLevel(data.profile.declaredQualificationLevel || '');
          setQualificationSector(data.profile.declaredQualificationSector || '');
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    const codes = activityCodesStr
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (codes.length === 0) {
      setErrorMsg(t('operator.profile.err_activity_required'));
      setSaving(false);
      return;
    }

    if (!wilayaCode) {
      setErrorMsg(t('operator.profile.err_wilaya_required'));
      setSaving(false);
      return;
    }

    try {
      await api.put('/operator/profile', {
        wilayaCode,
        mainSector,
        declaredActivityCodes: codes,
        declaredQualificationLevel: qualificationLevel || null,
        declaredQualificationSector: qualificationSector || null,
      });

      setSuccessMsg(t('operator.profile.saved_success'));
    } catch (error) {
      const serverMessage = (error as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      setErrorMsg(serverMessage || t('operator.profile.err_save_failed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">...</div>;
  }

  return (
    <div className="op-page">
      {/* 1. Page Header */}
      <div className="op-page-head">
        <div className="flex flex-col gap-0.5">
          <h1>{t('operator.profile.title')}</h1>
          <p>{t('operator.profile.subtitle')}</p>
        </div>
        <div className="op-page-actions">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="op-btn op-btn-gold"
          >
            <span>{saving ? t('operator.profile.saving') : t('operator.profile.save_btn')}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="op-alert success">
          <CheckCircle className="size-4 flex-none" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="op-alert error">
          <AlertCircle className="size-4 flex-none" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1.5 بنر الملف الإداري الرقمي الموحد */}
      <div className="bg-gradient-to-r from-emerald-50/80 via-white to-slate-50 text-slate-900 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs border border-emerald-200/80">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck className="size-6 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">
                {lang === 'ar' ? 'جواز السفر الرقمي للمتعامل (DZ-PASSPORT)' : 'Passeport Numérique de l’Opérateur'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {lang === 'ar' ? 'ملف نشط' : 'Actif'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {lang === 'ar'
                ? 'الملف الإداري والقانوني الموحد للترشح بنقرة واحدة لجميع الصفقات العمومية الوطنية'
                : 'Dossier administratif unique pour soumissionner en un clic'}
            </p>
          </div>
        </div>

        <Link
          href="/operator/passport"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0b4348] hover:bg-[#073135] text-white shadow-xs transition-colors shrink-0"
        >
          <span>{lang === 'ar' ? 'فتح الجواز الرقمي الكامل' : 'Ouvrir le passeport'}</span>
          <ArrowLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
        </Link>
      </div>

      {/* 2. 8-Field Grid Form Card */}
      <form onSubmit={handleSubmit} className="op-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-800">{t('operator.profile.company_name')}</label>
            <input
              type="text"
              placeholder={t('operator.profile.company_name_ph')}
              defaultValue=""
              className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-800">{t('operator.profile.legal_form')}</label>
            <select className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" defaultValue="sarl">
              <option value="">{t('operator.profile.select_legal_form')}</option>
              <option value="eurl">EURL</option>
              <option value="sarl">SARL</option>
              <option value="spa">SPA</option>
              <option value="snc">SNC</option>
              <option value="pp">{t('operator.profile.legal_form_pp')}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-800">{t('operator.profile.rc_number')}</label>
            <input
              type="text"
              dir="ltr"
              placeholder={t('operator.profile.rc_number_ph')}
              className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm text-end focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-800">{t('operator.profile.nif')}</label>
            <input
              type="text"
              dir="ltr"
              placeholder="[NIF]"
              className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm text-end focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-800">{t('operator.profile.nis')}</label>
            <input
              type="text"
              dir="ltr"
              placeholder="[NIS]"
              className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm text-end focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-800">{t('operator.profile.address')}</label>
            <input
              type="text"
              placeholder={t('operator.profile.address_ph')}
              className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-800">{t('operator.profile.email')}</label>
            <input
              type="email"
              dir="ltr"
              placeholder="name@company.dz"
              className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm text-end focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-800">{t('operator.profile.phone')}</label>
            <input
              type="tel"
              dir="ltr"
              placeholder={t('operator.profile.phone_ph')}
              className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm text-end focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>
      </form>

      {/* 3. Official Documents Empty State */}
      <div className="op-empty-chart min-h-[190px]">
        <div className="flex size-12 items-center justify-center rounded-full bg-[#fdf6df] text-[#8a6e1c]">
          <Building2 className="size-[26px]" strokeWidth={1.8} />
        </div>
        <h3 className="mt-1">{t('operator.profile.no_docs_title')}</h3>
        <p className="max-w-[460px]">
          {t('operator.profile.no_docs_desc')}
        </p>
        <button
          type="button"
          className="op-btn op-btn-outline mt-2"
        >
          {t('operator.profile.attach_doc_btn')}
        </button>
      </div>

      {/* 4. Professional Classification and Territory Settings */}
      <form onSubmit={handleSubmit} className="op-card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Sector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--op-ink)] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span>{t('operator.profile.sector')} *</span>
            </label>
            <select
              value={mainSector}
              onChange={(e) => setMainSector(e.target.value)}
              className="op-select w-full h-10 text-xs"
            >
              <option value="construction_public_works">{t('operator.profile.sector_btph')}</option>
              <option value="hydraulics">{t('operator.profile.sector_hydraulics')}</option>
              <option value="it_telecom">{t('operator.profile.sector_it')}</option>
              <option value="supplies">{t('operator.profile.sector_supplies')}</option>
              <option value="services">{t('operator.profile.sector_services')}</option>
              <option value="studies_consulting">{t('operator.profile.sector_studies')}</option>
            </select>
          </div>

          {/* Wilaya of Social Headquarters */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--op-ink)] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>{t('operator.profile.wilaya')} ({t('operator.profile.wilaya_registry_ref')}) *</span>
            </label>
            <select
              value={wilayaCode}
              onChange={(e) => setWilayaCode(e.target.value)}
              className="op-select w-full h-10 text-xs"
            >
              <option value="">{t('operator.profile.select_wilaya_ph')}</option>
              {REGISTRY_69W.units.map((unit) => (
                <option key={unit.code} value={unit.code}>
                  {unit.code} - {lang === 'fr' ? unit.nameFr : unit.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Codes */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-[var(--op-ink)] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>{t('operator.profile.activity_codes')} *</span>
            </label>
            <Input
              type="text"
              value={activityCodesStr}
              onChange={(e) => setActivityCodesStr(e.target.value)}
              placeholder={t('operator.profile.activity_codes_ph')}
              className="op-input h-10 text-xs"
            />
            <p className="text-xs text-muted-foreground">
              {t('operator.profile.cnrc_help')}
            </p>
          </div>

          {/* Qualification Level */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--op-ink)] flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-primary" />
              <span>{t('operator.profile.qualification_level')}</span>
            </label>
            <select
              value={qualificationLevel}
              onChange={(e) => setQualificationLevel(e.target.value)}
              className="op-select w-full h-10 text-xs"
            >
              <option value="">{t('operator.profile.grade_none')}</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
                const gradeKey = `operator.profile.grade_${lvl}` as TranslationKey;
                return (
                  <option key={lvl} value={String(lvl)}>
                    {t(gradeKey)}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Qualification Sector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--op-ink)] flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-primary" />
              <span>{t('operator.profile.qualification_sector')}</span>
            </label>
            <Input
              type="text"
              value={qualificationSector}
              onChange={(e) => setQualificationSector(e.target.value)}
              placeholder={t('operator.profile.notes_ph')}
              className="op-input h-10 text-xs"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-[var(--op-line)] flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="op-btn op-btn-gold"
          >
            {saving ? '...' : t('operator.profile.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
