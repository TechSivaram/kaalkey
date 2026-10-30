import { useAppLanguage } from "../i18n";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "../styles/home.styles";
import type { AccountSortBy } from "../hooks/useAccountList";
import { BUTTON_ACTIVE_OPACITY } from "../constants/ui";
import { COLORS } from "../constants/colors";

type Props = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  sortBy: AccountSortBy;
  setSortBy: (value: AccountSortBy) => void;
  hapticFeedback: (kind?: "selection" | "success" | "warning") => void;
};

/** Search and sort controls for the account list. */
export default function AccountListToolbar({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  hapticFeedback,
}: Props) {
  const { t } = useAppLanguage();
  return (
    <View style={styles.organizePanel}>
      <View style={styles.searchInputContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("Search service or account")}
          placeholderTextColor={COLORS.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={t("Search accounts")}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery("")}
            activeOpacity={BUTTON_ACTIVE_OPACITY}
            accessibilityRole="button"
            accessibilityLabel={t("Clear search")}
            hitSlop={8}
          >
            <Text style={styles.clearSearchButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>{t("SORT BY")}</Text>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === "service" && styles.sortButtonActive]}
          onPress={() => {
            hapticFeedback("selection");
            setSortBy("service");
          }}
          accessibilityRole="button"
          accessibilityLabel={t("Sort by service name")}
        >
          <Text
            style={[styles.sortButtonText, sortBy === "service" && styles.sortButtonTextActive]}
          >
            {t("Service")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === "account" && styles.sortButtonActive]}
          onPress={() => {
            hapticFeedback("selection");
            setSortBy("account");
          }}
          accessibilityRole="button"
          accessibilityLabel={t("Sort by account name")}
        >
          <Text
            style={[styles.sortButtonText, sortBy === "account" && styles.sortButtonTextActive]}
          >
            {t("Account")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
