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
  communes?: string[];
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

export const COMMUNES_BY_WILAYA_CODE: Record<string, string[]> = {
  '01': ['أدرار', 'تمنطيط', 'زاوية كنتة', 'فنوغيل', 'بودة', 'أولاد أحمد تيمي', 'تسابيت', 'رقان', 'أولف', 'طلمين', 'أنزجمير'],
  '02': ['الشلف', 'وادي الفضة', 'بوقادير', 'تنس', 'عين مران', 'تاوقريت', 'سيدي عكاشة', 'بني حواء', 'أولاد فارس', 'الزبوجة'],
  '03': ['الأغواط', 'قصر الحيران', 'سيدي مخلوف', 'عين ماضي', 'حاسي الرمل', 'الخنق', 'تاجموت', 'بريدة', 'بن ناصر بن شهرة'],
  '04': ['أم البواقي', 'عين البيضاء', 'عين مليلة', 'عين فكرون', 'مسكيانة', 'سيقوس', 'سوق نعمان', 'بريش', 'الضلعة'],
  '05': ['باتنة', 'عين التوتة', 'مروانة', 'آريس', 'نقاوس', 'سريانة', 'تازولت', 'الشمرة', 'المعذر', 'ثنية العابد'],
  '06': ['بجاية', 'أميزور', 'سيدي عيش', 'أوقاس', 'خراطة', 'القصر', 'درقينة', 'تيشي', 'سوق الإثنين', 'برباشة', 'شميني'],
  '07': ['بسكرة', 'طولقة', 'سيدي عقبة', 'زريبة الوادي', 'جمورة', 'ليشانة', 'مشونش', 'عين زعطوط', 'فوغالة'],
  '08': ['بشار', 'القنادسة', 'تاغيت', 'العبادلة', 'تبلبالة', 'عرق فراج', 'المريجة', 'مشرع هواري بومدين'],
  '09': ['البليدة', 'بوفاريك', 'موزاية', 'أولاد يعيش', 'بوعرفة', 'بني مراد', 'وادي العلايق', 'العفرون', 'الشبلي', 'حمام ملوان'],
  '10': ['البويرة', 'الأخضرية', 'سور الغزلان', 'عين بسام', 'مشدالة', 'القادرية', 'برج أوخريص', 'بشلول', 'الهاشمية'],
  '11': ['تمنراست', 'أبالسة', 'إيدلس', 'تازروك'],
  '12': ['تبسة', 'الشريعة', 'الونزة', 'العوينات', 'مرسط', 'بئر مقدم', 'بكارية', 'الكويف', 'نقرين'],
  '13': ['تلمسان', 'المنصورة', 'سبدو', 'الغزوات', 'الرمشي', 'الحناية', 'بني سنوس', 'ندرومة', 'شتوان', 'أولاد ميمون'],
  '14': ['تيارت', 'السوقر', 'مهدية', 'الدحموني', 'وادي ليلي', 'فرندة', 'عين كرمس', 'السبعين'],
  '15': ['تيزي وزو', 'تيزي غنيف', 'دراع الميزان', 'واضية', 'عزازقة', 'تيقزيرت', 'الأربعاء نايث إيراثن', 'عين الحمام', 'ذراع بن خدة'],
  '16': ['الجزائر الوسطى', 'سيدي امحمد', 'باب الوادي', 'القصبة', 'المدنية', 'بئر مراد رايس', 'حيدرة', 'بن عكنون', 'بوزريعة', 'الأبيار', 'القبة', 'بئر خادم', 'دالي ابراهيم', 'الشراقة', 'زرالدة', 'سطاوالي', 'عين البنيان', 'الرويبة', 'الرغاية', 'برج البحري', 'برج الكيفان', 'الدار البيضاء', 'باب الزوار', 'براقي', 'الحراش', 'باش جراح', 'العاشور', 'درارية', 'المحمدية'],
  '17': ['الجلفة', 'حاسي بحبح', 'الإدريسية', 'دار الشيوخ', 'سيدي بايزيد', 'الشارف', 'البيرين', 'حاسي فدول', 'عين معبد'],
  '18': ['جيجل', 'الطاهير', 'الميلية', 'العوانة', 'زيامة منصورية', 'العنصر', 'سيدي عبد العزيز', 'الشقفة', 'القنار نشفي'],
  '19': ['سطيف', 'عين أرنات', 'عين ولمان', 'بوقاعة', 'بني عزيز', 'عين الكبيرة', 'جميلة', 'قجال', 'حمام قرقور'],
  '20': ['سعيدة', 'الحساسنة', 'يوب', 'أولاد إبراهيم', 'سيدي بوبكر', 'عين الحجر', 'معمورة'],
  '21': ['سكيكدة', 'الحروش', 'القل', 'عزابة', 'تمالوس', 'بن عزوز', 'رمضان جمال', 'سيدي مزغيش', 'فلفلة'],
  '22': ['سيدي بلعباس', 'تلاغ', 'بن باديس', 'سفيزف', 'سيدي علي بن يوب', 'رأس الماء', 'عين البرد', 'تنيرة'],
  '23': ['عنابة', 'البوني', 'الحجار', 'برحال', 'عين الباردة', 'سرايدي', 'شطايبي', 'وادي العنب'],
  '24': ['قالمة', 'وادي الزناتي', 'بوشقوف', 'هليوبوليس', 'حمام دباغ', 'بلخير', 'قلعة بوصبع', 'بوحشانة'],
  '25': ['قسنطينة', 'الخروب', 'عين سمارة', 'ديدوش مراد', 'حامة بوزيان', 'زيغود يوسف', 'ابن باديس', 'مسعود بوجريو'],
  '26': ['المدية', 'وزرة', 'البرواقية', 'تابلاط', 'بني سليمان', 'سي المحجوب', 'الشهبونية', 'أولاد عنتر'],
  '27': ['مستغانم', 'عين تادلس', 'حاسي مماش', 'مزغران', 'سيدي علي', 'بوقيرات', 'خير الدين', 'عشعاشة', 'ماسرى'],
  '28': ['المسيلة', 'سيدي عيسى', 'مقرة', 'أولاد دراج', 'بن سرور', 'عين الملح', 'حمام الضلعة', 'أولاد سيدي إبراهيم'],
  '29': ['معسكر', 'سيق', 'المحمدية', 'تغنيف', 'غريس', 'وادي الأبطال', 'عين فكان', 'زهانة'],
  '30': ['ورقلة', 'حاسي مسعود', 'سيدي خويلد', 'الرويسات', 'عين البيضاء', 'النقر', 'الحجيرة'],
  '31': ['وهران', 'بئر الجير', 'السانية', 'أرزيو', 'بطيوة', 'عين الترك', 'قديل', 'بوتليليس', 'مسرغين', 'الكرمة'],
  '32': ['البيض', 'بريزينة', 'الرقاصة', 'بوقطب', 'الشلالة', 'الكاف لحمر', 'المحرة'],
  '33': ['إليزي', 'إينات', 'برج الحواس', 'الدبداب'],
  '34': ['برج بوعريريج', 'رأس الوادي', 'منصورة', 'مجانة', 'الياشير', 'برج غدير', 'خليل', 'الحمادية'],
  '35': ['بومرداس', 'قورصو', 'الثنية', 'برج منايل', 'دلس', 'يسر', 'خميس الخشنة', 'بودواو', 'الأربعطاش', 'سي مصطفى'],
  '36': ['الطارف', 'القالة', 'بوثلجة', 'بن مهيدي', 'الذرعان', 'البسباس', 'العيون', 'الشط'],
  '37': ['تندوف', 'أم العسل'],
  '38': ['تيسمسيلت', 'ثنية الحد', 'برج بونعامة', 'لرجام', 'خميستي', 'عماري'],
  '39': ['الوادي', 'قمار', 'الدبيلة', 'البياضة', 'حاسي خليفة', 'الرباح', 'الرقيبة', 'كوينين'],
  '40': ['خنشلة', 'ششار', 'قايس', 'بابار', 'أولاد رشاش', 'عين الطويلة', 'المحمل'],
  '41': ['سوق أهراس', 'سدراتة', 'مداوروش', 'تاورة', 'المشروحة', 'المراهنة', 'الخضارة'],
  '42': ['تيبازة', 'شرشال', 'القليعة', 'حطاطبة', 'بواسماعيل', 'فوكة', 'الداموس', 'قوراية', 'حجوط', 'سيدي راشد'],
  '43': ['ميلة', 'فرجيوة', 'القرارم قوقة', 'سيدي مروان', 'تلاغمة', 'وادي النجاء', 'بوحاتم', 'زغاية'],
  '44': ['عين الدفلى', 'خميس مليانة', 'مليانة', 'العطاف', 'جندل', 'العبادية', 'جليدة', 'الروينة'],
  '45': ['النعامة', 'مشرية', 'عسلة', 'تيوت', 'مغرار', 'صفيصيفة', 'جنين بورزق'],
  '46': ['عين تموشنت', 'بني صاف', 'حمام بوحجر', 'العامرية', 'عين الكيحل', 'المالح', 'وادي الصباح'],
  '47': ['غرداية', 'متليلي', 'بني يزقن', 'العطف', 'القرارة', 'بريان', 'الضاية بن ضحوة'],
  '48': ['غليزان', 'وادي ارهيو', 'مازونة', 'عمي موسى', 'يلل', 'جديوية', 'زمورة', 'منداس'],
  '49': ['تيميمون', 'أوقروت', 'شروين', 'طلمين', 'أولاد سعيد', 'قصر قدور'],
  '50': ['برج باجي مختار', 'تيمياوين'],
  '51': ['أولاد جلال', 'سيدي خالد', 'البسباس', 'رأس الميعاد', 'الشعيبة'],
  '52': ['بني عباس', 'تبلبالة', 'الواتة', 'كرزاز', 'إقلي', 'أولاد خضير'],
  '53': ['عين صالح', 'فقارة الزوى', 'إين غار'],
  '54': ['عين قزام', 'تين زواتين'],
  '55': ['تقرت', 'النزلة', 'تماسين', 'الطيبات', 'المقارين', 'بلدة عمر', 'زاوية العابدية'],
  '56': ['جانت', 'برج الحواس'],
  '57': ['المغير', 'جامعة', 'سيدي عمران', 'أم الطيور', 'تندلة'],
  '58': ['المنيعة', 'حاسي القارة', 'حاسي الفحل'],
  '59': ['أفلو', 'الغيشة', 'تاويالة', 'سيدي بوزيد', 'واد مرة', 'سبقاق'],
  '60': ['بريكة', 'أمدوكال', 'بيطام', 'سفيان', 'الجزار'],
  '61': ['قصر الشلالة', 'سرغين', 'زمالة الأمير عبد القادر'],
  '62': ['عين وسارة', 'حاسي فدول', 'البيرين', 'بنهار'],
  '63': ['مسعد', 'فيض البطمة', 'عمورة', 'سد رحال', 'قطارة'],
  '64': ['العلمة', 'بازر سكرة', 'القلتة الزرقاء', 'بيضاء برج'],
  '65': ['بوسعادة', 'الهامل', 'بن سرور', 'أولاد سيدي إبراهيم', 'المعاريف'],
  '66': ['الأبيض سيدي الشيخ', 'بريزينة', 'أربوات', 'عين العراك'],
  '67': ['شلغوم العيد', 'تاجنانت', 'وادي العثمانية'],
  '68': ['أقبو', 'صدوق', 'إغيل علي', 'تازمالت'],
  '69': ['مغنية', 'صبرة', 'بني بوسعيد', 'السواني'],
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
    ...REGISTRY_58W.units.map((u) => ({
      ...u,
      communes: COMMUNES_BY_WILAYA_CODE[u.code] || [],
    })),
    { code: '59', nameAr: 'أفلو', nameFr: 'Aflou', parentCode: '03', regulatorySource: 'Loi 26-06', communes: COMMUNES_BY_WILAYA_CODE['59'] || [] },
    { code: '60', nameAr: 'بريكة', nameFr: 'Barika', parentCode: '05', regulatorySource: 'Loi 26-06', communes: COMMUNES_BY_WILAYA_CODE['60'] || [] },
    { code: '61', nameAr: 'قصر الشلالة', nameFr: 'Ksar Chellala', parentCode: '14', regulatorySource: 'Loi 26-06', communes: COMMUNES_BY_WILAYA_CODE['61'] || [] },
    { code: '62', nameAr: 'عين وسارة', nameFr: 'Aïn Oussera', parentCode: '17', regulatorySource: 'Loi 26-06', communes: COMMUNES_BY_WILAYA_CODE['62'] || [] },
    { code: '63', nameAr: 'مسعد', nameFr: 'Messaad', parentCode: '17', regulatorySource: 'Loi 26-06', communes: COMMUNES_BY_WILAYA_CODE['63'] || [] },
    { code: '64', nameAr: 'العلمة', nameFr: 'El Eulma', parentCode: '19', regulatorySource: 'Loi 26-06', communes: COMMUNES_BY_WILAYA_CODE['64'] || [] },
    { code: '65', nameAr: 'بوسعادة', nameFr: 'Bou Saâda', parentCode: '28', regulatorySource: 'Loi 26-06', communes: COMMUNES_BY_WILAYA_CODE['65'] || [] },
    { code: '66', nameAr: 'الأبيض سيدي الشيخ', nameFr: 'El Abiodh Sidi Cheikh', parentCode: '32', regulatorySource: 'Loi 26-06', communes: COMMUNES_BY_WILAYA_CODE['66'] || [] },
    { code: '67', nameAr: 'شلغوم العيد', nameFr: 'Chelghoum Laïd', parentCode: '43', regulatorySource: 'Loi 26-06', communes: COMMUNES_BY_WILAYA_CODE['67'] || [] },
    { code: '68', nameAr: 'أقبو', nameFr: 'Akbou', parentCode: '06', regulatorySource: 'Loi 26-06', communes: COMMUNES_BY_WILAYA_CODE['68'] || [] },
    { code: '69', nameAr: 'مغنية', nameFr: 'Maghnia', parentCode: '13', regulatorySource: 'Loi 26-06', communes: COMMUNES_BY_WILAYA_CODE['69'] || [] },
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

/**
 * Returns the list of communes belonging to a wilaya by its code or name.
 */
export function getCommunesForWilaya(wilayaQuery?: string): string[] {
  if (!wilayaQuery || typeof wilayaQuery !== 'string') return [];
  const trimmed = wilayaQuery.trim();
  const normalized = trimmed.toLowerCase();

  // Try direct code match
  if (COMMUNES_BY_WILAYA_CODE[trimmed]) {
    return COMMUNES_BY_WILAYA_CODE[trimmed];
  }

  // Try unit search in REGISTRY_69W
  const unit = REGISTRY_69W.units.find(
    (u) =>
      u.code === trimmed ||
      u.nameAr === trimmed ||
      u.nameFr.toLowerCase() === normalized
  );

  if (unit && unit.communes && unit.communes.length > 0) {
    return unit.communes;
  }

  return [];
}
