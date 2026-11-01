/**
 * Territorial Reference for the People's Democratic Republic of Algeria
 * Multi-version registry supporting Law 19-12 (58 Wilayas) and extended provisions (Law 26-06 / 69 Wilayas).
 */
export interface TerritorialUnit {
    code: string;
    nameAr: string;
    nameFr: string;
    parentCode?: string;
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
export declare const REGISTRY_58W: TerritorialRegistryVersion;
export declare const COMMUNES_BY_WILAYA_CODE: Record<string, string[]>;
export declare const REGISTRY_69W: TerritorialRegistryVersion;
export declare const TERRITORIAL_REGISTRIES: Record<string, TerritorialRegistryVersion>;
/**
 * Checks if a wilaya code is recognized in any active or supported territorial registry version.
 */
export declare function isRecognizedWilayaCode(code: string, versionId?: string): boolean;
/**
 * Gets the unit details for a wilaya code, resolving parent transitional mapping if applicable.
 */
export declare function getWilayaDetails(code: string, versionId?: string): TerritorialUnit | null;
/**
 * Returns the list of communes belonging to a wilaya by its code or name.
 */
export declare function getCommunesForWilaya(wilayaQuery?: string): string[];
