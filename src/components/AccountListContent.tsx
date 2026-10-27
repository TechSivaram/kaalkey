import { Text } from "react-native";
import type { Account } from "../types/account";
import { styles } from "../styles/home.styles";
import AccountCard from "./AccountCard";
import EmptyVaultState from "./EmptyVaultState";

type AccountListContentProps = {
  loaded: boolean;
  accounts: Account[];
  visibleAccounts: Account[];
  now: number;
  onAddAccount: () => void;
  onCopyCode: (code: string) => void | Promise<void>;
  onViewQr: (account: Account) => void;
  onEdit: (account: Account) => void;
  onDelete: (accountId: string) => void;
};

/** Renders the loading, empty, filtered, or populated account-list state. */
export default function AccountListContent({
  loaded,
  accounts,
  visibleAccounts,
  now,
  onAddAccount,
  onCopyCode,
  onViewQr,
  onEdit,
  onDelete,
}: AccountListContentProps) {
  if (!loaded) {
    return <Text style={styles.emptyText}>Loading secure vault...</Text>;
  }

  if (accounts.length === 0) {
    return <EmptyVaultState onAddAccount={onAddAccount} />;
  }

  if (visibleAccounts.length === 0) {
    return <Text style={styles.emptyText}>No accounts match your search.</Text>;
  }

  return visibleAccounts.map((account) => (
    <AccountCard
      key={account.id}
      account={account}
      now={now}
      onCopyCode={onCopyCode}
      onViewQr={onViewQr}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  ));
}
