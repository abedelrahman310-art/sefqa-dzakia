import { useMemo } from "react";
import { Map as AlgeriaSvgMap } from "algeria-map-ts";
import { ALGERIA_69_WILAYAS } from "@/lib/wilayas";

export interface WilayaDataPoint {
  value: number;
  color?: string;
  budget?: number;
  warnings?: number;
  name?: string;
  code?: string;
  [key: string]: any;
}

export interface AlgeriaMapProps {
  data?: Record<string, WilayaDataPoint>;
  colorMode?: 'default' | 'heatmap';
  onWilayaClick?: (wilaya: string, value: any) => void;
  onWilayaHover?: (wilaya: string | null) => void;
  height?: string;
  width?: string;
}

// 58 geographic wilayas supported directly in algeria-map-ts SVG
const ALL_58_WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar", "Blida", "Bouira",
  "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda",
  "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara",
  "Ouargla", "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt",
  "El Oued", "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent", "Ghardaïa",
  "Relizane", "Timimoun", "Bordj Badji Mokhtar", "Ouled Djellal", "Béni Abbès", "In Salah", "In Guezzam",
  "Touggourt", "Djanet", "El M'Ghair", "El Menia"
];

// Helper to calculate heatmap color from activity value & warning flags
export function getHeatmapColor(value: number, warnings = 0): string {
  if (warnings > 0) return "#B02A2A"; // ⚠️ شبهات مرصودة
  if (value >= 50) return "#1B4332";  // نشاط عالٍ (الأخضر الرسمي الداكن)
  if (value >= 20) return "#2D6A4F";  // نشاط متوسط
  if (value >= 5) return "#74C69D";   // نشاط منخفض
  return "#D4DCE4";                   // لا نشاط (رمادي فاتح)
}

// Default major wilayas for landing page when no data prop is supplied
const defaultMajorWilayas: Record<string, { value: number; color: string; alt?: string }> = {
  Alger:       { value: 234, color: "#1B4332" },
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

export default function AlgeriaMap({
  data,
  colorMode = 'default',
  height = "100%",
  width = "100%",
  onWilayaClick,
  onWilayaHover,
}: AlgeriaMapProps) {

  // Normalization maps between code, Arabic name, French name, and alternate spellings
  const wilayaLookup = useMemo(() => {
    const byFr = new Map<string, (typeof ALGERIA_69_WILAYAS)[0]>();
    const byAr = new Map<string, (typeof ALGERIA_69_WILAYAS)[0]>();
    const byCode = new Map<string, (typeof ALGERIA_69_WILAYAS)[0]>();

    ALGERIA_69_WILAYAS.forEach((item) => {
      byFr.set(item.fr.toLowerCase(), item);
      byAr.set(item.ar, item);
      byCode.set(item.code, item);
      byCode.set(String(parseInt(item.code, 10)), item);
    });

    return { byFr, byAr, byCode };
  }, []);

  // Prepare normalized data object for algeria-map-ts
  const computedMapData = useMemo(() => {
    const result: Record<string, any> = {};

    if (!data) {
      // Fallback: Default landing presentation
      Object.entries(defaultMajorWilayas).forEach(([wilaya, item]) => {
        result[wilaya] = {
          [wilaya]: { value: item.value },
          value: item.value,
          color: item.color,
        };
        if (item.alt) {
          result[item.alt] = {
            [item.alt]: { value: item.value },
            value: item.value,
            color: item.color,
          };
        }
      });

      ALL_58_WILAYAS.forEach((w) => {
        if (!result[w]) {
          result[w] = { [w]: { value: 15 }, value: 15 };
        }
      });

      return result;
    }

    // When external data is provided (e.g. heatmap mode)
    ALL_58_WILAYAS.forEach((wilayaFr) => {
      // Find matching item in lookup
      const baseMeta =
        wilayaLookup.byFr.get(wilayaFr.toLowerCase()) ||
        wilayaLookup.byFr.get(
          wilayaFr
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
        );

      // Match in user-provided data by code, French name, or Arabic name
      let point: WilayaDataPoint | undefined;
      if (baseMeta) {
        point =
          data[baseMeta.code] ||
          data[String(parseInt(baseMeta.code, 10))] ||
          data[baseMeta.fr] ||
          data[baseMeta.ar];
      }
      if (!point) {
        point = data[wilayaFr];
      }

      const val = point?.value ?? 0;
      const warnings = point?.warnings ?? 0;
      const budget = point?.budget ?? 0;
      const arName = point?.name || baseMeta?.ar || wilayaFr;
      const code = point?.code || baseMeta?.code || "";

      let resolvedColor: string | undefined = point?.color;
      if (colorMode === 'heatmap') {
        resolvedColor = point?.color || getHeatmapColor(val, warnings);
      }

      const entry = {
        [wilayaFr]: { value: val },
        value: val,
        color: resolvedColor,
        budget,
        warnings,
        name: arName,
        code,
        nameFr: wilayaFr,
      };

      result[wilayaFr] = entry;

      // Handle common accent variations
      const unaccented = wilayaFr
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (unaccented !== wilayaFr) {
        result[unaccented] = entry;
      }
    });

    return result;
  }, [data, colorMode, wilayaLookup]);

  return (
    <div
      className="algeria-map-container w-full h-full flex items-center justify-center relative select-none"
      onMouseLeave={() => onWilayaHover?.(null)}
    >
      <style>{`
        .algeria-map-container svg {
          filter: drop-shadow(0 12px 24px rgba(11, 26, 43, 0.08));
          max-height: 92vh;
          transition: transform 0.3s ease;
        }
        .algeria-map-container .state {
          transition: fill 0.25s ease, stroke 0.25s ease, filter 0.25s ease, transform 0.25s ease;
          cursor: pointer;
        }
        .algeria-map-container .state:hover {
          filter: brightness(1.12) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.25));
        }
      `}</style>

      <AlgeriaSvgMap
        // الألوان الافتراضية
        color="#D4DCE4"
        HoverColor={colorMode === 'heatmap' ? "#B8860B" : "#B8860B"}
        stroke="#FFFFFF"
        hoverStroke="#0B1A2B"
        // الأبعاد
        height={height}
        width={width}
        // البيانات
        data={computedMapData}
        // الأحداث
        onWilayaClick={(wilaya, value) => {
          const entry = computedMapData[wilaya] || {};
          const baseMeta =
            wilayaLookup.byFr.get(wilaya.toLowerCase()) ||
            wilayaLookup.byFr.get(
              wilaya
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
            );

          const richDetails = {
            code: entry.code || baseMeta?.code || "00",
            name: entry.name || baseMeta?.ar || wilaya,
            nameFr: entry.nameFr || wilaya,
            tenders_count: typeof value === 'number' ? value : Number(entry.value || 0),
            budget: Number(entry.budget || 0),
            warnings: Number(entry.warnings || 0),
          };

          onWilayaClick?.(wilaya, richDetails);
        }}
        // محتوى tooltip عند hover
        getHoverContent={(record) => {
          if (!record) {
            onWilayaHover?.(null);
            return "";
          }
          const wilayaKey = Object.keys(record)[0] || "";
          const entry = record[wilayaKey] ?? record;
          const val = entry?.value ?? record.value ?? 0;
          const budget = record.budget;
          const warnings = record.warnings;
          const nameAr = record.name || wilayaKey;

          onWilayaHover?.(nameAr);

          let tooltip = `<div dir="rtl" style="font-family: 'Cairo', sans-serif; text-align: right;">`;
          tooltip += `<div style="font-weight: 700; font-size: 13px; color: #FFD166; margin-bottom: 2px;">${nameAr} (${wilayaKey})</div>`;
          tooltip += `<div style="font-size: 11px; opacity: 0.95;">الصفقات: <strong>${val}</strong></div>`;
          if (budget !== undefined && budget > 0) {
            tooltip += `<div style="font-size: 11px; opacity: 0.95;">الميزانية: <strong>${budget} مليار دج</strong></div>`;
          }
          if (warnings !== undefined && warnings > 0) {
            tooltip += `<div style="font-size: 11px; color: #FF6B6B; font-weight: 600; margin-top: 2px;">⚠️ ${warnings} شبهات مرصودة</div>`;
          }
          tooltip += `</div>`;
          return tooltip;
        }}
        hoverContentStyle={{
          background: "rgba(11, 26, 43, 0.96)",
          backdropFilter: "blur(8px)",
          color: "#FFFFFF",
          padding: "8px 12px",
          borderRadius: "8px",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          fontSize: "12px",
          fontFamily: "'Cairo', sans-serif",
          width: "auto",
          height: "auto",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          boxShadow: "0 8px 24px rgba(11, 26, 43, 0.35)",
          zIndex: 9999,
        }}
      />
    </div>
  );
}
