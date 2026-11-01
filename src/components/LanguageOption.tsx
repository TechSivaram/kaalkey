import { Text, TouchableOpacity, View } from "react-native";
import type { AppLanguage, LanguageOption as Language } from "../i18n/languages";
import { languageOptionStyles as s } from "./language-option.styles";
type Props = { item: Language; selected: AppLanguage; onSelect: (code: AppLanguage) => void };
export default function LanguageOption({ item, selected, onSelect }: Props) {
  const active = selected === item.code;
  return (
    <TouchableOpacity
      onPress={() => onSelect(item.code)}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[s.option, active && s.optionSelected]}
    >
      <View>
        <Text style={[s.primary, active && s.primarySelected]}>{item.nativeName}</Text>
        <Text style={[s.secondary, active && s.secondarySelected]}>
          {item.name} · {item.code}
        </Text>
      </View>
      {active ? <Text style={s.check}>✓</Text> : null}
    </TouchableOpacity>
  );
}
