export type Lang = "en" | "es";

export const LOCALE_BY_REGION: Record<string, { lang: Lang; label: string }> = {
  "São Paulo": { lang: "es", label: "Portuguese/Spanish region" },
  "Mexico": { lang: "es", label: "Spanish" },
  "Madrid": { lang: "es", label: "Spanish" },
  "Barcelona": { lang: "es", label: "Spanish" },
  "Buenos Aires": { lang: "es", label: "Spanish" },
  "Lagos": { lang: "en", label: "English" },
};

export function detectLocaleForSector(name: string, lat: number, lng: number): Lang | null {
  const lower = name.toLowerCase();
  if (
    lower.includes("mexico") ||
    lower.includes("spain") ||
    lower.includes("madrid") ||
    lower.includes("barcelona") ||
    lower.includes("buenos aires") ||
    lower.includes("bogot") ||
    lower.includes("lima") ||
    lower.includes("santiago") ||
    (lat > -56 && lat < 32 && lng > -120 && lng < -30) // Latin America rough
  ) {
    return "es";
  }
  if (lower.includes("paris")) {
    return null;
  }
  return null;
}

export const strings: Record<Lang, Record<string, string>> = {
  en: {
    terrain: "TERRAIN",
    deploy: "DEPLOY",
    priority: "PRIORITY",
    intel: "INTEL",
    confirm: "Confirm — I See This Too",
    elevate: "Community Elevate",
    raisePriority: "Raise Priority",
    addMedia: "Deploy Field Camera",
    streetView: "Street Recon",
    continueEnglish: "Continue in English",
    switchSpanish: "Switch to Spanish",
  },
  es: {
    terrain: "TERRENO",
    deploy: "DESPLEGAR",
    priority: "PRIORIDAD",
    intel: "INTEL",
    confirm: "Confirmar — Yo También Lo Veo",
    elevate: "Elevar Comunidad",
    raisePriority: "Subir Prioridad",
    addMedia: "Desplegar Cámara de Campo",
    streetView: "Reconocimiento de Calle",
    continueEnglish: "Continuar en Inglés",
    switchSpanish: "Cambiar a Español",
  },
};

export function t(lang: Lang, key: string): string {
  return strings[lang][key] || strings.en[key] || key;
}
