import { Text } from "react-native";
import { useAppLanguage } from "../i18n";
import { LEGAL_VERSION } from "../constants/legal";
import { legalDocumentContentStyles as styles } from "../styles/component.styles";
import type { LegalDocument } from "../types/legalDocument";

type Props = { legalDocument: LegalDocument };

/** Renders the selected embedded privacy policy or terms document. */
export default function LegalDocumentContent({ legalDocument }: Props) {
  const { t } = useAppLanguage();
  return legalDocument === "privacy" ? (
    <>
      <Text style={styles.privacyTitle}>{t("legal.privacy.title")}</Text>
      <Text style={styles.privacySubtitle}>
        {t("legal.version")} {LEGAL_VERSION} · {t("legal.appliesAuthenticator")}
      </Text>
      <Text style={styles.heading}>{t("legal.privacy.information.heading")}</Text>
      <Text style={styles.body}>{t("legal.privacy.information.body")}</Text>
      <Text style={styles.heading}>{t("legal.privacy.permissions.heading")}</Text>
      <Text style={styles.body}>{t("legal.privacy.permissions.body")}</Text>
      <Text style={styles.heading}>{t("legal.privacy.backups.heading")}</Text>
      <Text style={styles.body}>{t("legal.privacy.backups.body")}</Text>
      <Text style={styles.heading}>{t("legal.privacy.sharing.heading")}</Text>
      <Text style={styles.body}>{t("legal.privacy.sharing.body")}</Text>
      <Text style={styles.heading}>{t("legal.privacy.security.heading")}</Text>
      <Text style={styles.body}>{t("legal.privacy.security.body")}</Text>
      <Text style={styles.heading}>{t("legal.privacy.changes.heading")}</Text>
      <Text style={styles.body}>{t("legal.privacy.changes.body")}</Text>
    </>
  ) : (
    <>
      <Text style={styles.termsTitle}>{t("legal.terms.title")}</Text>
      <Text style={styles.termsSubtitle}>
        {t("legal.version")} {LEGAL_VERSION} · {t("legal.appliesAuthenticator")}
      </Text>
      <Text style={styles.heading}>{t("legal.terms.use.heading")}</Text>
      <Text style={styles.body}>{t("legal.terms.use.body")}</Text>
      <Text style={styles.heading}>{t("legal.terms.protectAccounts.heading")}</Text>
      <Text style={styles.body}>{t("legal.terms.protectAccounts.body")}</Text>
      <Text style={styles.heading}>{t("legal.terms.recovery.heading")}</Text>
      <Text style={styles.body}>{t("legal.terms.recovery.body")}</Text>
      <Text style={styles.heading}>{t("legal.terms.advice.heading")}</Text>
      <Text style={styles.body}>{t("legal.terms.advice.body")}</Text>
      <Text style={styles.heading}>{t("legal.terms.availability.heading")}</Text>
      <Text style={styles.body}>{t("legal.terms.availability.body")}</Text>
      <Text style={styles.heading}>{t("legal.terms.liability.heading")}</Text>
      <Text style={styles.body}>{t("legal.terms.liability.body")}</Text>
    </>
  );
}
