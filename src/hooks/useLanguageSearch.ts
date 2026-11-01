import { useMemo } from "react";
import { SUPPORTED_LANGUAGES } from "../i18n/languages";
export function useLanguageSearch(search: string) {
  return useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return SUPPORTED_LANGUAGES.slice(0, 5);
    return SUPPORTED_LANGUAGES.filter((item) =>
      `${item.name} ${item.nativeName} ${item.code} ${item.searchTerms}`
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [search]);
}
