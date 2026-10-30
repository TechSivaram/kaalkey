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
      <Text style={styles.privacyTitle}>{t("Privacy Policy")}</Text>
      <Text style={styles.privacySubtitle}>
        {t("Version")} {LEGAL_VERSION} · {t("Applies to KaalKey Authenticator")}
      </Text>
      <Text style={styles.heading}>{t("1. Information and secrets")}</Text>
      <Text style={styles.body}>
        {t(
          "{t('KaalKey is an authenticator app. Account labels and the secret values needed to generate one-time codes are sensitive. The app is designed to store account records in the device’s secure storage. Anyone with access to an unlocked device or an exported backup may be able to access sensitive information.')}",
        )}
      </Text>
      <Text style={styles.heading}>{t("2. Permissions and device features")}</Text>
      <Text style={styles.body}>
        {t(
          "{t('If you choose to scan a QR code, KaalKey uses camera permission for that action. Optional device authentication and haptic feedback use the relevant device features. You can manage permissions in your device settings.')}",
        )}
      </Text>
      <Text style={styles.heading}>{t("3. Backups")}</Text>
      <Text style={styles.body}>
        {t(
          "{t('When you create a backup, KaalKey encrypts the backup using a password you choose. Keep both the file and password private and store them securely. Anyone who obtains the file and its password may be able to restore your authenticator accounts. KaalKey cannot recover a forgotten backup password.')}",
        )}
      </Text>
      <Text style={styles.heading}>{t("4. Sharing and third parties")}</Text>
      <Text style={styles.body}>
        {t(
          "{t('The backup flow may use your device’s share sheet or file picker to save, transfer, or select files. The privacy practices of any third-party app or service you choose are governed by that provider. This notice does not make a blanket claim that your device, operating system, or chosen sharing services never process data.')}",
        )}
      </Text>
      <Text style={styles.heading}>{t("5. Security and retention")}</Text>
      <Text style={styles.body}>
        {t(
          "{t('Keep your device updated, protect it with a screen lock, and do not share OTP secrets or backup passwords. Removing the app, clearing its data, or losing the device may make locally stored accounts unavailable. Maintain a secure backup if you need recovery.')}",
        )}
      </Text>
      <Text style={styles.heading}>{t("6. Changes and contact")}</Text>
      <Text style={styles.body}>
        {t(
          "{t('This embedded notice may be revised in a future app release. For privacy questions, contact the app publisher through the official support channel provided with the app.')}",
        )}
      </Text>
    </>
  ) : (
    <>
      <Text style={styles.termsTitle}>{t("Terms of Use")}</Text>
      <Text style={styles.termsSubtitle}>
        {t("Version")} {LEGAL_VERSION} · {t("Applies to KaalKey Authenticator")}
      </Text>
      <Text style={styles.heading}>{t("1. Your use")}</Text>
      <Text style={styles.body}>
        {t(
          "{t('You may use KaalKey to generate verification codes for accounts you are authorized to access. You are responsible for complying with applicable laws and the rules of the services for which you use authentication codes.')}",
        )}
      </Text>
      <Text style={styles.heading}>{t("2. Protect your accounts")}</Text>
      <Text style={styles.body}>
        {t(
          "{t('You are responsible for securing your device, authenticator secrets, recovery methods, exported backups, and backup passwords. Do not share codes or secrets with people you do not trust.')}",
        )}
      </Text>
      <Text style={styles.heading}>{t("3. No recovery guarantee")}</Text>
      <Text style={styles.body}>
        {t(
          "{t('KaalKey cannot guarantee that every account can be recovered, that every QR code or configuration will be compatible, or that the app will operate without interruption or error. Keep alternative recovery methods provided by the relevant service.')}",
        )}
      </Text>
      <Text style={styles.heading}>{t("4. No professional advice")}</Text>
      <Text style={styles.body}>
        {t(
          "{t('The app is a utility and does not provide legal, financial, or security incident-response advice. If an account is compromised, follow the affected service’s official recovery and security guidance.')}",
        )}
      </Text>
      <Text style={styles.heading}>{t("5. Changes and availability")}</Text>
      <Text style={styles.body}>
        {t(
          "{t('Features may change between releases. You should keep the app updated and periodically verify that your backup and recovery arrangements work.')}",
        )}
      </Text>
      <Text style={styles.heading}>{t("6. Liability and applicable law")}</Text>
      <Text style={styles.body}>
        {t(
          "{t('To the extent permitted by applicable law, the app is provided without a guarantee of uninterrupted or error-free operation. Nothing in these terms excludes rights or remedies that cannot legally be excluded. Any further limitations or governing-law terms should be reviewed by a qualified lawyer for the publisher’s jurisdiction before release.')}",
        )}
      </Text>
    </>
  );
}
