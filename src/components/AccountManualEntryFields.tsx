import type { Dispatch, SetStateAction } from "react";
import { Text } from "react-native";
import type { Account } from "../types/account";
import AccountTotpFields from "./AccountTotpFields";
import AccountIdentityFields from "./AccountIdentityFields";
import { styles } from "../styles/home.styles";

type Props = {
  editingId: string | null;
  manualExpanded: boolean;
  issuer: string;
  setIssuer: Dispatch<SetStateAction<string>>;
  accountName: string;
  setAccountName: Dispatch<SetStateAction<string>>;
  secret: string;
  setSecret: Dispatch<SetStateAction<string>>;
  otpAlgorithm: Account["algorithm"];
  setOtpAlgorithm: Dispatch<SetStateAction<Account["algorithm"]>>;
  otpDigits: number;
  setOtpDigits: Dispatch<SetStateAction<number>>;
  otpPeriod: string;
  setOtpPeriod: Dispatch<SetStateAction<string>>;
};

/** Manual account identity and TOTP fields within the account editor. */
export default function AccountManualEntryFields(props: Props) {
  const {
    editingId, manualExpanded, issuer, setIssuer, accountName, setAccountName,
    secret, setSecret, otpAlgorithm, setOtpAlgorithm, otpDigits, setOtpDigits,
    otpPeriod, setOtpPeriod,
  } = props;

  if (!editingId && !manualExpanded) return null;

  return (
    <>
      {!editingId && (
        <Text style={styles.manualEntryLabel}>OR ENTER DETAILS MANUALLY</Text>
      )}

      <AccountIdentityFields
        issuer={issuer}
        setIssuer={setIssuer}
        accountName={accountName}
        setAccountName={setAccountName}
      />

      {!editingId && (
        <AccountTotpFields
          editingId={editingId}
          secret={secret}
          setSecret={setSecret}
          otpAlgorithm={otpAlgorithm}
          setOtpAlgorithm={setOtpAlgorithm}
          otpDigits={otpDigits}
          setOtpDigits={setOtpDigits}
          otpPeriod={otpPeriod}
          setOtpPeriod={setOtpPeriod}
        />
      )}
    </>
  );
}
