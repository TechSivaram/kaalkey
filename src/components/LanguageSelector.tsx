import { useState } from "react";
import { Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { AppLanguage, LanguageOption as LanguageOptionType } from "../i18n/languages";
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
  showLabel?: boolean;
};

export default function LanguageSelector(p: Props) {
  const [inputBottom, setInputBottom] = useState(0);
  const matches = useLanguageSearch(p.search, p.languages);
  const selectedName =
    p.languages.find((item) => item.code === p.language)?.nativeName ?? p.language;
  return (
    <View style={[s.container, p.open && s.containerOpen]}>
      <View style={s.headingRow}>
        {p.showLabel !== false ? <Text style={s.label}>{p.label}</Text> : null}
        <Text style={s.selectedLanguage}>{selectedName} ▾</Text>
      </View>
      {Platform.OS === "web" ? (
        <View style={s.mobileSearchRow}>
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
            style={[s.input, s.mobileSearchInput]}
            onLayout={(event) =>
              setInputBottom(event.nativeEvent.layout.y + event.nativeEvent.layout.height)
            }
          />
          {p.search.length > 0 ? (
            <TouchableOpacity
              style={s.clearSearchButton}
              onPress={() => p.onSearchChange("")}
              accessibilityRole="button"
              accessibilityLabel="Clear language search"
              hitSlop={8}
            >
              <Text style={s.clearSearchText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <TouchableOpacity
          style={s.input}
          onPress={p.onOpen}
          accessibilityRole="button"
          accessibilityLabel={p.placeholder}
        >
          <Text style={p.search ? s.searchValue : s.inputPlaceholder}>
            {p.search || p.placeholder}
          </Text>
        </TouchableOpacity>
      )}
      {p.open ? (
        Platform.OS === "web" ? (
          <View style={s.dropdown}>
            <ScrollView keyboardShouldPersistTaps="always">
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
        ) : (
          <Modal
            visible={p.open}
            transparent
            animationType="fade"
            onRequestClose={p.onClose}
            statusBarTranslucent
          >
            <View style={s.mobileModalOverlay}>
              <View style={s.mobileDropdown}>
                <TouchableOpacity onPress={p.onClose} accessibilityRole="button">
                  <Text style={s.close}>✕</Text>
                </TouchableOpacity>
                <View style={s.mobileSearchRow}>
                  <TextInput
                    value={p.search}
                    onChangeText={p.onSearchChange}
                    placeholder={p.placeholder}
                    accessibilityLabel={p.placeholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    style={[s.input, s.mobileSearchInput]}
                  />
                  {p.search.length > 0 ? (
                    <TouchableOpacity
                      style={s.clearSearchButton}
                      onPress={() => p.onSearchChange("")}
                      accessibilityRole="button"
                      accessibilityLabel="Clear language search"
                      hitSlop={8}
                    >
                      <Text style={s.clearSearchText}>✕</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <ScrollView
                  style={s.mobileOptionsScroll}
                  contentContainerStyle={s.mobileOptionsContent}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="always"
                  showsVerticalScrollIndicator={false}
                >
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
            </View>
          </Modal>
        )
      ) : null}
    </View>
  );
}
