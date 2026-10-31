import * as SecureStore from "expo-secure-store";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import te from "./locales/te.json";
import { useCallback, useEffect, useState } from "react";

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
export const LANGUAGE_STORAGE_KEY = "kaalkey.language";
export const LANGUAGE_NAMES: Record<AppLanguage, string> = {
  en: "English",
  te: "తెలుగు",
  hi: "हिन्दी",
};

type TranslationNode = string | { [key: string]: TranslationNode };

const dictionaries: Record<AppLanguage, TranslationNode> = { en, hi, te };

function findTranslation(dictionary: TranslationNode, key: string): string | undefined {
  let node: TranslationNode = dictionary;
  for (const part of key.split(".")) {
    if (typeof node === "string" || !(part in node)) return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

export function detectLanguage(): AppLanguage {
  const candidates = [
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().locale : "",
    (globalThis as any)?.navigator?.language ?? "",
  ];
  for (const candidate of candidates) {
    const code = candidate.toLowerCase().split(/[-_]/)[0];
    if (code === "te" || code === "hi" || code === "en") return code;
  }
  return "en";
}

export function interpolateTemplate(
  template: string,
  values: Record<string, string | number> = {},
) {
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (_, key: string) => {
    const value = values[key];
    return value === undefined || value === null ? `{${key}}` : String(value);
  });
}

export function translate(
  language: AppLanguage,
  key: string,
  values?: Record<string, string | number>,
): string {
  const template =
    findTranslation(dictionaries[language], key) ?? findTranslation(dictionaries.en, key) ?? key;
  return values ? interpolateTemplate(template, values) : template;
}

let currentLanguage: AppLanguage = detectLanguage();
export function getCurrentLanguage(): AppLanguage {
  return currentLanguage;
}
let languageInitialized = false;
let languageSelectionMade = false;
const languageListeners = new Set<(language: AppLanguage) => void>();

function publishLanguage(language: AppLanguage) {
  currentLanguage = language;
  languageListeners.forEach((listener) => listener(language));
}

function getSavedLanguage() {
  return typeof window === "undefined"
    ? SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY)
    : Promise.resolve(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
}

function saveLanguage(language: AppLanguage) {
  if (typeof window === "undefined") {
    return SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, language);
  }
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  return Promise.resolve();
}

export function useAppLanguage() {
  const [language, setLanguageState] = useState<AppLanguage>(currentLanguage);

  useEffect(() => {
    const listener = (next: AppLanguage) => setLanguageState(next);
    languageListeners.add(listener);
    if (!languageInitialized) {
      languageInitialized = true;
      getSavedLanguage()
        .then((saved) => {
          if (!languageSelectionMade && (saved === "en" || saved === "te" || saved === "hi")) {
            publishLanguage(saved);
          }
        })
        .catch((error) => {
          console.warn("Could not load the saved language preference.", error);
        });
    }
    return () => {
      languageListeners.delete(listener);
    };
  }, []);

  const setLanguage = useCallback(async (next: AppLanguage) => {
    languageSelectionMade = true;
    publishLanguage(next);
    try {
      await saveLanguage(next);
    } catch (error) {
      console.warn("Could not save the language preference.", error);
    }
  }, []);

  return { language, setLanguage, t: (key: string) => translate(language, key) };
}
