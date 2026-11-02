import { useState } from "react";
import { useAppLanguage } from "../i18n";
import LanguageSelector from "./LanguageSelector";
export default function LegalLanguageTypeahead() {
  const { language, setLanguage, t, languages, languageLoading } = useAppLanguage();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const selectLanguage = (code: typeof language) => {
    setOpen(false);
    setSearch("");
    void setLanguage(code);
  };
  return (
    <LanguageSelector
      language={language}
      onSelect={selectLanguage}
      search={search}
      onSearchChange={setSearch}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      noResultsText={t("settings.language.noTranslatedLanguage")}
      placeholder={t("settings.language.searchLanguageName")}
      label={t("settings.language.name")}
      languages={languages}
      loading={languageLoading}
    />
  );
}
