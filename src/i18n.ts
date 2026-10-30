import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";

export type AppLanguage = "en" | "te" | "hi";
export type LanguageOption = {
  code: AppLanguage;
  name: string;
  nativeName: string;
  searchTerms: string;
};
// Only languages with bundled, reviewed UI translations are selectable.
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", searchTerms: "english en" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", searchTerms: "telugu te తెలుగు" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", searchTerms: "hindi hi हिंदी हिन्दी" },
];
export const LANGUAGE_STORAGE_KEY = "kaalkey.language";
export const LANGUAGE_NAMES: Record<AppLanguage, string> = {
  en: "English",
  te: "తెలుగు",
  hi: "हिन्दी",
};

const dictionaries: Record<AppLanguage, Record<string, string>> = {
  en: {
    language: "Language",
    languageDescription: "Choose the language used in KaalKey.",
    english: "English",
    telugu: "Telugu",
    hindi: "Hindi",
    "App settings": "App settings",
    "KAALKEY PREFERENCES": "KAALKEY PREFERENCES",
    LANGUAGE: "LANGUAGE",
    EXPERIENCE: "EXPERIENCE",
    SECURITY: "SECURITY",
    "BACKUP & RECOVERY": "BACKUP & RECOVERY",
    "DANGER ZONE": "DANGER ZONE",
    APPEARANCE: "APPEARANCE",
    "Haptic feedback": "Haptic feedback",
    "Gentle feedback for taps and completed actions.":
      "Gentle feedback for taps and completed actions.",
    "Device authentication lock": "Device authentication lock",
    "Your vault locks when KaalKey leaves the foreground.":
      "Your vault locks when KaalKey leaves the foreground.",
    "Require your phone’s biometrics or screen-lock PIN, pattern, or password.":
      "Require your phone’s biometrics or screen-lock PIN, pattern, or password.",
    "Create backup": "Create backup",
    "Encrypted file": "Encrypted file",
    "Restore backup": "Restore backup",
    "Backup safety note":
      "Backups contain your authenticator secrets. KaalKey generates a unique password for each backup. Save it separately; KaalKey cannot recover it.",
    "Generating secure password…": "Generating secure password…",
    "Import file": "Import file",
    "Clear all accounts": "Clear all accounts",
    "Permanently remove every account and secret from this device. Back up first.":
      "Permanently remove every account and secret from this device. Back up first.",
    "Light appearance": "Light appearance",
    "KaalKey currently uses its clean light theme.":
      "KaalKey currently uses its clean light theme.",
    "Legal & privacy": "Legal & privacy",
    "Review the Privacy Policy and Terms of Use.": "Review the Privacy Policy and Terms of Use.",
    "Your authenticator secrets stay in the on-device secure vault. Preferences are stored locally.":
      "Your authenticator secrets stay in the on-device secure vault. Preferences are stored locally.",
    Done: "Done",
    "SECURE VAULT": "SECURE VAULT",
    "BACKUP PASSWORD": "BACKUP PASSWORD",
    "Copy generated password": "Copy generated password",
    Cancel: "Cancel",
    "Close settings": "Close settings",
    "Search language (name or code)": "Search language (name or code)",
    "Search supported languages": "Search supported languages",
    "Close language dropdown": "Close language dropdown",
    "No translated language found.": "No translated language found.",
    Edit: "Edit",
    "Update the service, account name, or secret key.":
      "Update the service, account name, or secret key.",
    "Scan a QR code for the easiest setup, or enter details manually.":
      "Scan a QR code for the easiest setup, or enter details manually.",
    "Turn flashlight off": "Turn flashlight off",
    "Turn flashlight on": "Turn flashlight on",
    "Flashlight on": "Flashlight on",
    Flashlight: "Flashlight",
    "Keep the entire QR code visible. Your secret stays on this device.":
      "Keep the entire QR code visible. Your secret stays on this device.",
    "Loading secure vault...": "Loading secure vault...",
    "No accounts match your search.": "No accounts match your search.",
    "Secret key, read-only while editing": "Secret key, read-only while editing",
    "Secret key in Base32": "Secret key in Base32",
    digits: "digits",
    seconds: "seconds",
    "Use the secret key supplied by the service you are configuring. Never enter your account password here. Match the algorithm, digit count, and interval to the service’s setup instructions.":
      "Use the secret key supplied by the service you are configuring. Never enter your account password here. Match the algorithm, digit count, and interval to the service’s setup instructions.",
    "OR ENTER DETAILS MANUALLY": "OR ENTER DETAILS MANUALLY",
    "Hide manual entry": "Hide manual entry",
    "Enter details manually": "Enter details manually",
    "Service, account name and secret key": "Service, account name and secret key",
    "Save changes securely": "Save changes securely",
    "Save account securely": "Save account securely",
    "KAALKEY AUTHENTICATOR": "KAALKEY AUTHENTICATOR",
    "YOUR LOCAL VAULT": "YOUR LOCAL VAULT",
    "Your codes. Your device. Your control.": "Your codes. Your device. Your control.",
    "Securing your vault…": "Securing your vault…",
    "Your vault is protected": "Your vault is protected",
    "Checking your secure lock settings. Your codes remain hidden.":
      "Checking your secure lock settings. Your codes remain hidden.",
    "Use your phone’s biometrics or screen-lock PIN, pattern, or password to access your one-time verification codes.":
      "Use your phone’s biometrics or screen-lock PIN, pattern, or password to access your one-time verification codes.",
    "Waiting for verification…": "Waiting for verification…",
    "Unlock securely": "Unlock securely",
    "Your secrets stay stored on this device.": "Your secrets stay stored on this device.",
    "View QR code for account": "View QR code for account",
    "Remove account": "Remove account",
    "Copy verification code": "Copy verification code",
    "TAP TO COPY": "TAP TO COPY",
    ACTIVE: "ACTIVE",

    "Disable app lock": "Disable app lock",
    "Enable app lock": "Enable app lock",
    "LOCK ON": "LOCK ON",
    "Open app settings": "Open app settings",
    "SORT BY": "SORT BY",
    Account: "Account",
    "Scan QR code": "Scan QR code",
    "Use your camera to add an account instantly": "Use your camera to add an account instantly",
    "Upload QR Image": "Upload QR image",
    "Choose a QR screenshot from Gallery, Photos, or Files":
      "Choose a QR screenshot from Gallery, Photos, or Files",
    "Paste QR Image / URL": "Paste QR image / URL",
    "Paste a copied QR image or authenticator setup URL":
      "Paste a copied QR image or authenticator setup URL",
    "Clear search": "Clear search",
    "Sort by service name": "Sort by service name",
    "Sort by account name": "Sort by account name",
    "Back to add account": "Back to add account",
    "SECURE SETUP": "SECURE SETUP",
    "Enter details manually instead": "Enter details manually instead",
    "Account QR code": "Account QR code",
    "Reveal QR code": "Reveal QR code",
    "QR export warning":
      "Warning: anyone who scans this QR code can generate verification codes for this account. Only reveal it on a trusted screen.",
    "QR privacy hint":
      "Keep this QR code private. Scanning it copies the account’s authenticator secret.",

    "Add an account using its secret key to generate your first verification code.":
      "Add an account using its secret key to generate your first verification code.",
    "Camera unavailable. Open this page on HTTPS or localhost and allow camera access.":
      "Camera unavailable. Open this page on HTTPS or localhost and allow camera access.",
    "Camera preview is unavailable. Close and reopen the scanner.":
      "Camera preview is unavailable. Close and reopen the scanner.",
    "Camera ready — point it at the full QR code.": "Camera ready — point it at the full QR code.",
    "This browser cannot process camera frames.": "This browser cannot process camera frames.",
    "QR code detected.": "QR code detected.",
    "Couldn't read camera frames. Check camera permissions and reload this page.":
      "Couldn't read camera frames. Check camera permissions and reload this page.",
    "Camera permission denied. Allow camera access in browser settings, then reopen the scanner.":
      "Camera permission denied. Allow camera access in browser settings, then reopen the scanner.",
    "No camera was found on this device.": "No camera was found on this device.",
    "The camera is busy in another app or browser tab.":
      "The camera is busy in another app or browser tab.",
    "Could not start camera. Use HTTPS or localhost and check browser permissions.":
      "Could not start camera. Use HTTPS or localhost and check browser permissions.",
    "QR scanner camera preview": "QR scanner camera preview",
    Version: "Version",
    "Applies to KaalKey Authenticator": "Applies to KaalKey Authenticator",
    "Legal & Privacy Notice": "Legal & Privacy Notice",
    "Legal information": "Legal information",
    "Please review both documents before using KaalKey. They are included in the app and available offline.":
      "Please review both documents before using KaalKey. They are included in the app and available offline.",
    "Review KaalKey’s privacy information and terms of use.":
      "Review KaalKey’s privacy information and terms of use.",
    "I have read and agree to the Privacy Policy and Terms of Use.":
      "I have read and agree to the Privacy Policy and Terms of Use.",
    "Saving…": "Saving…",
    "Accept & Continue": "Accept & Continue",
    VERSION: "VERSION",

    "1. Information and secrets": "1. Information and secrets",
    "KaalKey is an authenticator app. Account labels and the secret values needed to generate one-time codes are sensitive. The app is designed to store account records in the device’s secure storage. Anyone with access to an unlocked device or an exported backup may be able to access sensitive information.":
      "KaalKey is an authenticator app. Account labels and the secret values needed to generate one-time codes are sensitive. The app is designed to store account records in the device’s secure storage. Anyone with access to an unlocked device or an exported backup may be able to access sensitive information.",
    "2. Permissions and device features": "2. Permissions and device features",
    "If you choose to scan a QR code, KaalKey uses camera permission for that action. Optional device authentication and haptic feedback use the relevant device features. You can manage permissions in your device settings.":
      "If you choose to scan a QR code, KaalKey uses camera permission for that action. Optional device authentication and haptic feedback use the relevant device features. You can manage permissions in your device settings.",
    "3. Backups": "3. Backups",
    "When you create a backup, KaalKey encrypts the backup using a password you choose. Keep both the file and password private and store them securely. Anyone who obtains the file and its password may be able to restore your authenticator accounts. KaalKey cannot recover a forgotten backup password.":
      "When you create a backup, KaalKey encrypts the backup using a password you choose. Keep both the file and password private and store them securely. Anyone who obtains the file and its password may be able to restore your authenticator accounts. KaalKey cannot recover a forgotten backup password.",
    "4. Sharing and third parties": "4. Sharing and third parties",
    "The backup flow may use your device’s share sheet or file picker to save, transfer, or select files. The privacy practices of any third-party app or service you choose are governed by that provider. This notice does not make a blanket claim that your device, operating system, or chosen sharing services never process data.":
      "The backup flow may use your device’s share sheet or file picker to save, transfer, or select files. The privacy practices of any third-party app or service you choose are governed by that provider. This notice does not make a blanket claim that your device, operating system, or chosen sharing services never process data.",
    "5. Security and retention": "5. Security and retention",
    "Keep your device updated, protect it with a screen lock, and do not share OTP secrets or backup passwords. Removing the app, clearing its data, or losing the device may make locally stored accounts unavailable. Maintain a secure backup if you need recovery.":
      "Keep your device updated, protect it with a screen lock, and do not share OTP secrets or backup passwords. Removing the app, clearing its data, or losing the device may make locally stored accounts unavailable. Maintain a secure backup if you need recovery.",
    "6. Changes and contact": "6. Changes and contact",
    "This embedded notice may be revised in a future app release. For privacy questions, contact the app publisher through the official support channel provided with the app.":
      "This embedded notice may be revised in a future app release. For privacy questions, contact the app publisher through the official support channel provided with the app.",
    "1. Your use": "1. Your use",
    "You may use KaalKey to generate verification codes for accounts you are authorized to access. You are responsible for complying with applicable laws and the rules of the services for which you use authentication codes.":
      "You may use KaalKey to generate verification codes for accounts you are authorized to access. You are responsible for complying with applicable laws and the rules of the services for which you use authentication codes.",
    "2. Protect your accounts": "2. Protect your accounts",
    "You are responsible for securing your device, authenticator secrets, recovery methods, exported backups, and backup passwords. Do not share codes or secrets with people you do not trust.":
      "You are responsible for securing your device, authenticator secrets, recovery methods, exported backups, and backup passwords. Do not share codes or secrets with people you do not trust.",
    "3. No recovery guarantee": "3. No recovery guarantee",
    "KaalKey cannot guarantee that every account can be recovered, that every QR code or configuration will be compatible, or that the app will operate without interruption or error. Keep alternative recovery methods provided by the relevant service.":
      "KaalKey cannot guarantee that every account can be recovered, that every QR code or configuration will be compatible, or that the app will operate without interruption or error. Keep alternative recovery methods provided by the relevant service.",
    "4. No professional advice": "4. No professional advice",
    "The app is a utility and does not provide legal, financial, or security incident-response advice. If an account is compromised, follow the affected service’s official recovery and security guidance.":
      "The app is a utility and does not provide legal, financial, or security incident-response advice. If an account is compromised, follow the affected service’s official recovery and security guidance.",
    "5. Changes and availability": "5. Changes and availability",
    "Features may change between releases. You should keep the app updated and periodically verify that your backup and recovery arrangements work.":
      "Features may change between releases. You should keep the app updated and periodically verify that your backup and recovery arrangements work.",
    "6. Liability and applicable law": "6. Liability and applicable law",
    "To the extent permitted by applicable law, the app is provided without a guarantee of uninterrupted or error-free operation. Nothing in these terms excludes rights or remedies that cannot legally be excluded. Any further limitations or governing-law terms should be reviewed by a qualified lawyer for the publisher’s jurisdiction before release.":
      "To the extent permitted by applicable law, the app is provided without a guarantee of uninterrupted or error-free operation. Nothing in these terms excludes rights or remedies that cannot legally be excluded. Any further limitations or governing-law terms should be reviewed by a qualified lawyer for the publisher’s jurisdiction before release.",
    account: "account",
    accounts: "accounts",
    "Backup export description":
      "Encrypt all {count} saved {accountLabel} into a backup file. KaalKey generates a unique password; copy and save it separately from the file.",
    "Backup restore description":
      "Choose your KaalKey backup file and password. New accounts will be added to your existing account list; existing accounts will stay as they are.",
    "Starting camera…": "Starting camera…",
  },

  te: {
    language: "భాష",
    languageDescription: "KaalKey లో ఉపయోగించే భాషను ఎంచుకోండి.",
    english: "ఇంగ్లీష్",
    telugu: "తెలుగు",
    hindi: "హిందీ",
    "App settings": "యాప్ సెట్టింగ్‌లు",
    "KAALKEY PREFERENCES": "కాల్‌కీ ప్రాధాన్యతలు",
    LANGUAGE: "భాష",
    EXPERIENCE: "అనుభవం",
    SECURITY: "భద్రత",
    "BACKUP & RECOVERY": "బ్యాకప్ & పునరుద్ధరణ",
    "DANGER ZONE": "ప్రమాద ప్రాంతం",
    APPEARANCE: "రూపం",
    "Haptic feedback": "హాప్టిక్ స్పందన",
    "Gentle feedback for taps and completed actions.":
      "ట్యాప్‌లు మరియు పూర్తయిన చర్యలకు స్వల్ప స్పందన.",
    "Device authentication lock": "పరికర ధృవీకరణ లాక్",
    "Your vault locks when KaalKey leaves the foreground.":
      "KaalKey నేపథ్యానికి వెళ్లినప్పుడు మీ వాల్ట్ లాక్ అవుతుంది.",
    "Require your phone’s biometrics or screen-lock PIN, pattern, or password.":
      "మీ ఫోన్ బయోమెట్రిక్స్ లేదా స్క్రీన్ లాక్ PIN, నమూనా లేదా పాస్‌వర్డ్ అవసరం.",
    "Create backup": "బ్యాకప్ సృష్టించండి",
    "Encrypted file": "ఎన్‌క్రిప్ట్ చేసిన ఫైల్",
    "Restore backup": "బ్యాకప్ పునరుద్ధరించండి",
    "Backup safety note":
      "బ్యాకప్‌లలో మీ ఆథెంటికేటర్ రహస్యాలు ఉంటాయి. ప్రతి బ్యాకప్‌కు KaalKey ప్రత్యేక పాస్‌వర్డ్‌ను రూపొందిస్తుంది. దాన్ని విడిగా భద్రపరచండి; KaalKey దాన్ని తిరిగి పొందలదు.",
    "Generating secure password…": "సురక్షిత పాస్‌వర్డ్ రూపొందిస్తోంది…",
    "Import file": "ఫైల్ దిగుమతి",
    "Clear all accounts": "అన్ని ఖాతాలను తొలగించండి",
    "Permanently remove every account and secret from this device. Back up first.":
      "ఈ పరికరం నుండి అన్ని ఖాతాలు మరియు రహస్యాలను శాశ్వతంగా తొలగించండి. ముందుగా బ్యాకప్ చేయండి.",
    "Light appearance": "లైట్ రూపం",
    "KaalKey currently uses its clean light theme.":
      "KaalKey ప్రస్తుతం లైట్ థీమ్‌ను ఉపయోగిస్తోంది.",
    "Legal & privacy": "చట్టపరమైన సమాచారం & గోప్యత",
    "Review the Privacy Policy and Terms of Use.": "గోప్యతా విధానం మరియు వినియోగ నిబంధనలను చూడండి.",
    "Your authenticator secrets stay in the on-device secure vault. Preferences are stored locally.":
      "మీ ఆథెంటికేటర్ రహస్యాలు పరికరంలోని సురక్షిత వాల్ట్‌లో ఉంటాయి. ప్రాధాన్యతలు స్థానికంగా నిల్వ అవుతాయి.",
    Done: "పూర్తయింది",
    "SECURE VAULT": "సురక్షిత వాల్ట్",
    "BACKUP PASSWORD": "బ్యాకప్ పాస్‌వర్డ్",
    "Copy generated password": "సృష్టించిన పాస్‌వర్డ్‌ను కాపీ చేయండి",
    Cancel: "రద్దు",
    "Close settings": "సెట్టింగ్‌లను మూసివేయండి",
    "Search language (name or code)": "భాషను వెతకండి (పేరు లేదా కోడ్)",
    "Search supported languages": "మద్దతు ఉన్న భాషలను వెతకండి",
    "Close language dropdown": "భాషల జాబితాను మూసివేయండి",
    "No translated language found.": "భాష కనబడలేదు.",
    "Add account": "ఖాతాను జోడించండి",
    "Add your first account": "మీ మొదటి ఖాతాను జోడించండి",
    "Add an account using its secret key to generate your first verification code.":
      "మీ మొదటి ధృవీకరణ కోడ్‌ను రూపొందించడానికి రహస్య కీతో ఖాతాను జోడించండి।",
    "Search accounts": "ఖాతాలను వెతకండి",
    "Search service or account": "సేవ లేదా ఖాతాను వెతకండి",
    "Scan QR code": "QR కోడ్‌ను స్కాన్ చేయండి",
    "Scan authenticator QR code": "ఆథెంటికేటర్ QR కోడ్‌ను స్కాన్ చేయండి",
    "Upload QR image": "QR చిత్రాన్ని అప్‌లోడ్ చేయండి",
    "Choose a QR screenshot from Gallery, Photos, or Files":
      "గ్యాలరీ, ఫోటోలు లేదా ఫైళ్ల నుండి QR స్క్రీన్‌షాట్‌ను ఎంచుకోండి",
    "Enter details manually instead": "బదులుగా వివరాలను చేతితో నమోదు చేయండి",
    "Service or issuer": "సేవ లేదా జారీదారు",
    "Account name": "ఖాతా పేరు",
    "Secret key": "రహస్య కీ",
    Save: "సేవ్ చేయండి",
    Delete: "తొలగించండి",
    Edit: "సవరించండి",
    Close: "మూసివేయండి",
    "Enter backup password": "బ్యాకప్ పాస్‌వర్డ్ నమోదు చేయండి",
    "Your secrets stay stored on this device.": "మీ రహస్యాలు ఈ పరికరంలోనే నిల్వ ఉంటాయి।",
    "Camera unavailable. Check camera permission and try again.":
      "కెమెరా అందుబాటులో లేదు. కెమెరా అనుమతిని తనిఖీ చేసి మళ్లీ ప్రయత్నించండి।",
    "Your accounts": "మీ ఖాతాలు",
    "+ Add": "+ జోడించండి",
    "Your vault starts here": "మీ వాల్ట్ ఇక్కడ ప్రారంభమవుతుంది",
    "KAALKEY AUTHENTICATOR": "కాల్కీ ఆథెంటికేటర్",
    "Your codes. Your device. Your control.": "మీ కోడ్‌లు. మీ పరికరం. మీ నియంత్రణ.",
    "Account QR code": "ఖాతా QR కోడ్",
    "Reveal QR code": "QR కోడ్‌ను చూపించండి",
    "QR export warning":
      "ఈ QR కోడ్‌ను స్కాన్ చేసే ఎవరైనా ఈ ఖాతా కోసం ధృవీకరణ కోడ్‌లను రూపొందించగలరు. నమ్మకమైన స్క్రీన్‌లో మాత్రమే దీన్ని చూపించండి.",
    "QR privacy hint":
      "ఈ QR కోడ్‌ను గోప్యంగా ఉంచండి. దీన్ని స్కాన్ చేస్తే ఖాతా ఆథెంటికేటర్ రహస్య కీ కాపీ అవుతుంది.",
    "SECURE SETUP": "సురక్షిత సెటప్",
    "SERVICE / ISSUER": "సేవ / జారీదారు",
    "e.g. Google": "ఉదా. Google",
    "Clear service or issuer": "సేవ లేదా జారీదారును క్లియర్ చేయండి",
    "e.g. you@example.com": "ఉదా. you@example.com",
    "Clear account name": "ఖాతా పేరును క్లియర్ చేయండి",
    "SECRET KEY (LOCKED)": "రహస్య కీ (లాక్ చేయబడింది)",
    "SECRET KEY (BASE32)": "రహస్య కీ (BASE32)",
    "Enter your setup key": "మీ సెటప్ కీ నమోదు చేయండి",
    "Clear secret key": "రహస్య కీని క్లియర్ చేయండి",
    "OTP ALGORITHM": "OTP అల్గోరిథం",
    "OTP DIGITS": "OTP అంకెలు",
    "REFRESH INTERVAL (SECONDS)": "రిఫ్రెష్ విరామం (సెకన్లు)",
    "OTP refresh interval in seconds": "OTP రిఫ్రెష్ విరామం సెకన్లలో",
    "Clear search": "శోధనను క్లియర్ చేయండి",
    "Sort by service name": "సేవ పేరు ప్రకారం క్రమబద్ధీకరించండి",
    "Sort by account name": "ఖాతా పేరు ప్రకారం క్రమబద్ధీకరించండి",
    "SORT BY": "క్రమబద్ధీకరణ",
    "Close account form": "ఖాతా ఫారమ్‌ను మూసివేయండి",
    "TOTP setup URL": "TOTP సెటప్ URL",
    "Import setup URL": "సెటప్ URL దిగుమతి చేయండి",
    "KaalKey tricolour lock emblem": "కాల్‌కీ త్రివర్ణ తాళం చిహ్నం",
    "Disable app lock": "యాప్ లాక్ నిలిపివేయి",
    "Enable app lock": "యాప్ లాక్ ప్రారంభించు",
    "LOCK ON": "లాక్ ఆన్",

    "Open app settings": "యాప్ సెట్టింగ్‌లు తెరవండి",
    AUTHENTICATOR: "ఆథెంటికేటర్",
    "LOCAL VAULT": "స్థానిక వాల్ట్",
    "Privacy Policy": "గోప్యతా విధానం",
    "Terms of Use": "వినియోగ నిబంధనలు",
    Working: "పని జరుగుతోంది",
    "Please wait…": "దయచేసి వేచి ఉండండి…",
    "Please don’t close or interact with KaalKey.":
      "దయచేసి KaalKeyని మూసివేయవద్దు లేదా ఉపయోగించవద్దు.",
    "Original multicolour KaalKey authenticator emblem": "KaalKey అసలు బహువర్ణ ఆథెంటికేటర్ చిహ్నం",
    "Legal & Privacy Notice": "చట్టపరమైన మరియు గోప్యతా నోటీసు",
    "Legal information": "చట్టపరమైన సమాచారం",
    "Please review both documents before using KaalKey. They are included in the app and available offline.":
      "KaalKey ఉపయోగించే ముందు రెండు పత్రాలను సమీక్షించండి. అవి యాప్‌లో ఉన్నాయి మరియు ఆఫ్‌లైన్‌లో అందుబాటులో ఉంటాయి.",
    "Review KaalKey’s privacy information and terms of use.":
      "KaalKey గోప్యతా సమాచారం మరియు వినియోగ నిబంధనలను సమీక్షించండి.",
    "I have read and agree to the Privacy Policy and Terms of Use.":
      "నేను గోప్యతా విధానం మరియు వినియోగ నిబంధనలను చదివి అంగీకరిస్తున్నాను.",
    "Saving…": "సేవ్ చేస్తోంది…",
    "Accept & Continue": "అంగీకరించి కొనసాగించండి",

    "Time-based codes": "సమయ ఆధారిత కోడ్‌లు",
    "Generate rotating one-time passcodes for your accounts to complete two-step verification.":
      "రెండు-దశల ధృవీకరణ కోసం మీ ఖాతాలకు మారే వన్-టైమ్ కోడ్‌లను రూపొందించండి.",
    "Quick account setup": "త్వరిత ఖాతా సెటప్",
    "Scan an authenticator QR code or import a QR image to add an account.":
      "ఖాతాను జోడించడానికి ఆథెంటికేటర్ QR కోడ్‌ను స్కాన్ చేయండి లేదా QR చిత్రాన్ని దిగుమతి చేయండి.",
    "Accounts in one place": "ఒకే చోట ఖాతాలు",
    "Keep your saved accounts together and find the right entry when it is time to sign in.":
      "మీ ఖాతాలను ఒకచోట ఉంచి, సైన్ ఇన్ చేసేటప్పుడు సరైన ఖాతాను కనుగొనండి.",
    "Backup & restore": "బ్యాకప్ మరియు పునరుద్ధరణ",
    "Back up your authenticator data and restore it when you move to another device.":
      "మీ ఆథెంటికేటర్ డేటాను బ్యాకప్ చేసి, మరొక పరికరానికి మారినప్పుడు పునరుద్ధరించండి.",
    "Private account vault": "ప్రైవేట్ ఖాతా వాల్ట్",
    "Manage your authenticator entries locally and use the app's available device-lock option.":
      "మీ ఆథెంటికేటర్ ఖాతాలను స్థానికంగా నిర్వహించండి మరియు పరికర లాక్ ఎంపికను ఉపయోగించండి.",
    "Easy code access": "కోడ్‌లకు సులభమైన ప్రాప్యత",
    "Copy a current code or manage account details through a clean, focused interface.":
      "ప్రస్తుత కోడ్‌ను కాపీ చేయండి లేదా సరళమైన ఇంటర్‌ఫేస్‌లో ఖాతా వివరాలను నిర్వహించండి.",
    "AUTHENTICATOR · BY TECHSIVARAM": "ఆథెంటికేటర్ · TECHSIVARAM ద్వారా",
    "YOUR MOBILE AUTHENTICATOR": "మీ మొబైల్ ఆథెంటికేటర్",
    "A simpler way to manage your two-step verification.":
      "రెండు-దశల ధృవీకరణను నిర్వహించడానికి సులభమైన మార్గం.",
    "A focused authenticator experience for time-based verification codes. Keep compatible account codes close at hand with KaalKey for Android.":
      "సమయ ఆధారిత ధృవీకరణ కోడ్‌ల కోసం ప్రత్యేక ఆథెంటికేటర్. Androidలో KaalKeyతో మీ ఖాతా కోడ్‌లను సులభంగా అందుబాటులో ఉంచండి.",
    "TIME-BASED CODES": "సమయ ఆధారిత కోడ్‌లు",
    "PRIVATE BY DESIGN": "గోప్యతే రూపకల్పన",
    "BUILT FOR A SIMPLE AUTHENTICATOR WORKFLOW": "సులభమైన ఆథెంటికేటర్ విధానం కోసం రూపొందించబడింది",
    "QR SETUP · TIMED CODES · ACCOUNT MANAGEMENT": "QR సెటప్ · సమయ కోడ్‌లు · ఖాతా నిర్వహణ",
    "Your accounts. Your codes. Your control.": "మీ ఖాతాలు. మీ కోడ్‌లు. మీ నియంత్రణ.",
    "Keep your verification accounts in one place. Use the app's backup, restore, and device-lock options to manage your setup responsibly.":
      "మీ ధృవీకరణ ఖాతాలను ఒకచోట ఉంచండి. బ్యాకప్, పునరుద్ధరణ మరియు పరికర లాక్ ఎంపికలను ఉపయోగించండి.",
    "KAALKEY · AUTHENTICATOR": "కాల్‌కీ · ఆథెంటికేటర్",
    "KaalKey brand banner": "KaalKey బ్రాండ్ బ్యానర్",
    "KaalKey logo": "KaalKey లోగో",
    Service: "సేవ",
    Account: "ఖాతా",
    Back: "వెనక్కి",
    "Point your camera at the authenticator setup QR code from the service you are adding.":
      "మీరు జోడిస్తున్న సేవలోని ఆథెంటికేటర్ QR కోడ్\u200cపై కెమెరాను చూపండి.",
    "Use your camera to add an account instantly":
      "ఖాతాను వెంటనే జోడించడానికి కెమెరాను ఉపయోగించండి",
    "Upload QR Image": "QR చిత్రాన్ని అప్\u200cలోడ్ చేయండి",
    "Paste QR Image / URL": "QR చిత్రం / URL పేస్ట్ చేయండి",
    "Paste a copied QR image or authenticator setup URL":
      "కాపీ చేసిన QR చిత్రం లేదా ఆథెంటికేటర్ సెటప్ URL పేస్ట్ చేయండి",
    "TOTP SETUP URL": "TOTP సెటప్ URL",
    "ACCOUNT NAME": "ఖాతా పేరు",
    "Back to add account": "ఖాతా జోడించడానికి వెనక్కి",
    "Close backup": "బ్యాకప్‌ను మూసివేయండి",
    "Device authentication app lock": "పరికర ధృవీకరణ యాప్ లాక్",
    "Clear all authenticator accounts": "అన్ని ఆథెంటికేటర్ ఖాతాలను తొలగించండి",
    "Copy generated backup password": "సృష్టించిన బ్యాకప్ పాస్‌వర్డ్‌ను కాపీ చేయండి",
    "Backup password": "బ్యాకప్ పాస్‌వర్డ్",
    "Clear backup password": "బ్యాకప్ పాస్‌వర్డ్‌ను తొలగించండి",
    "Save this password separately (for example, in WhatsApp). Anyone with both the":
      "ఈ పాస్‌వర్డ్‌ను విడిగా భద్రపరచండి (ఉదాహరణకు WhatsApp‌లో). రెండూ ఉన్నవారు",
    "backup file and password can restore your authenticator accounts.":
      "బ్యాకప్ ఫైల్ మరియు పాస్‌వర్డ్‌తో మీ ఆథెంటికేటర్ ఖాతాలను పునరుద్ధరించగలరు.",
    "Encrypt and share backup": "బ్యాకప్‌ను ఎన్‌క్రిప్ట్ చేసి షేర్ చేయండి",
    "Choose file and import": "ఫైల్ ఎంచుకుని దిగుమతి చేయండి",
    "Update the service, account name, or secret key.":
      "సేవ, ఖాతా పేరు లేదా రహస్య కీని నవీకరించండి.",
    "Scan a QR code for the easiest setup, or enter details manually.":
      "సులభమైన సెటప్ కోసం QR కోడ్‌ను స్కాన్ చేయండి లేదా వివరాలను చేతితో నమోదు చేయండి.",
    "Turn flashlight off": "ఫ్లాష్‌లైట్ ఆపండి",
    "Turn flashlight on": "ఫ్లాష్‌లైట్ ప్రారంభించండి",
    "Flashlight on": "ఫ్లాష్‌లైట్ ఆన్",
    Flashlight: "ఫ్లాష్‌లైట్",
    "Keep the entire QR code visible. Your secret stays on this device.":
      "QR కోడ్ మొత్తం కనిపించేలా ఉంచండి. మీ రహస్యం ఈ పరికరంలోనే ఉంటుంది.",
    "Loading secure vault...": "సురక్షిత వాల్ట్ లోడ్ అవుతోంది...",
    "No accounts match your search.": "మీ శోధనకు సరిపోయే ఖాతాలు లేవు.",
    "Secret key, read-only while editing": "సవరించేటప్పుడు రహస్య కీ చదవడానికి మాత్రమే",
    "Secret key in Base32": "Base32 రహస్య కీ",
    digits: "అంకెలు",
    seconds: "సెకన్లు",
    "Use the secret key supplied by the service you are configuring. Never enter your account password here. Match the algorithm, digit count, and interval to the service’s setup instructions.":
      "మీరు సెటప్ చేస్తున్న సేవ అందించిన రహస్య కీని ఉపయోగించండి. మీ ఖాతా పాస్‌వర్డ్‌ను ఇక్కడ ఎప్పుడూ నమోదు చేయవద్దు. అల్గారిథమ్, అంకెల సంఖ్య, విరామాన్ని సేవ సెటప్ సూచనలతో సరిపోల్చండి.",
    "OR ENTER DETAILS MANUALLY": "లేదా వివరాలను చేతితో నమోదు చేయండి",
    "Hide manual entry": "మాన్యువల్ నమోదు దాచండి",
    "Enter details manually": "వివరాలను చేతితో నమోదు చేయండి",
    "Service, account name and secret key": "సేవ, ఖాతా పేరు మరియు రహస్య కీ",
    "Save changes securely": "మార్పులను సురక్షితంగా సేవ్ చేయండి",
    "Save account securely": "ఖాతాను సురక్షితంగా సేవ్ చేయండి",
    "YOUR LOCAL VAULT": "మీ స్థానిక వాల్ట్",
    "Securing your vault…": "మీ వాల్ట్\u200cను సురక్షితం చేస్తోంది…",
    "Your vault is protected": "మీ వాల్ట్ రక్షించబడింది",
    "Checking your secure lock settings. Your codes remain hidden.":
      "మీ సురక్షిత లాక్ సెట్టింగ్\u200cలను తనిఖీ చేస్తున్నాం. మీ కోడ్\u200cలు దాచబడి ఉంటాయి.",
    "Use your phone’s biometrics or screen-lock PIN, pattern, or password to access your one-time verification codes.":
      "మీ ఒక్కసారి ఉపయోగించే ధృవీకరణ కోడ్\u200cలను చూడటానికి ఫోన్ బయోమెట్రిక్స్ లేదా స్క్రీన్ లాక్ PIN, నమూనా లేదా పాస్\u200cవర్డ్ ఉపయోగించండి.",
    "Waiting for verification…": "ధృవీకరణ కోసం వేచి ఉంది…",
    "Unlock securely": "సురక్షితంగా అన్\u200cలాక్ చేయండి",
    "View QR code for account": "ఖాతా QR కోడ్\u200cను చూడండి",
    "Remove account": "ఖాతాను తొలగించండి",
    "Copy verification code": "ధృవీకరణ కోడ్\u200cను కాపీ చేయండి",
    "TAP TO COPY": "కాపీ చేయడానికి ట్యాప్ చేయండి",
    ACTIVE: "సక్రియం",

    "Camera unavailable. Open this page on HTTPS or localhost and allow camera access.":
      "కెమెరా అందుబాటులో లేదు. ఈ పేజీని HTTPS లేదా localhostలో తెరిచి కెమెరా అనుమతించండి.",
    "Camera preview is unavailable. Close and reopen the scanner.":
      "కెమెరా ప్రివ్యూ అందుబాటులో లేదు. స్కానర్\u200cను మూసి మళ్లీ తెరవండి.",
    "Camera ready — point it at the full QR code.":
      "కెమెరా సిద్ధంగా ఉంది — పూర్తి QR కోడ్ వైపు చూపండి.",
    "This browser cannot process camera frames.":
      "ఈ బ్రౌజర్ కెమెరా ఫ్రేమ్\u200cలను ప్రాసెస్ చేయలేదు.",
    "QR code detected.": "QR కోడ్ గుర్తించబడింది.",
    "Couldn't read camera frames. Check camera permissions and reload this page.":
      "కెమెరా ఫ్రేమ్\u200cలను చదవలేకపోయాం. కెమెరా అనుమతులను తనిఖీ చేసి పేజీని మళ్లీ లోడ్ చేయండి.",
    "Camera permission denied. Allow camera access in browser settings, then reopen the scanner.":
      "కెమెరా అనుమతి నిరాకరించబడింది. బ్రౌజర్ సెట్టింగ్\u200cలలో కెమెరా అనుమతించి స్కానర్\u200cను మళ్లీ తెరవండి.",
    "No camera was found on this device.": "ఈ పరికరంలో కెమెరా కనబడలేదు.",
    "The camera is busy in another app or browser tab.":
      "కెమెరా మరో యాప్ లేదా బ్రౌజర్ ట్యాబ్\u200cలో ఉపయోగంలో ఉంది.",
    "Could not start camera. Use HTTPS or localhost and check browser permissions.":
      "కెమెరాను ప్రారంభించలేకపోయాం. HTTPS లేదా localhost ఉపయోగించి బ్రౌజర్ అనుమతులను తనిఖీ చేయండి.",
    "QR scanner camera preview": "QR స్కానర్ కెమెరా ప్రివ్యూ",
    Version: "వెర్షన్",
    "Applies to KaalKey Authenticator": "KaalKey ఆథెంటికేటర్\u200cకు వర్తిస్తుంది",
    VERSION: "వెర్షన్",
    "1. Information and secrets": "1. సమాచారం మరియు రహస్యాలు",
    "KaalKey is an authenticator app. Account labels and the secret values needed to generate one-time codes are sensitive. The app is designed to store account records in the device’s secure storage. Anyone with access to an unlocked device or an exported backup may be able to access sensitive information.":
      "KaalKey ఒక ఆథెంటికేటర్ యాప్. ఖాతా పేర్లు మరియు ఒకసారి ఉపయోగించే కోడ్\u200cలకు అవసరమైన రహస్య విలువలు సున్నితమైనవి. ఖాతా వివరాలను పరికరంలోని సురక్షిత నిల్వలో ఉంచేలా యాప్ రూపొందించబడింది. అన్\u200cలాక్ చేసిన పరికరం లేదా ఎగుమతి చేసిన బ్యాకప్\u200cకు ప్రాప్యత ఉన్నవారు సున్నితమైన సమాచారాన్ని చూడగలరు.",
    "2. Permissions and device features": "2. అనుమతులు మరియు పరికర లక్షణాలు",
    "If you choose to scan a QR code, KaalKey uses camera permission for that action. Optional device authentication and haptic feedback use the relevant device features. You can manage permissions in your device settings.":
      "మీరు QR కోడ్\u200cను స్కాన్ చేస్తే, ఆ చర్య కోసం KaalKey కెమెరా అనుమతిని ఉపయోగిస్తుంది. ఐచ్ఛిక పరికర ధృవీకరణ మరియు హాప్టిక్ స్పందన సంబంధిత పరికర లక్షణాలను ఉపయోగిస్తాయి. పరికర సెట్టింగ్\u200cలలో అనుమతులను నిర్వహించవచ్చు.",
    "3. Backups": "3. బ్యాకప్\u200cలు",
    "When you create a backup, KaalKey encrypts the backup using a password you choose. Keep both the file and password private and store them securely. Anyone who obtains the file and its password may be able to restore your authenticator accounts. KaalKey cannot recover a forgotten backup password.":
      "మీరు బ్యాకప్ సృష్టించినప్పుడు, మీరు ఎంచుకున్న పాస్\u200cవర్డ్\u200cతో KaalKey దాన్ని గుప్తీకరిస్తుంది. ఫైల్ మరియు పాస్\u200cవర్డ్ రెండింటినీ గోప్యంగా, సురక్షితంగా ఉంచండి. ఫైల్ మరియు పాస్\u200cవర్డ్ పొందిన ఎవరైనా మీ ఆథెంటికేటర్ ఖాతాలను పునరుద్ధరించగలరు. మరచిపోయిన బ్యాకప్ పాస్\u200cవర్డ్\u200cను KaalKey తిరిగి పొందలదు.",
    "4. Sharing and third parties": "4. భాగస్వామ్యం మరియు మూడవ పక్షాలు",
    "The backup flow may use your device’s share sheet or file picker to save, transfer, or select files. The privacy practices of any third-party app or service you choose are governed by that provider. This notice does not make a blanket claim that your device, operating system, or chosen sharing services never process data.":
      "బ్యాకప్ ప్రక్రియ ఫైళ్లను సేవ్ చేయడానికి, బదిలీ చేయడానికి లేదా ఎంచుకోవడానికి మీ పరికరంలోని షేర్ షీట్ లేదా ఫైల్ పికర్\u200cను ఉపయోగించవచ్చు. మీరు ఎంచుకున్న మూడవ పక్ష యాప్ లేదా సేవ యొక్క గోప్యతా విధానాలు ఆ ప్రదాత నియమాలపై ఆధారపడతాయి. మీ పరికరం, ఆపరేటింగ్ సిస్టమ్ లేదా షేరింగ్ సేవలు ఎప్పుడూ డేటాను ప్రాసెస్ చేయవని ఈ ప్రకటన హామీ ఇవ్వదు.",
    "5. Security and retention": "5. భద్రత మరియు నిల్వ",
    "Keep your device updated, protect it with a screen lock, and do not share OTP secrets or backup passwords. Removing the app, clearing its data, or losing the device may make locally stored accounts unavailable. Maintain a secure backup if you need recovery.":
      "మీ పరికరాన్ని నవీకరించండి, స్క్రీన్ లాక్\u200cతో రక్షించండి, OTP రహస్యాలు లేదా బ్యాకప్ పాస్\u200cవర్డ్\u200cలను పంచుకోవద్దు. యాప్\u200cను తొలగించడం, దాని డేటాను క్లియర్ చేయడం లేదా పరికరాన్ని కోల్పోవడం వల్ల స్థానిక ఖాతాలు అందుబాటులో లేకపోవచ్చు. పునరుద్ధరణ అవసరమైతే సురక్షిత బ్యాకప్\u200cను ఉంచండి.",
    "6. Changes and contact": "6. మార్పులు మరియు సంప్రదింపు",
    "This embedded notice may be revised in a future app release. For privacy questions, contact the app publisher through the official support channel provided with the app.":
      "ఈ గోప్యతా ప్రకటనను భవిష్యత్తు యాప్ విడుదలలో సవరించవచ్చు. గోప్యతా ప్రశ్నల కోసం, యాప్\u200cతో అందించిన అధికారిక మద్దతు మార్గం ద్వారా ప్రచురణకర్తను సంప్రదించండి.",
    "1. Your use": "1. మీ వినియోగం",
    "You may use KaalKey to generate verification codes for accounts you are authorized to access. You are responsible for complying with applicable laws and the rules of the services for which you use authentication codes.":
      "మీకు ప్రాప్యతకు అనుమతి ఉన్న ఖాతాల కోసం ధృవీకరణ కోడ్\u200cలను రూపొందించడానికి KaalKeyని ఉపయోగించవచ్చు. వర్తించే చట్టాలు మరియు సంబంధిత సేవల నియమాలను పాటించడం మీ బాధ్యత.",
    "2. Protect your accounts": "2. మీ ఖాతాలను రక్షించండి",
    "You are responsible for securing your device, authenticator secrets, recovery methods, exported backups, and backup passwords. Do not share codes or secrets with people you do not trust.":
      "మీ పరికరం, ఆథెంటికేటర్ రహస్యాలు, పునరుద్ధరణ పద్ధతులు, ఎగుమతి చేసిన బ్యాకప్\u200cలు మరియు బ్యాకప్ పాస్\u200cవర్డ్\u200cలను సురక్షితంగా ఉంచడం మీ బాధ్యత. నమ్మని వ్యక్తులతో కోడ్\u200cలు లేదా రహస్యాలను పంచుకోవద్దు.",
    "3. No recovery guarantee": "3. పునరుద్ధరణకు హామీ లేదు",
    "KaalKey cannot guarantee that every account can be recovered, that every QR code or configuration will be compatible, or that the app will operate without interruption or error. Keep alternative recovery methods provided by the relevant service.":
      "ప్రతి ఖాతాను తిరిగి పొందగలమని, ప్రతి QR కోడ్ లేదా కాన్ఫిగరేషన్ అనుకూలంగా ఉంటుందని, లేదా యాప్ అంతరాయం లేదా లోపం లేకుండా పనిచేస్తుందని KaalKey హామీ ఇవ్వదు. సంబంధిత సేవ అందించే ప్రత్యామ్నాయ పునరుద్ధరణ పద్ధతులను ఉంచండి.",
    "4. No professional advice": "4. వృత్తిపరమైన సలహా కాదు",
    "The app is a utility and does not provide legal, financial, or security incident-response advice. If an account is compromised, follow the affected service’s official recovery and security guidance.":
      "ఈ యాప్ ఒక సాధనం మాత్రమే; చట్టపరమైన, ఆర్థిక లేదా భద్రతా సంఘటనల స్పందన సలహా ఇవ్వదు. ఖాతా దుర్వినియోగానికి గురైతే, సంబంధిత సేవ యొక్క అధికారిక పునరుద్ధరణ మరియు భద్రతా సూచనలను అనుసరించండి.",
    "5. Changes and availability": "5. మార్పులు మరియు అందుబాటు",
    "Features may change between releases. You should keep the app updated and periodically verify that your backup and recovery arrangements work.":
      "విడుదలల మధ్య ఫీచర్లు మారవచ్చు. యాప్\u200cను నవీకరించి, మీ బ్యాకప్ మరియు పునరుద్ధరణ ఏర్పాట్లు పనిచేస్తున్నాయో అప్పుడప్పుడు తనిఖీ చేయండి.",
    "6. Liability and applicable law": "6. బాధ్యత మరియు వర్తించే చట్టం",
    "To the extent permitted by applicable law, the app is provided without a guarantee of uninterrupted or error-free operation. Nothing in these terms excludes rights or remedies that cannot legally be excluded. Any further limitations or governing-law terms should be reviewed by a qualified lawyer for the publisher’s jurisdiction before release.":
      "వర్తించే చట్టం అనుమతించే మేరకు, యాప్ నిరంతరంగా లేదా లోపాలు లేకుండా పనిచేస్తుందని హామీ లేకుండా అందించబడుతుంది. చట్టపరంగా మినహాయించలేని హక్కులు లేదా పరిహారాలను ఈ నిబంధనలు మినహాయించవు. ప్రచురణకర్త ప్రాంతానికి వర్తించే అదనపు పరిమితులు లేదా చట్ట నిబంధనలను విడుదలకు ముందు అర్హత కలిగిన న్యాయవాది సమీక్షించాలి.",
    account: "ఖాతా",
    accounts: "ఖాతాలు",
    "Backup export description":
      "{count} సేవ్ చేసిన {accountLabel}ను బ్యాకప్ ఫైల్‌గా ఎన్‌క్రిప్ట్ చేయండి. KaalKey ప్రత్యేకమైన పాస్‌వర్డ్‌ను రూపొందిస్తుంది; దాన్ని కాపీ చేసి ఫైల్‌కు వేరుగా భద్రపరచండి.",
    "Backup restore description":
      "మీ KaalKey బ్యాకప్ ఫైల్‌ను మరియు పాస్‌వర్డ్‌ను ఎంచుకోండి. కొత్త ఖాతాలు మీ ప్రస్తుత ఖాతాల జాబితాకు జోడించబడతాయి; ఇప్పటికే ఉన్న ఖాతాలు అలాగే ఉంటాయి.",
    "Starting camera…": "కెమెరా ప్రారంభిస్తోంది…",
    "Resize app and brand panels": "Resize app and brand panels",
  },

  hi: {
    language: "भाषा",
    languageDescription: "KaalKey में उपयोग की जाने वाली भाषा चुनें।",
    english: "अंग्रेज़ी",
    telugu: "तेलुगु",
    hindi: "हिन्दी",
    "App settings": "ऐप सेटिंग्स",
    "KAALKEY PREFERENCES": "KAALKEY प्राथमिकताएँ",
    LANGUAGE: "भाषा",
    EXPERIENCE: "अनुभव",
    SECURITY: "सुरक्षा",
    "BACKUP & RECOVERY": "बैकअप और पुनर्प्राप्ति",
    "DANGER ZONE": "खतरे का क्षेत्र",
    APPEARANCE: "रूप",
    "Haptic feedback": "हैप्टिक प्रतिक्रिया",
    "Gentle feedback for taps and completed actions.":
      "टैप और पूर्ण किए गए कार्यों के लिए हल्की प्रतिक्रिया।",
    "Device authentication lock": "डिवाइस प्रमाणीकरण लॉक",
    "Your vault locks when KaalKey leaves the foreground.":
      "KaalKey के बैकग्राउंड में जाने पर आपका वॉल्ट लॉक हो जाता है।",
    "Require your phone’s biometrics or screen-lock PIN, pattern, or password.":
      "अपने फ़ोन का बायोमेट्रिक या स्क्रीन लॉक PIN, पैटर्न या पासवर्ड आवश्यक करें।",
    "Create backup": "बैकअप बनाएँ",
    "Encrypted file": "एन्क्रिप्टेड फ़ाइल",
    "Restore backup": "बैकअप पुनर्स्थापित करें",
    "Backup safety note":
      "बैकअप में आपके ऑथेंटिकेटर रहस्य होते हैं। KaalKey हर बैकअप के लिए एक अलग पासवर्ड बनाता है। उसे अलग से सुरक्षित रखें; KaalKey उसे पुनर्प्राप्त नहीं कर सकता।",
    "Generating secure password…": "सुरक्षित पासवर्ड बनाया जा रहा है…",
    "Import file": "फ़ाइल आयात करें",
    "Clear all accounts": "सभी खाते हटाएँ",
    "Permanently remove every account and secret from this device. Back up first.":
      "इस डिवाइस से सभी खाते और रहस्य स्थायी रूप से हटाएँ। पहले बैकअप लें।",
    "Light appearance": "लाइट थीम",
    "KaalKey currently uses its clean light theme.":
      "KaalKey अभी अपनी साफ़ लाइट थीम का उपयोग करता है।",
    "Legal & privacy": "कानूनी जानकारी और गोपनीयता",
    "Review the Privacy Policy and Terms of Use.": "गोपनीयता नीति और उपयोग की शर्तें देखें।",
    "Your authenticator secrets stay in the on-device secure vault. Preferences are stored locally.":
      "आपके ऑथेंटिकेटर रहस्य डिवाइस के सुरक्षित वॉल्ट में रहते हैं। प्राथमिकताएँ स्थानीय रूप से संग्रहीत हैं।",
    Done: "पूर्ण",
    "SECURE VAULT": "सुरक्षित वॉल्ट",
    "BACKUP PASSWORD": "बैकअप पासवर्ड",
    "Copy generated password": "बनाया गया पासवर्ड कॉपी करें",
    Cancel: "रद्द करें",
    "Close settings": "सेटिंग्स बंद करें",
    "Search language (name or code)": "भाषा खोजें (नाम या कोड)",
    "Search supported languages": "समर्थित भाषाएँ खोजें",
    "Close language dropdown": "भाषा सूची बंद करें",
    "No translated language found.": "कोई भाषा नहीं मिली।",
    "Add account": "खाता जोड़ें",
    "Add your first account": "अपना पहला खाता जोड़ें",
    "Add an account using its secret key to generate your first verification code.":
      "अपना पहला सत्यापन कोड बनाने के लिए गुप्त कुंजी से खाता जोड़ें।",
    "Search accounts": "खाते खोजें",
    "Search service or account": "सेवा या खाता खोजें",
    "Scan QR code": "QR कोड स्कैन करें",
    "Scan authenticator QR code": "ऑथेंटिकेटर QR कोड स्कैन करें",
    "Upload QR image": "QR छवि अपलोड करें",
    "Choose a QR screenshot from Gallery, Photos, or Files":
      "गैलरी, फ़ोटो या फ़ाइलों से QR स्क्रीनशॉट चुनें",
    "Enter details manually instead": "इसके बजाय विवरण मैन्युअल रूप से दर्ज करें",
    "Service or issuer": "सेवा या जारीकर्ता",
    "Account name": "खाता नाम",
    "Secret key": "गुप्त कुंजी",
    Save: "सहेजें",
    Delete: "हटाएँ",
    Edit: "संपादित करें",
    Close: "बंद करें",
    "Enter backup password": "बैकअप पासवर्ड दर्ज करें",
    "Your secrets stay stored on this device.": "आपके रहस्य इसी डिवाइस पर संग्रहीत रहते हैं।",
    "Camera unavailable. Check camera permission and try again.":
      "कैमरा उपलब्ध नहीं है। कैमरा अनुमति जाँचें और फिर कोशिश करें।",
    "Your accounts": "आपके खाते",
    "+ Add": "+ जोड़ें",
    "Your vault starts here": "आपका वॉल्ट यहाँ शुरू होता है",
    "KAALKEY AUTHENTICATOR": "कालकी ऑथेंटिकेटर",
    "Your codes. Your device. Your control.": "आपके कोड। आपका डिवाइस। आपका नियंत्रण।",
    "Account QR code": "खाता QR कोड",
    "Reveal QR code": "QR कोड दिखाएँ",
    "QR export warning":
      "इस QR कोड को स्कैन करने वाला कोई भी व्यक्ति इस खाते के सत्यापन कोड बना सकता है। इसे केवल भरोसेमंद स्क्रीन पर दिखाएँ।",
    "QR privacy hint":
      "इस QR कोड को निजी रखें। इसे स्कैन करने से खाते की ऑथेंटिकेटर गुप्त कुंजी कॉपी हो जाती है।",
    "SECURE SETUP": "सुरक्षित सेटअप",
    "SERVICE / ISSUER": "सेवा / जारीकर्ता",
    "e.g. Google": "जैसे Google",
    "Clear service or issuer": "सेवा या जारीकर्ता साफ़ करें",
    "e.g. you@example.com": "जैसे you@example.com",
    "Clear account name": "खाता नाम साफ़ करें",
    "SECRET KEY (LOCKED)": "गुप्त कुंजी (लॉक)",
    "SECRET KEY (BASE32)": "गुप्त कुंजी (BASE32)",
    "Enter your setup key": "अपनी सेटअप कुंजी दर्ज करें",
    "Clear secret key": "गुप्त कुंजी साफ़ करें",
    "OTP ALGORITHM": "OTP एल्गोरिदम",
    "OTP DIGITS": "OTP अंक",
    "REFRESH INTERVAL (SECONDS)": "रिफ़्रेश अंतराल (सेकंड)",
    "OTP refresh interval in seconds": "सेकंड में OTP रिफ़्रेश अंतराल",
    "Clear search": "खोज साफ़ करें",
    "Sort by service name": "सेवा के नाम से क्रमबद्ध करें",
    "Sort by account name": "खाते के नाम से क्रमबद्ध करें",
    "SORT BY": "क्रमबद्ध करें",
    "Close account form": "खाता फ़ॉर्म बंद करें",
    "TOTP setup URL": "TOTP सेटअप URL",
    "Import setup URL": "सेटअप URL आयात करें",
    "KaalKey tricolour lock emblem": "KaalKey तिरंगा लॉक चिह्न",
    "Disable app lock": "ऐप लॉक बंद करें",
    "Enable app lock": "ऐप लॉक चालू करें",
    "LOCK ON": "लॉक चालू",

    "Open app settings": "ऐप सेटिंग खोलें",
    AUTHENTICATOR: "ऑथेंटिकेटर",
    "LOCAL VAULT": "स्थानीय वॉल्ट",
    "Privacy Policy": "गोपनीयता नीति",
    "Terms of Use": "उपयोग की शर्तें",
    Working: "काम हो रहा है",
    "Please wait…": "कृपया प्रतीक्षा करें…",
    "Please don’t close or interact with KaalKey.":
      "कृपया KaalKey को बंद न करें या उसमें बदलाव न करें।",
    "Original multicolour KaalKey authenticator emblem": "KaalKey का मूल बहुरंगी ऑथेंटिकेटर चिह्न",
    "Legal & Privacy Notice": "कानूनी और गोपनीयता सूचना",
    "Legal information": "कानूनी जानकारी",
    "Please review both documents before using KaalKey. They are included in the app and available offline.":
      "KaalKey का उपयोग करने से पहले दोनों दस्तावेज़ पढ़ें। वे ऐप में शामिल हैं और ऑफ़लाइन उपलब्ध हैं।",
    "Review KaalKey’s privacy information and terms of use.":
      "KaalKey की गोपनीयता जानकारी और उपयोग की शर्तें देखें।",
    "I have read and agree to the Privacy Policy and Terms of Use.":
      "मैंने गोपनीयता नीति और उपयोग की शर्तें पढ़ ली हैं और सहमत हूँ।",
    "Saving…": "सेव हो रहा है…",
    "Accept & Continue": "स्वीकार करें और जारी रखें",

    "Time-based codes": "समय-आधारित कोड",
    "Generate rotating one-time passcodes for your accounts to complete two-step verification.":
      "दो-चरणीय सत्यापन के लिए अपने खातों के बदलते वन-टाइम कोड बनाएँ।",
    "Quick account setup": "त्वरित खाता सेटअप",
    "Scan an authenticator QR code or import a QR image to add an account.":
      "खाता जोड़ने के लिए ऑथेंटिकेटर QR कोड स्कैन करें या QR छवि आयात करें।",
    "Accounts in one place": "सभी खाते एक जगह",
    "Keep your saved accounts together and find the right entry when it is time to sign in.":
      "अपने खाते एक जगह रखें और साइन इन करते समय सही खाता ढूँढें।",
    "Backup & restore": "बैकअप और पुनर्स्थापना",
    "Back up your authenticator data and restore it when you move to another device.":
      "ऑथेंटिकेटर डेटा का बैकअप लें और दूसरे डिवाइस पर जाने पर उसे पुनर्स्थापित करें।",
    "Private account vault": "निजी खाता वॉल्ट",
    "Manage your authenticator entries locally and use the app's available device-lock option.":
      "अपने ऑथेंटिकेटर खातों को स्थानीय रूप से प्रबंधित करें और डिवाइस लॉक विकल्प का उपयोग करें।",
    "Easy code access": "कोड तक आसान पहुँच",
    "Copy a current code or manage account details through a clean, focused interface.":
      "वर्तमान कोड कॉपी करें या सरल इंटरफ़ेस में खाते का विवरण प्रबंधित करें।",
    "AUTHENTICATOR · BY TECHSIVARAM": "ऑथेंटिकेटर · TECHSIVARAM द्वारा",
    "YOUR MOBILE AUTHENTICATOR": "आपका मोबाइल ऑथेंटिकेटर",
    "A simpler way to manage your two-step verification.":
      "दो-चरणीय सत्यापन प्रबंधित करने का आसान तरीका।",
    "A focused authenticator experience for time-based verification codes. Keep compatible account codes close at hand with KaalKey for Android.":
      "समय-आधारित सत्यापन कोड के लिए सरल ऑथेंटिकेटर। Android के KaalKey में अपने खाते के कोड आसानी से पाएँ।",
    "TIME-BASED CODES": "समय-आधारित कोड",
    "PRIVATE BY DESIGN": "डिज़ाइन से ही निजी",
    "BUILT FOR A SIMPLE AUTHENTICATOR WORKFLOW": "सरल ऑथेंटिकेटर प्रक्रिया के लिए बनाया गया",
    "QR SETUP · TIMED CODES · ACCOUNT MANAGEMENT": "QR सेटअप · समयबद्ध कोड · खाता प्रबंधन",
    "Your accounts. Your codes. Your control.": "आपके खाते। आपके कोड। आपका नियंत्रण।",
    "Keep your verification accounts in one place. Use the app's backup, restore, and device-lock options to manage your setup responsibly.":
      "अपने सत्यापन खाते एक जगह रखें। सेटअप प्रबंधित करने के लिए बैकअप, पुनर्स्थापना और डिवाइस लॉक विकल्पों का उपयोग करें।",
    "KAALKEY · AUTHENTICATOR": "KAALKEY · ऑथेंटिकेटर",
    "KaalKey brand banner": "KaalKey ब्रांड बैनर",
    "KaalKey logo": "KaalKey लोगो",
    Service: "सेवा",
    Account: "खाता",
    Back: "वापस",
    "Point your camera at the authenticator setup QR code from the service you are adding.":
      "जिस सेवा को जोड़ रहे हैं, उसके ऑथेंटिकेटर QR कोड पर कैमरा रखें।",
    "Use your camera to add an account instantly": "खाता तुरंत जोड़ने के लिए कैमरे का उपयोग करें",
    "Upload QR Image": "QR छवि अपलोड करें",
    "Paste QR Image / URL": "QR छवि / URL पेस्ट करें",
    "Paste a copied QR image or authenticator setup URL":
      "कॉपी की गई QR छवि या ऑथेंटिकेटर सेटअप URL पेस्ट करें",
    "TOTP SETUP URL": "TOTP सेटअप URL",
    "ACCOUNT NAME": "खाता नाम",
    "Back to add account": "खाता जोड़ने पर वापस जाएँ",
    "Close backup": "बैकअप बंद करें",
    "Device authentication app lock": "डिवाइस प्रमाणीकरण ऐप लॉक",
    "Clear all authenticator accounts": "सभी ऑथेंटिकेटर खाते हटाएँ",
    "Copy generated backup password": "बनाया गया बैकअप पासवर्ड कॉपी करें",
    "Backup password": "बैकअप पासवर्ड",
    "Clear backup password": "बैकअप पासवर्ड साफ़ करें",
    "Save this password separately (for example, in WhatsApp). Anyone with both the":
      "इस पासवर्ड को अलग से सुरक्षित रखें (जैसे WhatsApp में)। जिसके पास दोनों हों",
    "backup file and password can restore your authenticator accounts.":
      "वह बैकअप फ़ाइल और पासवर्ड से आपके ऑथेंटिकेटर खाते पुनर्स्थापित कर सकता है।",
    "Encrypt and share backup": "बैकअप एन्क्रिप्ट करके साझा करें",
    "Choose file and import": "फ़ाइल चुनें और आयात करें",
    "Secret key, read-only while editing": "संपादन के दौरान गुप्त कुंजी केवल पढ़ने योग्य है",
    "Secret key in Base32": "Base32 में गुप्त कुंजी",
    digits: "अंक",
    seconds: "सेकंड",
    "Use the secret key supplied by the service you are configuring. Never enter your account password here. Match the algorithm, digit count, and interval to the service’s setup instructions.":
      "जिस सेवा को सेट कर रहे हैं उसकी दी हुई गुप्त कुंजी इस्तेमाल करें। यहाँ कभी भी अपने खाते का पासवर्ड न डालें। एल्गोरिदम, अंकों की संख्या और अंतराल सेवा के सेटअप निर्देशों से मिलाएँ।",
    "OR ENTER DETAILS MANUALLY": "या विवरण मैन्युअल रूप से दर्ज करें",
    "Hide manual entry": "मैन्युअल प्रविष्टि छिपाएँ",
    "Enter details manually": "विवरण मैन्युअल रूप से दर्ज करें",
    "Service, account name and secret key": "सेवा, खाते का नाम और गुप्त कुंजी",
    "Save changes securely": "बदलाव सुरक्षित रूप से सहेजें",
    "Save account securely": "खाता सुरक्षित रूप से सहेजें",
    "YOUR LOCAL VAULT": "आपका स्थानीय वॉल्ट",
    "Securing your vault…": "आपका वॉल्ट सुरक्षित किया जा रहा है…",
    "Your vault is protected": "आपका वॉल्ट सुरक्षित है",
    "Checking your secure lock settings. Your codes remain hidden.":
      "आपकी सुरक्षित लॉक सेटिंग जाँची जा रही हैं। आपके कोड छिपे रहेंगे।",
    "Use your phone’s biometrics or screen-lock PIN, pattern, or password to access your one-time verification codes.":
      "अपने वन-टाइम सत्यापन कोड देखने के लिए फ़ोन का बायोमेट्रिक्स या स्क्रीन लॉक PIN, पैटर्न अथवा पासवर्ड इस्तेमाल करें।",
    "Waiting for verification…": "सत्यापन की प्रतीक्षा…",
    "Unlock securely": "सुरक्षित रूप से अनलॉक करें",
    "View QR code for account": "खाते का QR कोड देखें",
    "Remove account": "खाता हटाएँ",
    "Copy verification code": "सत्यापन कोड कॉपी करें",
    "TAP TO COPY": "कॉपी करने के लिए टैप करें",
    ACTIVE: "सक्रिय",

    "Camera unavailable. Open this page on HTTPS or localhost and allow camera access.":
      "कैमरा उपलब्ध नहीं है। इस पेज को HTTPS या localhost पर खोलें और कैमरा अनुमति दें।",
    "Camera preview is unavailable. Close and reopen the scanner.":
      "कैमरा पूर्वावलोकन उपलब्ध नहीं है। स्कैनर बंद करके फिर खोलें।",
    "Camera ready — point it at the full QR code.": "कैमरा तैयार है — इसे पूरे QR कोड की ओर रखें।",
    "This browser cannot process camera frames.": "यह ब्राउज़र कैमरा फ़्रेम संसाधित नहीं कर सकता।",
    "QR code detected.": "QR कोड मिल गया।",
    "Couldn't read camera frames. Check camera permissions and reload this page.":
      "कैमरा फ़्रेम पढ़ नहीं सके। कैमरा अनुमति जाँचें और पेज फिर से लोड करें।",
    "Camera permission denied. Allow camera access in browser settings, then reopen the scanner.":
      "कैमरा अनुमति नहीं मिली। ब्राउज़र सेटिंग्स में कैमरा अनुमति दें और स्कैनर फिर खोलें।",
    "No camera was found on this device.": "इस डिवाइस पर कोई कैमरा नहीं मिला।",
    "The camera is busy in another app or browser tab.":
      "कैमरा किसी अन्य ऐप या ब्राउज़र टैब में उपयोग हो रहा है।",
    "Could not start camera. Use HTTPS or localhost and check browser permissions.":
      "कैमरा शुरू नहीं हो सका। HTTPS या localhost का उपयोग करें और ब्राउज़र अनुमति जाँचें।",
    "QR scanner camera preview": "QR स्कैनर कैमरा पूर्वावलोकन",
    Version: "संस्करण",
    "Applies to KaalKey Authenticator": "KaalKey ऑथेंटिकेटर पर लागू",
    VERSION: "संस्करण",
    "1. Information and secrets": "1. जानकारी और गोपनीय जानकारी",
    "KaalKey is an authenticator app. Account labels and the secret values needed to generate one-time codes are sensitive. The app is designed to store account records in the device’s secure storage. Anyone with access to an unlocked device or an exported backup may be able to access sensitive information.":
      "KaalKey एक ऑथेंटिकेटर ऐप है। खाते के नाम और एक बार उपयोग होने वाले कोड बनाने के लिए आवश्यक गुप्त मान संवेदनशील हैं। ऐप खाते के रिकॉर्ड को डिवाइस के सुरक्षित संग्रहण में रखने के लिए बनाया गया है। अनलॉक डिवाइस या निर्यात किए गए बैकअप तक पहुँच रखने वाला व्यक्ति संवेदनशील जानकारी देख सकता है।",
    "2. Permissions and device features": "2. अनुमतियाँ और डिवाइस सुविधाएँ",
    "If you choose to scan a QR code, KaalKey uses camera permission for that action. Optional device authentication and haptic feedback use the relevant device features. You can manage permissions in your device settings.":
      "यदि आप QR कोड स्कैन करते हैं, तो KaalKey उस कार्य के लिए कैमरा अनुमति का उपयोग करता है। वैकल्पिक डिवाइस प्रमाणीकरण और हैप्टिक प्रतिक्रिया संबंधित डिवाइस सुविधाओं का उपयोग करते हैं। आप डिवाइस सेटिंग्स में अनुमतियाँ प्रबंधित कर सकते हैं।",
    "3. Backups": "3. बैकअप",
    "When you create a backup, KaalKey encrypts the backup using a password you choose. Keep both the file and password private and store them securely. Anyone who obtains the file and its password may be able to restore your authenticator accounts. KaalKey cannot recover a forgotten backup password.":
      "बैकअप बनाते समय KaalKey आपके चुने हुए पासवर्ड से उसे एन्क्रिप्ट करता है। फ़ाइल और पासवर्ड दोनों को निजी और सुरक्षित रखें। फ़ाइल और पासवर्ड प्राप्त करने वाला व्यक्ति आपके ऑथेंटिकेटर खाते पुनर्स्थापित कर सकता है। KaalKey भूला हुआ बैकअप पासवर्ड पुनर्प्राप्त नहीं कर सकता।",
    "4. Sharing and third parties": "4. साझा करना और तृतीय पक्ष",
    "The backup flow may use your device’s share sheet or file picker to save, transfer, or select files. The privacy practices of any third-party app or service you choose are governed by that provider. This notice does not make a blanket claim that your device, operating system, or chosen sharing services never process data.":
      "बैकअप प्रक्रिया फ़ाइलों को सहेजने, स्थानांतरित करने या चुनने के लिए आपके डिवाइस के शेयर विकल्प या फ़ाइल चयनकर्ता का उपयोग कर सकती है। आपके चुने हुए तृतीय-पक्ष ऐप या सेवा की गोपनीयता नीतियाँ उस प्रदाता द्वारा निर्धारित होती हैं। यह सूचना यह दावा नहीं करती कि आपका डिवाइस, ऑपरेटिंग सिस्टम या चुनी हुई साझा सेवाएँ कभी डेटा संसाधित नहीं करतीं।",
    "5. Security and retention": "5. सुरक्षा और डेटा रखना",
    "Keep your device updated, protect it with a screen lock, and do not share OTP secrets or backup passwords. Removing the app, clearing its data, or losing the device may make locally stored accounts unavailable. Maintain a secure backup if you need recovery.":
      "अपने डिवाइस को अपडेट रखें, स्क्रीन लॉक से सुरक्षित करें और OTP रहस्य या बैकअप पासवर्ड साझा न करें। ऐप हटाने, उसका डेटा साफ़ करने या डिवाइस खोने से स्थानीय खाते अनुपलब्ध हो सकते हैं। पुनर्प्राप्ति के लिए सुरक्षित बैकअप रखें।",
    "6. Changes and contact": "6. बदलाव और संपर्क",
    "This embedded notice may be revised in a future app release. For privacy questions, contact the app publisher through the official support channel provided with the app.":
      "इस सूचना को भविष्य के ऐप रिलीज़ में संशोधित किया जा सकता है। गोपनीयता प्रश्नों के लिए ऐप के साथ दिए गए आधिकारिक सहायता माध्यम से प्रकाशक से संपर्क करें।",
    "1. Your use": "1. आपका उपयोग",
    "You may use KaalKey to generate verification codes for accounts you are authorized to access. You are responsible for complying with applicable laws and the rules of the services for which you use authentication codes.":
      "आप उन खातों के लिए सत्यापन कोड बनाने हेतु KaalKey का उपयोग कर सकते हैं जिन तक पहुँचने की अनुमति है। लागू कानूनों और संबंधित सेवाओं के नियमों का पालन करना आपकी ज़िम्मेदारी है।",
    "2. Protect your accounts": "2. अपने खातों की सुरक्षा करें",
    "You are responsible for securing your device, authenticator secrets, recovery methods, exported backups, and backup passwords. Do not share codes or secrets with people you do not trust.":
      "अपने डिवाइस, ऑथेंटिकेटर रहस्य, पुनर्प्राप्ति तरीके, निर्यात किए गए बैकअप और बैकअप पासवर्ड सुरक्षित रखना आपकी ज़िम्मेदारी है। भरोसा न होने वाले लोगों से कोड या रहस्य साझा न करें।",
    "3. No recovery guarantee": "3. पुनर्प्राप्ति की गारंटी नहीं",
    "KaalKey cannot guarantee that every account can be recovered, that every QR code or configuration will be compatible, or that the app will operate without interruption or error. Keep alternative recovery methods provided by the relevant service.":
      "KaalKey यह गारंटी नहीं देता कि हर खाते को पुनर्प्राप्त किया जा सकेगा, हर QR कोड या कॉन्फ़िगरेशन संगत होगा, या ऐप बिना रुकावट अथवा त्रुटि के चलेगा। संबंधित सेवा के वैकल्पिक पुनर्प्राप्ति तरीके रखें।",
    "4. No professional advice": "4. पेशेवर सलाह नहीं",
    "The app is a utility and does not provide legal, financial, or security incident-response advice. If an account is compromised, follow the affected service’s official recovery and security guidance.":
      "यह ऐप एक उपयोगिता है और कानूनी, वित्तीय या सुरक्षा घटना-प्रतिक्रिया सलाह नहीं देता। खाता प्रभावित होने पर संबंधित सेवा के आधिकारिक पुनर्प्राप्ति और सुरक्षा निर्देशों का पालन करें।",
    "5. Changes and availability": "5. बदलाव और उपलब्धता",
    "Features may change between releases. You should keep the app updated and periodically verify that your backup and recovery arrangements work.":
      "रिलीज़ के बीच सुविधाएँ बदल सकती हैं। ऐप अपडेट रखें और समय-समय पर जाँचें कि बैकअप और पुनर्प्राप्ति व्यवस्था काम करती है।",
    "6. Liability and applicable law": "6. दायित्व और लागू कानून",
    "To the extent permitted by applicable law, the app is provided without a guarantee of uninterrupted or error-free operation. Nothing in these terms excludes rights or remedies that cannot legally be excluded. Any further limitations or governing-law terms should be reviewed by a qualified lawyer for the publisher’s jurisdiction before release.":
      "लागू कानून की अनुमति की सीमा तक, ऐप निर्बाध या त्रुटि-मुक्त संचालन की गारंटी के बिना प्रदान किया जाता है। इन शर्तों में ऐसे अधिकार या उपाय शामिल नहीं हैं जिन्हें कानूनन हटाया नहीं जा सकता। प्रकाशक के क्षेत्राधिकार की अतिरिक्त सीमाओं या लागू कानून की शर्तों की रिलीज़ से पहले योग्य वकील समीक्षा करें।",
    account: "खाता",
    accounts: "खाते",
    "Backup export description":
      "{count} सहेजे गए {accountLabel} को बैकअप फ़ाइल में एन्क्रिप्ट करें। KaalKey एक विशिष्ट पासवर्ड बनाता है; उसे कॉपी करके फ़ाइल से अलग सुरक्षित रखें.",
    "Backup restore description":
      "अपनी KaalKey बैकअप फ़ाइल और पासवर्ड चुनें। नए खाते आपकी मौजूदा खाते की सूची में जोड़े जाएंगे; मौजूदा खाते वैसे ही रहेंगे.",
    "Starting camera…": "कैमरा शुरू हो रहा है…",
    "Resize app and brand panels": "ऐप और ब्रांड पैनल का आकार बदलें",
    "-": "-",
    AUTHENTICATOR: "ఆథెంటికేటర్",
    Account: "ఖాతా",
    Back: "వెనుకకు",
    Cancel: "రద్దు",
    Close: "మూసివేయండి",
    Done: "పూర్తయింది",
    Edit: "సవరించండి",
    Flashlight: "ఫ్లాష్లైట్",
    SECURITY: "భద్రత",
    Service: "సేవ",
    VERSION: "వెర్షన్",
    Version: "వెర్షన్",
    Working: "పని జరుగుతోంది",
    a: "a",
    canvas: "క్యాన్వాస్",
    digits: "అంకెలు",
    "expo-crypto": "expo-crypto",
    img: "చిత్రం",
    input: "ఇన్‌పుట్",
    privacy: "గోప్యత",
    seconds: "సెకన్లు",
    terms: "నిబంధనలు",
  },
};

export function detectLanguage(): AppLanguage {
  const candidates = [
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().locale : "",
    (globalThis as any)?.navigator?.language ?? "",
  ];
  for (const candidate of candidates) {
    const code = candidate.toLowerCase().split(/[-_]/)[0];
    if (code === "te" || code === "hi" || code === "en") return code;
  }
  return "en";
}

export function translate(language: AppLanguage, key: string): string {
  return dictionaries[language][key] ?? dictionaries.en[key] ?? key;
}

let currentLanguage: AppLanguage = detectLanguage();
let languageInitialized = false;
const languageListeners = new Set<(language: AppLanguage) => void>();

function publishLanguage(language: AppLanguage) {
  currentLanguage = language;
  languageListeners.forEach((listener) => listener(language));
}

export function useAppLanguage() {
  const [language, setLanguageState] = useState<AppLanguage>(currentLanguage);

  useEffect(() => {
    const listener = (next: AppLanguage) => setLanguageState(next);
    languageListeners.add(listener);
    if (!languageInitialized) {
      languageInitialized = true;
      SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY)
        .then((saved) => {
          if (saved === "en" || saved === "te" || saved === "hi") publishLanguage(saved);
        })
        .catch(() => undefined);
    }
    return () => {
      languageListeners.delete(listener);
    };
  }, []);

  const setLanguage = useCallback(async (next: AppLanguage) => {
    publishLanguage(next);
    try {
      await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, next);
    } catch {
      /* keep the in-memory choice */
    }
  }, []);

  return { language, setLanguage, t: (key: string) => translate(language, key) };
}
