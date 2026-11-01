export type AppLanguage = "en" | "te" | "hi";

export type LanguageOption = {
  code: AppLanguage;
  name: string;
  nativeName: string;
  searchTerms: string;
};

// Only languages with bundled, reviewed UI translations are selectable.
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", searchTerms: "english en" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", searchTerms: "telugu te తెలుగు" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", searchTerms: "hindi hi हिंदी हिन्दी" },
];

export const LANGUAGE_NAMES: Record<AppLanguage, string> = {
  en: "English",
  te: "తెలుగు",
  hi: "हिन्दी",
};
