import { useMemo } from "react";
import type { LanguageOption } from "../i18n/languages";

export function useLanguageSearch(search: string, languages: LanguageOption[]) {
  return useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return languages.slice(0, 5);
    return languages.filter((item) =>
      `${item.name} ${item.nativeName} ${item.code} ${item.searchTerms}`
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [search, languages]);
}
