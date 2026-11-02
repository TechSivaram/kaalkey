import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { AppLanguage, LanguageOption as LanguageOptionType } from "../i18n/languages";
import { translate } from "../i18n";
import { useLanguageSearch } from "../hooks/useLanguageSearch";
import LanguageOption from "./LanguageOption";
import { languageSelectorStyles as s } from "./language-selector.styles";

type Props = {
  language: AppLanguage;
  onSelect: (language: AppLanguage) => void;
  search: string;
  onSearchChange: (value: string) => void;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  noResultsText: string;
  placeholder: string;
  label: string;
  languages: LanguageOptionType[];
  loading?: boolean;
};

export default function LanguageSelector(p: Props) {
  const [inputBottom, setInputBottom] = useState(0);
  const matches = useLanguageSearch(p.search, p.languages);
  const selectedName =
    p.languages.find((item) => item.code === p.language)?.nativeName ?? p.language;
  return (
    <View style={[s.container, p.open && s.containerOpen]}>
      <View style={s.headingRow}>
        <Text style={s.label}>{p.label}</Text>
        <Text style={s.selectedLanguage}>{selectedName} ▾</Text>
      </View>
      <TextInput
        value={p.search}
        onFocus={p.onOpen}
        onChangeText={(value) => {
          p.onSearchChange(value);
          p.onOpen();
        }}
        placeholder={p.placeholder}
        accessibilityLabel={p.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        style={s.input}
        onLayout={(event) =>
          setInputBottom(event.nativeEvent.layout.y + event.nativeEvent.layout.height)
        }
      />
      {p.open ? (
        <View style={[s.dropdown, { top: inputBottom }]}>
          <TouchableOpacity onPress={p.onClose} accessibilityRole="button">
            <Text style={s.close}>✕</Text>
          </TouchableOpacity>
          <ScrollView keyboardShouldPersistTaps="always">
            {p.loading && matches.length === 0 ? (
              <View style={s.loadingRow}>
                <ActivityIndicator size="small" />
                <Text style={s.empty}>{translate(p.language, "activity.loadingLanguages")}</Text>
              </View>
            ) : null}
            {matches.map((item) => (
              <LanguageOption
                key={item.code}
                item={item}
                selected={p.language}
                onSelect={p.onSelect}
              />
            ))}
            {!p.loading && matches.length === 0 ? (
              <Text style={s.empty}>{p.noResultsText}</Text>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
