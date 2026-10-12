/**
 * Territorial Reference for the People's Democratic Republic of Algeria
 * Multi-version registry supporting Law 19-12 (58 Wilayas) and extended provisions (Law 26-06 / 69 Wilayas).
 */

export interface TerritorialUnit {
  code: string;
  nameAr: string;
  nameFr: string;
  parentCode?: string; // Parent wilaya during transitional administrative handovers
  regulatorySource: string;
}

export interface TerritorialRegistryVersion {
  versionId: string;
  titleAr: string;
  titleFr: string;
  enactedLaw: string;
  publishedJoNumber: string;
  publishedJoDate: string;
  effectiveDate: string;
  isCurrentDefault: boolean;
  units: TerritorialUnit[];
}

export const REGISTRY_58W: TerritorialRegistryVersion = {
  versionId: '2019-58W',
  titleAr: 'التنظيم الإقليمي المعتمد بموجب القانون 19-12 (58 ولاية)',
  titleFr: 'Organisation territoriale selon la loi 19-12 (58 wilayas)',
  enactedLaw: 'القانون رقم 19-12 المؤرخ في 14 ربيع الثاني عام 1441 الموافق 11 ديسمبر 2019، المعدل والمتمم للقانون رقم 84-09 المؤرخ في 4 فبراير 1984 والمتعلق بالتنظيم الإقليمي للبلاد',
  publishedJoNumber: '78',
  publishedJoDate: '2019-12-18',
  effectiveDate: '2019-12-18',
  isCurrentDefault: true,
  units: [
    { code: '01', nameAr: 'أدرار', nameFr: 'Adrar', regulatorySource: 'Loi 84-09' },
    { code: '02', nameAr: 'الشلف', nameFr: 'Chlef', regulatorySource: 'Loi 84-09' },
    { code: '03', nameAr: 'الأغواط', nameFr: 'Laghouat', regulatorySource: 'Loi 84-09' },
    { code: '04', nameAr: 'أم البواقي', nameFr: 'Oum El Bouaghi', regulatorySource: 'Loi 84-09' },
    { code: '05', nameAr: 'باتنة', nameFr: 'Batna', regulatorySource: 'Loi 84-09' },
    { code: '06', nameAr: 'بجاية', nameFr: 'Béjaïa', regulatorySource: 'Loi 84-09' },
    { code: '07', nameAr: 'بسكرة', nameFr: 'Biskra', regulatorySource: 'Loi 84-09' },
    { code: '08', nameAr: 'بشار', nameFr: 'Béchar', regulatorySource: 'Loi 84-09' },
    { code: '09', nameAr: 'البليدة', nameFr: 'Blida', regulatorySource: 'Loi 84-09' },
    { code: '10', nameAr: 'البويرة', nameFr: 'Bouira', regulatorySource: 'Loi 84-09' },
    { code: '11', nameAr: 'تمنراست', nameFr: 'Tamanrasset', regulatorySource: 'Loi 84-09' },
    { code: '12', nameAr: 'تبسة', nameFr: 'Tébessa', regulatorySource: 'Loi 84-09' },
    { code: '13', nameAr: 'تلمسان', nameFr: 'Tlemcen', regulatorySource: 'Loi 84-09' },
    { code: '14', nameAr: 'تيارت', nameFr: 'Tiaret', regulatorySource: 'Loi 84-09' },
    { code: '15', nameAr: 'تيزي وزو', nameFr: 'Tizi Ouzou', regulatorySource: 'Loi 84-09' },
    { code: '16', nameAr: 'الجزائر', nameFr: 'Alger', regulatorySource: 'Loi 84-09' },
    { code: '17', nameAr: 'الجلفة', nameFr: 'Djelfa', regulatorySource: 'Loi 84-09' },
    { code: '18', nameAr: 'جيجل', nameFr: 'Jijel', regulatorySource: 'Loi 84-09' },
    { code: '19', nameAr: 'سطيف', nameFr: 'Sétif', regulatorySource: 'Loi 84-09' },
    { code: '20', nameAr: 'سعيدة', nameFr: 'Saïda', regulatorySource: 'Loi 84-09' },
    { code: '21', nameAr: 'سكيكدة', nameFr: 'Skikda', regulatorySource: 'Loi 84-09' },
    { code: '22', nameAr: 'سيدي بلعباس', nameFr: 'Sidi Bel Abbès', regulatorySource: 'Loi 84-09' },
    { code: '23', nameAr: 'عنابة', nameFr: 'Annaba', regulatorySource: 'Loi 84-09' },
    { code: '24', nameAr: 'قالمة', nameFr: 'Guelma', regulatorySource: 'Loi 84-09' },
    { code: '25', nameAr: 'قسنطينة', nameFr: 'Constantine', regulatorySource: 'Loi 84-09' },
    { code: '26', nameAr: 'المدية', nameFr: 'Médéa', regulatorySource: 'Loi 84-09' },
    { code: '27', nameAr: 'مستغانم', nameFr: 'Mostaganem', regulatorySource: 'Loi 84-09' },
    { code: '28', nameAr: 'المسيلة', nameFr: "M'Sila", regulatorySource: 'Loi 84-09' },
    { code: '29', nameAr: 'معسكر', nameFr: 'Mascara', regulatorySource: 'Loi 84-09' },
    { code: '30', nameAr: 'ورقلة', nameFr: 'Ouargla', regulatorySource: 'Loi 84-09' },
    { code: '31', nameAr: 'وهران', nameFr: 'Oran', regulatorySource: 'Loi 84-09' },
    { code: '32', nameAr: 'البيض', nameFr: 'El Bayadh', regulatorySource: 'Loi 84-09' },
    { code: '33', nameAr: 'إليزي', nameFr: 'Illizi', regulatorySource: 'Loi 84-09' },
    { code: '34', nameAr: 'برج بوعريريج', nameFr: 'Bordj Bou Arreridj', regulatorySource: 'Loi 84-09' },
    { code: '35', nameAr: 'بومرداس', nameFr: 'Boumerdès', regulatorySource: 'Loi 84-09' },
    { code: '36', nameAr: 'الطارف', nameFr: 'El Tarf', regulatorySource: 'Loi 84-09' },
    { code: '37', nameAr: 'تندوف', nameFr: 'Tindouf', regulatorySource: 'Loi 84-09' },
    { code: '38', nameAr: 'تيسمسيلت', nameFr: 'Tissemsilt', regulatorySource: 'Loi 84-09' },
    { code: '39', nameAr: 'الوادي', nameFr: 'El Oued', regulatorySource: 'Loi 84-09' },
    { code: '40', nameAr: 'خنشلة', nameFr: 'Khenchela', regulatorySource: 'Loi 84-09' },
    { code: '41', nameAr: 'سوق أهراس', nameFr: 'Souk Ahras', regulatorySource: 'Loi 84-09' },
    { code: '42', nameAr: 'تيبازة', nameFr: 'Tipaza', regulatorySource: 'Loi 84-09' },
    { code: '43', nameAr: 'ميلة', nameFr: 'Mila', regulatorySource: 'Loi 84-09' },
    { code: '44', nameAr: 'عين الدفلى', nameFr: 'Aïn Defla', regulatorySource: 'Loi 84-09' },
    { code: '45', nameAr: 'النعامة', nameFr: 'Naâma', regulatorySource: 'Loi 84-09' },
    { code: '46', nameAr: 'عين تموشنت', nameFr: 'Aïn Témouchent', regulatorySource: 'Loi 84-09' },
    { code: '47', nameAr: 'غرداية', nameFr: 'Ghardaïa', regulatorySource: 'Loi 84-09' },
    { code: '48', nameAr: 'غليزان', nameFr: 'Relizane', regulatorySource: 'Loi 84-09' },
    { code: '49', nameAr: 'تيميمون', nameFr: 'Timimoun', parentCode: '01', regulatorySource: 'Loi 19-12' },
    { code: '50', nameAr: 'برج باجي مختار', nameFr: 'Bordj Badji Mokhtar', parentCode: '01', regulatorySource: 'Loi 19-12' },
    { code: '51', nameAr: 'أولاد جلال', nameFr: 'Ouled Djellal', parentCode: '07', regulatorySource: 'Loi 19-12' },
    { code: '52', nameAr: 'بني عباس', nameFr: 'Béni Abbès', parentCode: '08', regulatorySource: 'Loi 19-12' },
    { code: '53', nameAr: 'عين صالح', nameFr: 'In Salah', parentCode: '11', regulatorySource: 'Loi 19-12' },
    { code: '54', nameAr: 'عين قزام', nameFr: 'In Guezzam', parentCode: '11', regulatorySource: 'Loi 19-12' },
    { code: '55', nameAr: 'تقرت', nameFr: 'Touggourt', parentCode: '30', regulatorySource: 'Loi 19-12' },
    { code: '56', nameAr: 'جانت', nameFr: 'Djanet', parentCode: '33', regulatorySource: 'Loi 19-12' },
    { code: '57', nameAr: 'المغير', nameFr: "El M'Ghair", parentCode: '39', regulatorySource: 'Loi 19-12' },
    { code: '58', nameAr: 'المنيعة', nameFr: 'El Meniaa', parentCode: '47', regulatorySource: 'Loi 19-12' },
  ],
};

export const REGISTRY_69W: TerritorialRegistryVersion = {
  versionId: '2026-69W',
  titleAr: 'التنظيم الإقليمي الموسع بموجب القانون 26-06 والتنظيمات المتممة (69 ولاية ودائرة منتدبة)',
  titleFr: 'Organisation territoriale étendue selon la loi 26-06 (69 unités)',
  enactedLaw: 'القانون رقم 26-06 والمراسيم التنفيذية المحددة للدوائر والولايات المنتدبة والمستحدثة في إطار إعادة التوازن الإقليمي',
  publishedJoNumber: 'JORADP-2026',
  publishedJoDate: '2026-01-15',
  effectiveDate: '2026-01-15',
  isCurrentDefault: false,
  units: [
    ...REGISTRY_58W.units,
    { code: '59', nameAr: 'أفلو', nameFr: 'Aflou', parentCode: '03', regulatorySource: 'Loi 26-06' },
    { code: '60', nameAr: 'بريكة', nameFr: 'Barika', parentCode: '05', regulatorySource: 'Loi 26-06' },
    { code: '61', nameAr: 'قصر الشلالة', nameFr: 'Ksar Chellala', parentCode: '14', regulatorySource: 'Loi 26-06' },
    { code: '62', nameAr: 'عين وسارة', nameFr: 'Aïn Oussera', parentCode: '17', regulatorySource: 'Loi 26-06' },
    { code: '63', nameAr: 'مسعد', nameFr: 'Messaad', parentCode: '17', regulatorySource: 'Loi 26-06' },
    { code: '64', nameAr: 'العلمة', nameFr: 'El Eulma', parentCode: '19', regulatorySource: 'Loi 26-06' },
    { code: '65', nameAr: 'بوسعادة', nameFr: 'Bou Saâda', parentCode: '28', regulatorySource: 'Loi 26-06' },
    { code: '66', nameAr: 'الأبيض سيدي الشيخ', nameFr: 'El Abiodh Sidi Cheikh', parentCode: '32', regulatorySource: 'Loi 26-06' },
    { code: '67', nameAr: 'شلغوم العيد', nameFr: 'Chelghoum Laïd', parentCode: '43', regulatorySource: 'Loi 26-06' },
    { code: '68', nameAr: 'أقبو', nameFr: 'Akbou', parentCode: '06', regulatorySource: 'Loi 26-06' },
    { code: '69', nameAr: 'مغنية', nameFr: 'Maghnia', parentCode: '13', regulatorySource: 'Loi 26-06' },
  ],
};

export const TERRITORIAL_REGISTRIES: Record<string, TerritorialRegistryVersion> = {
  '2019-58W': REGISTRY_58W,
  '2026-69W': REGISTRY_69W,
};

/**
 * Checks if a wilaya code is recognized in any active or supported territorial registry version.
 */
export function isRecognizedWilayaCode(code: string, versionId: string = '2026-69W'): boolean {
  if (!code || typeof code !== 'string') return false;
  const registry = TERRITORIAL_REGISTRIES[versionId] || REGISTRY_69W;
  return registry.units.some((u) => u.code === code);
}

/**
 * Gets the unit details for a wilaya code, resolving parent transitional mapping if applicable.
 */
export function getWilayaDetails(code: string, versionId: string = '2026-69W'): TerritorialUnit | null {
  const registry = TERRITORIAL_REGISTRIES[versionId] || REGISTRY_69W;
  const unit = registry.units.find((u) => u.code === code);
  return unit || null;
}
