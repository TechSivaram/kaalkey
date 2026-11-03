import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "./locales/en.json";
import { useCallback, useEffect, useState } from "react";
import { AppLanguage, ENGLISH_LANGUAGE, LanguageOption } from "./i18n/languages";
import { appFetch } from "./utils/appFetch";
import { beginGlobalActivity } from "./utils/globalActivity";

export type { AppLanguage, LanguageOption } from "./i18n/languages";
export { ENGLISH_LANGUAGE } from "./i18n/languages";

export const LANGUAGE_STORAGE_KEY = "kaalkey.language";
export const TRANSLATION_SERVER_STORAGE_KEY = "kaalkey.translation_server";
export const TRANSLATION_MANIFEST_CACHE_KEY = "kaalkey.translation_manifest";
export const TRANSLATION_CACHE_PREFIX = "kaalkey.translation.";

function cacheScope(serverUrl: string): string {
  return encodeURIComponent(normalizeServerUrl(serverUrl));
}

export const DEFAULT_TRANSLATION_SERVER_URL = "https://techsivaram.com/kaalkey/i18n";

type TranslationNode = string | { [key: string]: TranslationNode };
type TranslationDictionary = TranslationNode;

type RemoteLanguage = LanguageOption & {
  file?: string;
  url?: string;
};

type TranslationManifest = {
  languages: RemoteLanguage[];
};

const englishDictionary: TranslationDictionary = en as TranslationDictionary;
let remoteDictionaries: Record<string, TranslationDictionary> = {};
let languageOptions: LanguageOption[] = [ENGLISH_LANGUAGE];
let remoteLanguageMetadata: Record<string, RemoteLanguage> = {};

let currentLanguage: AppLanguage = "en";
let languageInitialized = false;
let languageSelectionMade = false;
let manifestLoaded = false;
let translationLoading = false;
let manifestLoading = false;

const languageListeners = new Set<(language: AppLanguage) => void>();
const stateListeners = new Set<() => void>();

function notifyState() {
  stateListeners.forEach((listener) => listener());
}

function publishLanguage(language: AppLanguage) {
  currentLanguage = languageOptions.some((item) => item.code === language) ? language : "en";
  languageListeners.forEach((listener) => listener(currentLanguage));
  notifyState();
}

function normalizeServerUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function manifestUrl(serverUrl: string): string {
  const normalized = normalizeServerUrl(serverUrl);
  return normalized.endsWith(".json") ? normalized : `${normalized}/manifest.json`;
}

function resolveTranslationUrl(serverUrl: string, language: RemoteLanguage): string {
  const base = `${normalizeServerUrl(serverUrl)}/`;
  const file = language.url || language.file || `${language.code}.json`;

  // Keep manifest paths such as "/te.json" inside the configured i18n folder.
  if (/^https?:\/\//i.test(file)) return file;
  return new URL(file.replace(/^\/+/, ""), base).toString();
}

function parseLanguageList(value: unknown): RemoteLanguage[] {
  if (Array.isArray(value)) return value.filter(isLanguage).map(normalizeLanguage);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.languages)) {
      return record.languages.filter(isLanguage).map(normalizeLanguage);
    }
    if (record.languages && typeof record.languages === "object") {
      return Object.entries(record.languages)
        .map(([code, metadata]) => {
          if (typeof metadata === "string") {
            return normalizeLanguage({
              code,
              name: code,
              nativeName: code,
              searchTerms: code,
              file: metadata,
            });
          }
          if (metadata && typeof metadata === "object") {
            const item = metadata as Record<string, unknown>;
            return normalizeLanguage({
              code,
              name: typeof item.name === "string" ? item.name : code,
              nativeName: typeof item.nativeName === "string" ? item.nativeName : code,
              searchTerms: typeof item.searchTerms === "string" ? item.searchTerms : code,
              ...(typeof item.file === "string" ? { file: item.file } : {}),
              ...(typeof item.url === "string" ? { url: item.url } : {}),
            });
          }
          return null;
        })
        .filter((item): item is RemoteLanguage => item !== null);
    }
  }
  return [];
}

function isLanguage(value: unknown): value is RemoteLanguage {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.code === "string" && item.code.trim().length > 0;
}

function normalizeLanguage(item: RemoteLanguage): RemoteLanguage {
  const code = item.code.trim();
  return {
    code,
    name: typeof item.name === "string" && item.name.trim() ? item.name : code,
    nativeName:
      typeof item.nativeName === "string" && item.nativeName.trim() ? item.nativeName : code,
    searchTerms:
      typeof item.searchTerms === "string"
        ? item.searchTerms
        : `${code} ${item.name ?? ""} ${item.nativeName ?? ""}`,
    ...(item.file ? { file: item.file } : {}),
    ...(item.url ? { url: item.url } : {}),
  };
}

function normalizeManifest(value: unknown): TranslationManifest {
  const languages = parseLanguageList(value);
  return { languages };
}

async function getStoredValue(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function setStoredValue(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

async function cacheTranslation(code: string, serverUrl: string, value: string): Promise<void> {
  await setStoredValue(`${TRANSLATION_CACHE_PREFIX}${cacheScope(serverUrl)}.${code}`, value);
}

function setLanguageOptions(remoteLanguages: RemoteLanguage[]) {
  remoteLanguageMetadata = Object.fromEntries(remoteLanguages.map((item) => [item.code, item]));
  languageOptions = [
    ENGLISH_LANGUAGE,
    ...remoteLanguages
      .filter((item) => item.code !== "en")
      .map(({ file: _file, url: _url, ...language }) => language),
  ];
  if (!languageOptions.some((item) => item.code === currentLanguage)) {
    currentLanguage = "en";
  }
  notifyState();
}

export function getLanguageOptions(): LanguageOption[] {
  return languageOptions;
}

export function isLanguageManifestLoading(): boolean {
  return manifestLoading;
}

export function isTranslationLoading(): boolean {
  return translationLoading;
}

export function getTranslationServerUrl(): string {
  return configuredServerUrl;
}

let configuredServerUrl = DEFAULT_TRANSLATION_SERVER_URL;

export function detectLanguage(): AppLanguage {
  const candidates = [
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().locale : "",
    (globalThis as any)?.navigator?.language ?? "",
  ];
  const candidate = candidates.find(Boolean)?.toLowerCase().split(/[-_]/)[0] ?? "en";
  return candidate || "en";
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

function findTranslation(dictionary: TranslationNode, key: string): string | undefined {
  let node: TranslationNode = dictionary;
  for (const part of key.split(".")) {
    if (typeof node === "string" || !(part in node)) return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

export function translate(
  language: AppLanguage,
  key: string,
  values?: Record<string, string | number>,
): string {
  const remote = language === "en" ? undefined : remoteDictionaries[language];
  const template =
    (remote ? findTranslation(remote, key) : undefined) ??
    findTranslation(englishDictionary, key) ??
    key;
  return values ? interpolateTemplate(template, values) : template;
}

export function getCurrentLanguage(): AppLanguage {
  return currentLanguage;
}

async function loadCachedManifest(serverUrl: string): Promise<TranslationManifest | null> {
  try {
    const cached = await getStoredValue(
      `${TRANSLATION_MANIFEST_CACHE_KEY}.${cacheScope(serverUrl)}`,
    );
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    return normalizeManifest(parsed);
  } catch {
    return null;
  }
}

async function fetchManifest(serverUrl: string): Promise<TranslationManifest> {
  const response = await appFetch(manifestUrl(serverUrl), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (response.ok) return normalizeManifest(await response.json());

  // Also accept a server URL that serves the manifest directly.
  const directResponse = await appFetch(normalizeServerUrl(serverUrl), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!directResponse.ok) {
    throw new Error(`Translation manifest request failed: ${response.status}`);
  }
  return normalizeManifest(await directResponse.json());
}

async function loadManifest(serverUrl: string): Promise<void> {
  const finishActivity = beginGlobalActivity(
    translate(currentLanguage, "activity.loadingLanguages"),
  );
  manifestLoading = true;
  notifyState();
  try {
    const cached = await loadCachedManifest(serverUrl);
    if (cached) {
      setLanguageOptions(cached.languages);
      manifestLoaded = true;
      if (!languageSelectionMade) {
        const detected = detectLanguage();
        if (detected !== "en" && languageOptions.some((item) => item.code === detected)) {
          await selectLanguage(detected);
        }
      }
    }

    const remote = await fetchManifest(serverUrl);
    await setStoredValue(
      `${TRANSLATION_MANIFEST_CACHE_KEY}.${cacheScope(serverUrl)}`,
      JSON.stringify(remote),
    );
    setLanguageOptions(remote.languages);
    manifestLoaded = true;

    if (!languageSelectionMade) {
      const detected = detectLanguage();
      if (detected !== "en" && languageOptions.some((item) => item.code === detected)) {
        await selectLanguage(detected);
      }
    }
  } catch (error) {
    console.warn("Could not load remote translation manifest.", error);
    manifestLoaded = Boolean(languageOptions.length);
  } finally {
    manifestLoading = false;
    notifyState();
    finishActivity();
  }
}

async function loadTranslation(language: AppLanguage): Promise<boolean> {
  if (language === "en") return true;
  const remoteLanguage = remoteLanguageMetadata[language];
  if (!remoteLanguage) return false;

  // Check AsyncStorage first. Cached translations should load without showing
  // the network activity overlay or making a remote request.
  const cacheKey = `${TRANSLATION_CACHE_PREFIX}${cacheScope(configuredServerUrl)}.${language}`;
  const cached = await getStoredValue(cacheKey);
  if (cached) {
    try {
      const dictionary = JSON.parse(cached);
      if (dictionary && typeof dictionary === "object" && !Array.isArray(dictionary)) {
        remoteDictionaries[language] = dictionary as TranslationDictionary;
        return true;
      }
    } catch {
      // Invalid cache: fetch a fresh copy below.
    }
  }

  // This state drives ActivityOverlayModal, blocking taps while the remote
  // dictionary is being downloaded so the user cannot repeatedly retry.
  const finishActivity = beginGlobalActivity(
    translate(currentLanguage, "activity.loadingTranslation"),
  );
  translationLoading = true;
  notifyState();
  try {
    const response = await appFetch(resolveTranslationUrl(configuredServerUrl, remoteLanguage), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Translation request failed: ${response.status}`);
    const dictionary = await response.json();
    if (!dictionary || typeof dictionary !== "object" || Array.isArray(dictionary)) {
      throw new Error("Invalid translation file");
    }

    remoteDictionaries[language] = dictionary as TranslationDictionary;
    await cacheTranslation(language, configuredServerUrl, JSON.stringify(dictionary));
    return true;
  } catch (error) {
    console.warn(`Could not load translation for ${language}.`, error);
    return false;
  } finally {
    // Keep the blocking overlay visible long enough to render even when the
    // static JSON responds very quickly; still cover fetch and cache writes.
    await new Promise((resolve) => setTimeout(resolve, 350));
    translationLoading = false;
    notifyState();
    finishActivity();
  }
}

async function selectLanguage(language: AppLanguage): Promise<void> {
  if (language !== "en" && !languageOptions.some((item) => item.code === language)) {
    publishLanguage("en");
    return;
  }

  if (language !== "en") {
    const loaded = await loadTranslation(language);
    if (!loaded) {
      publishLanguage("en");
      return;
    }
  }

  publishLanguage(language);
}

async function getSavedLanguage(): Promise<string | null> {
  return getStoredValue(LANGUAGE_STORAGE_KEY);
}

async function saveLanguage(language: AppLanguage) {
  await setStoredValue(LANGUAGE_STORAGE_KEY, language);
}

export async function setTranslationServerUrl(value: string): Promise<void> {
  const next = normalizeServerUrl(value);
  if (!next) return;

  configuredServerUrl = next;
  await setStoredValue(TRANSLATION_SERVER_STORAGE_KEY, next);

  // A server change invalidates the in-memory remote dictionaries and manifest.
  remoteDictionaries = {};
  remoteLanguageMetadata = {};
  languageOptions = [ENGLISH_LANGUAGE];
  manifestLoaded = false;
  notifyState();

  await loadManifest(next);
  if (currentLanguage !== "en") {
    const loaded = await loadTranslation(currentLanguage);
    if (!loaded) publishLanguage("en");
  }
}

export async function initializeTranslations(): Promise<void> {
  if (manifestLoaded || manifestLoading) return;
  configuredServerUrl =
    (await getStoredValue(TRANSLATION_SERVER_STORAGE_KEY)) || DEFAULT_TRANSLATION_SERVER_URL;

  const saved = await getSavedLanguage();
  if (!languageSelectionMade && saved && saved !== "en") {
    currentLanguage = saved;
  }

  await loadManifest(configuredServerUrl);
  if (!languageSelectionMade) {
    const selected =
      saved && languageOptions.some((item) => item.code === saved) ? saved : detectLanguage();
    if (selected !== "en") {
      await selectLanguage(selected);
    } else {
      publishLanguage("en");
    }
  }
}

export function useAppLanguage() {
  const [, forceUpdate] = useState(0);
  const [language, setLanguageState] = useState<AppLanguage>(currentLanguage);

  useEffect(() => {
    const onLanguage = (next: AppLanguage) => setLanguageState(next);
    const onState = () => forceUpdate((value) => value + 1);
    languageListeners.add(onLanguage);
    stateListeners.add(onState);

    if (!languageInitialized) {
      languageInitialized = true;
      void initializeTranslations().catch((error) => {
        console.warn("Could not initialize translations.", error);
        manifestLoading = false;
        translationLoading = false;
        publishLanguage("en");
      });
    }

    return () => {
      languageListeners.delete(onLanguage);
      stateListeners.delete(onState);
    };
  }, []);

  const setLanguage = useCallback(async (next: AppLanguage) => {
    languageSelectionMade = true;
    await selectLanguage(next);
    try {
      await saveLanguage(currentLanguage);
    } catch (error) {
      console.warn("Could not save the language preference.", error);
    }
  }, []);

  const updateServerUrl = useCallback(async (next: string) => {
    await setTranslationServerUrl(next);
  }, []);

  return {
    language,
    setLanguage,
    t: (key: string, values?: Record<string, string | number>) => translate(language, key, values),
    languages: languageOptions,
    languageLoading: manifestLoading,
    translationLoading,
    translationServerUrl: configuredServerUrl,
    setTranslationServerUrl: updateServerUrl,
  };
}
