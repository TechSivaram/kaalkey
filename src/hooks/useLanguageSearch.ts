import { useMemo } from "react";
import type { LanguageOption } from "../i18n/languages";

export function useLanguageSearch(search: string, languages: LanguageOption[]) {
  // Language metadata is static between manifest updates. Normalize it once so
  // each keystroke only normalizes the query and performs substring checks.
  const searchableLanguages = useMemo(
    () =>
      languages.map((item) => ({
        item,
        searchText:
          `${item.name} ${item.nativeName} ${item.code} ${item.searchTerms}`.toLocaleLowerCase(),
      })),
    [languages],
  );

  return useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return searchableLanguages.slice(0, 5).map(({ item }) => item);

    const matches: LanguageOption[] = [];
    for (const { item, searchText } of searchableLanguages) {
      if (searchText.includes(query)) matches.push(item);
    }
    return matches;
  }, [search, searchableLanguages]);
}
