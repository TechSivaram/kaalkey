export type AppLanguage = string;

export type LanguageOption = {
  code: AppLanguage;
  name: string;
  nativeName: string;
  searchTerms: string;
};

export const ENGLISH_LANGUAGE: LanguageOption = {
  code: "en",
  name: "English",
  nativeName: "English",
  searchTerms: "english en",
};
