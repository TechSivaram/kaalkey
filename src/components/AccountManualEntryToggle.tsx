import { useAppLanguage } from "../i18n";
import type { Dispatch, SetStateAction } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/home.styles";

type Props = {
  expanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
};

/** Toggle for opening or closing the manual account-entry form. */
export default function AccountManualEntryToggle({ expanded, setExpanded }: Props) {
  const { t } = useAppLanguage();
  return (
    <TouchableOpacity
      style={styles.scanButton}
      onPress={() => setExpanded((value) => !value)}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
    >
      <View style={styles.scanButtonCopy}>
        <Text style={styles.scanButtonTitle}>
          {expanded ? t("Hide manual entry") : t("Enter details manually")}
        </Text>
        <Text style={styles.scanButtonSubtitle}>{t("Service, account name and secret key")}</Text>
      </View>
      <Text style={styles.scanButtonArrow}>{expanded ? "⌄" : "›"}</Text>
    </TouchableOpacity>
  );
}
