import { Map } from "algeria-map-ts";

// قائمة الـ 58 ولاية الجزائرية بالترتيب الرسمي
const ALL_58_WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar", "Blida", "Bouira",
  "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda",
  "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara",
  "Ouargla", "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt",
  "El Oued", "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent", "Ghardaïa",
  "Relizane", "Timimoun", "Bordj Badji Mokhtar", "Ouled Djellal", "Béni Abbès", "In Salah", "In Guezzam",
  "Touggourt", "Djanet", "El M'Ghair", "El Menia"
];

// بيانات الولايات (يمكن ربطها بـ API لاحقاً)
// الولايات الرئيسية فقط (10) + الباقي افتراضي
const majorWilayas: Record<string, { value: number; color: string; alt?: string }> = {
  // الولايات الكبرى (ألوان الأخضر الرسمي متدرجة)
  Alger:       { value: 234, color: "#1B4332" },  // الأكثر صفقات
  Oran:        { value: 180, color: "#2D6A4F" },
  Constantine: { value: 145, color: "#40916C" },
  Annaba:      { value: 98,  color: "#52B788" },
  Setif:       { value: 87,  color: "#52B788", alt: "Sétif" },
  Blida:       { value: 76,  color: "#74C69D" },
  Tlemcen:     { value: 65,  color: "#74C69D" },
  Batna:       { value: 54,  color: "#95D5B2" },
  Bejaia:      { value: 43,  color: "#95D5B2", alt: "Béjaïa" },
  Ouargla:     { value: 32,  color: "#B7E4C7" },
};

// بناء كائن البيانات متوافق مع algeria-map-ts ومع صيغة record[wilaya]?.value
const wilayaData: Record<string, any> = {};

// 1. إضافة الولايات الرئيسية
Object.entries(majorWilayas).forEach(([wilaya, item]) => {
  const entry = {
    [wilaya]: { value: item.value },
    value: item.value,
    color: item.color,
  };
  wilayaData[wilaya] = entry;
  if (item.alt) {
    wilayaData[item.alt] = {
      [item.alt]: { value: item.value },
      [wilaya]: { value: item.value },
      value: item.value,
      color: item.color,
    };
  }
});

// 2. باقي الولايات (بدون color لتأخذ اللون الافتراضي الرمادي #D4DCE4)
ALL_58_WILAYAS.forEach((w) => {
  if (!wilayaData[w]) {
    wilayaData[w] = {
      [w]: { value: 15 },
      value: 15,
    };
  }
});

interface Props {
  height?: string;
  width?: string;
  onWilayaClick?: (wilaya: string, value: number | string) => void;
}

export default function AlgeriaMap({
  height = "100%",
  width = "100%",
  onWilayaClick,
}: Props) {
  return (
    <div className="algeria-map-container w-full h-full flex items-center justify-center">
      <Map
        // الألوان الافتراضية (Official Ledger)
        color="#D4DCE4"           // رمادي فاتح للولايات بدون بيانات
        HoverColor="#B8860B"      // ذهبي رسمي عند hover
        stroke="#FFFFFF"          // حدود بيضاء
        hoverStroke="#1B4332"     // حدود خضراء داكنة عند hover
        // الأبعاد
        height={height}
        width={width}
        // البيانات
        data={wilayaData}
        // الأحداث
        onWilayaClick={(wilaya, value) => {
          console.log(`Wilaya: ${wilaya}, Value: ${value}`);
          onWilayaClick?.(wilaya, value);
        }}
        // محتوى tooltip عند hover
        getHoverContent={(record) => {
          if (!record) return "";
          const wilaya = Object.keys(record)[0];
          const value = record[wilaya]?.value ?? record.value;
          return value ? `${wilaya}: ${value} صفقة` : wilaya;
        }}
        hoverContentStyle={{
          background: "#0A2540",
          color: "#FFFFFF",
          padding: "6px 10px",
          borderRadius: "4px",
          fontSize: "12px",
          fontFamily: "'IBM Plex Mono', monospace",
          width: "auto",
          height: "auto",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          boxShadow: "0 2px 8px rgba(10, 37, 64, 0.25)",
          zIndex: 9999,
        }}
      />
    </div>
  );
}
