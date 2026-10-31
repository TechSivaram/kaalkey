/** Centralized user-facing messages used by hooks and UI actions. */
import { getCurrentLanguage, interpolateTemplate, translate } from "../i18n";

const messageTranslations: Record<"en" | "te" | "hi", Record<string, string>> = {
  en: {},
  te: {
    "Could not save setting": "సెట్టింగ్‌ను సేవ్ చేయలేకపోయాము",
    "Haptic feedback preference could not be saved. Please try again.":
      "హాప్టిక్ ఫీడ్బ్యాక్ ప్రాధాన్యతను సేవ్ చేయలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి.",
    "Browser storage is unavailable.": "బ్రౌజర్ నిల్వ అందుబాటులో లేదు.",
    "The browser file picker is unavailable.": "బ్రౌజర్ ఫైల్ పిక్కర్ అందుబాటులో లేదు.",
    Cancel: "రద్దు",
    Remove: "తొలగించండి",
    "Clear all": "అన్ని క్లియర్ చేయండి",
    "Some saved accounts need attention": "కొన్ని సేవ్ చేసిన ఖాతాలకు శ్రద్ధ అవసరం",
    "{count} invalid account record(s) were not loaded. Valid accounts remain available. Consider creating a backup before making further changes.":
      "{count} చెల్లని ఖాతా రికార్డు(లు) లోడ్ కాలేదు. చెల్లుబాటు అయ్యే ఖాతాలు అందుబాటులో ఉన్నాయి. మరిన్ని మార్పులు చేయడానికి ముందు బ్యాకప్ సృష్టించండి.",
    "The backup file is not valid JSON.": "బ్యాకప్ ఫైల్ చెల్లుబాటు అయ్యే JSON కాదు.",
    "This is not a supported KaalKey encrypted backup.":
      "ఇది మద్దతు ఉన్న KaalKey ఎన్‌క్రిప్ట్ చేసిన బ్యాకప్ కాదు.",
    "Backup password is incorrect or the backup file is damaged.":
      "బ్యాకప్ పాస్‌వర్డ్ తప్పు లేదా బ్యాకప్ ఫైల్ పాడైంది.",
    "The backup contents are invalid or incomplete.": "బ్యాకప్ కంటెంట్ చెల్లదు లేదా పూర్తికాలేదు.",
    "Backup password is incorrect or the backup file has been modified.":
      "బ్యాకప్ పాస్‌వర్డ్ తప్పు లేదా బ్యాకప్ ఫైల్ మార్చబడింది.",
    "Backup password is incorrect or the file is damaged.":
      "బ్యాకప్ పాస్‌వర్డ్ తప్పు లేదా ఫైల్ పాడైంది.",
    "Secure random generation is unavailable. Rebuild and reinstall the Android app with expo-crypto included, then try again.":
      "సురక్షిత యాదృచ్ఛిక జనరేషన్ అందుబాటులో లేదు. expo-crypto సహిత Android యాప్‌ను పునర్నిర్మించి పునరnstall చేసి మళ్లీ ప్రయత్నించండి.",
    "One or more accounts are invalid. Fix the account data before creating a backup.":
      "ఒకటి లేదా ఎక్కువ ఖాతాలు చెల్లవు. బ్యాకప్ సృష్టించే ముందు ఖాతా డేటాను సరిచేయండి.",
    "Unsupported file": "మద్దతు లేని ఫైల్",
    "Choose a QR code image such as PNG or JPEG.":
      "PNG లేదా JPEG వంటి QR కోడ్ చిత్రాన్ని ఎంచుకోండి.",
    "Browser image decoding is unavailable": "బ్రౌజర్ ఇమేజ్ డీకోడింగ్ అందుబాటులో లేదు",
    "Image could not be loaded": "చిత్రాన్ని లోడ్ చేయలేకపోయాము",
    "Image has no readable dimensions": "చిత్రంలో చదవగల కొలతలు లేవు",
    "No QR code found": "QR కోడ్ కనబడలేదు",
    "The copied image does not contain a readable QR code.":
      "కాపీ చేసిన చిత్రంలో చదవగల QR కోడ్ లేదు.",
    "The pasted image does not contain a readable QR code.":
      "పేస్ట్ చేసిన చిత్రంలో చదవగల QR కోడ్ లేదు.",
    "Try copying a clear PNG or JPEG image containing the full QR code.":
      "పూర్తి QR కోడ్ ఉన్న స్పష్టమైన PNG లేదా JPEG చిత్రాన్ని కాపీ చేసి ప్రయత్నించండి.",
    "KaalKey decoded the selected image but did not find a QR code. Try a clear, full-resolution PNG or JPEG with the entire code visible.":
      "KaalKey ఎంచుకున్న చిత్రాన్ని డీకోడ్ చేసింది, కానీ QR కోడ్ కనుగొనబడలేదు. మొత్తం కోడ్ కనిపించే పూర్తి రిజల్యూషన్ PNG లేదా JPEGను ప్రయత్నించండి.",
    "KaalKey could not decode a QR code in this image. Try a screenshot or a higher-resolution PNG/JPEG.":
      "KaalKey ఈ చిత్రంలో QR కోడ్‌ను డీకోడ్ చేయలేకపోయింది. స్క్రీన్‌షాట్ లేదా మరింత ఎత్తు-రిజల్యూషన్ PNG/JPEGని முயற்சி చేయండి.",
    "Could not read image": "చిత్రాన్ని చదవలేకపోయాము",
    "Try a clear PNG or JPEG image containing the authenticator setup QR code.":
      "ఆథెంటికేటర్ సెటప్ QR కోడ్‌ను కలిగి ఉన్న స్పష్టమైన PNG లేదా JPEG చిత్రాన్ని ప్రయత్నించండి.",
    "Could not open image picker": "ఇమేజ్ పిక్కర్‌ను తెరవలేకపోయాము",
    "Please try Upload QR again.": "దయచేసి Upload QRను మళ్లీ ప్రయత్నించండి.",
    "Normalized image could not be decoded": "నార్మలైజ్ చేసిన చిత్రాన్ని డీకోడ్ చేయలేకపోయాము",
    "Could not read pasted image": "పేస్ట్ చేసిన చిత్రాన్ని చదవలేకపోయాము",
    "Try a different QR image.": "వేరొక QR చిత్రాన్ని ప్రయత్నించండి.",
    "Clipboard image could not be loaded": "క్లిప్‌బోర్డ్ ఇమేజ్‌ను లోడ్ చేయలేకపోయాము",
    "Image processing is unavailable": "ఇమేజ్ ప్రాసెసింగ్ అందుబాటులో లేదు",
    "Image processing unavailable": "ఇమేజ్ ప్రాసెసింగ్ అందుబాటులో లేదు",
    "Try copying a clear QR screenshot.": "స్పష్టమైన QR స్క్రీన్‌షాట్‌ను కాపీ చేసి ప్రయత్నించండి.",
    "Clipboard unavailable": "క్లిప్‌బోర్డ్ అందుబాటులో లేదు",
    Error: "లోపం",
    "Clipboard text is not a valid authenticator setup URL. Copy an otpauth:// URL or QR image and try again.":
      "క్లిప్‌బోర్డ్ టెక్స్ట్ చెల్లుబాటు అయ్యే ఆథెంటికేటర్ సెటప్ URL కాదు. otpauth:// URL లేదా QR చిత్రాన్ని కాపీ చేసి మళ్లీ ప్రయత్నించండి.",
    "KaalKey could not read text or an image from the clipboard. Allow clipboard access, then copy the QR image or otpauth:// URL and tap Paste QR Image / URL again.":
      "KaalKey క్లిప్‌బోర్డ్ నుండి టెక్స్ట్ లేదా చిత్రాన్ని చదవలేకపోయింది. క్లిప్‌బోర్డ్ అనుమతిని అనుమతించి, QR చిత్రాన్ని లేదా otpauth:// URLను కాపీ చేసి మళ్లీ Paste QR Image / URLను నొక్కండి.",
    "No image in clipboard": "క్లిప్‌బోర్డ్‌లో చిత్రం లేదు",
    "Copy a QR code image, then tap Paste QR Image again.":
      "QR కోడ్ చిత్రాన్ని కాపీ చేసి, తర్వాత Paste QR Imageను మళ్లీ నొక్కండి.",
    "QR image import failed": "QR ఇమేజ్ దిగుమతి విఫలమైంది",
    "KaalKey could not read that image. Please try another QR code image.":
      "KaalKey ఆ చిత్రాన్ని చదవలేకపోయింది. దయచేసి మరొక QR కోడ్ చిత్రాన్ని ప్రయత్నించండి.",
    "Could not paste image": "చిత్రాన్ని పేస్ట్ చేయలేకపోయాము",
    "Image pasting is not supported by this clipboard on this device. Use Import QR image instead.":
      "ఈ పరికరంలోని ఈ క్లిప్‌బోర్డ్‌లో ఇమేజ్ పేస్ట్‌కు మద్దతు లేదు. బదులుగా Import QR imageను ఉపయోగించండి.",
    "This QR code is not a time-based authenticator setup code.":
      "ఈ QR కోడ్ టైమ్-బేస్డ్ ఆథెంటికేటర్ సెటప్ కోడ్ కాదు.",
    "The QR code is missing account details.": "QR కోడ్‌లో ఖాతా వివరాలు లేవు.",
    "The QR code uses an unsupported algorithm.":
      "QR కోడ్ మద్దతు లేని అల్గోరిథమ్‌ను ఉపయోగిస్తుంది.",
    "This QR code must use 6, 7, or 8 digits.": "ఈ QR కోడ్ 6, 7, లేదా 8 అంకెలను ఉపయోగించాలి.",
    "This QR code uses an unsupported time period.":
      "ఈ QR కోడ్ మద్దతు లేని సమయ వ్యవధిని ఉపయోగిస్తుంది.",
    "The QR code could not be validated.": "QR కోడ్‌ను ధృవీకరించలేకపోయాము.",
    "Could not save acknowledgment": "అంగీకారాన్ని సేవ్ చేయలేకపోయాము",
    "Please try again. You must accept the legal notice before using KaalKey.":
      "దయచేసి మళ్లీ ప్రయత్నించండి. KaalKeyను ఉపయోగించే ముందు చట్టపరమైన నోటీసును అంగీకరించాలి.",
    "Camera permission required": "కెమెరా అనుమతి అవసరం",
    "Allow camera access to scan an authenticator setup QR code.":
      "ఆథెంటికేటర్ సెటప్ QR కోడ్‌ను స్కాన్ చేయడానికి కెమెరా అనుమతిని అనుమతించండి.",
    "Unsupported QR code": "మద్దతు లేని QR కోడ్",
    "Scan the authenticator setup QR code supplied by the service. This must be a TOTP code, not a normal login QR code.":
      "సేవ అందించిన ఆథెంటికేటర్ సెటప్ QR కోడ్‌ను స్కాన్ చేయండి. ఇది సాధారణ లాగిన్ QR కాకుండా TOTP కోడ్ అయి ఉండాలి.",
    "That QR is not a TOTP setup code. Aim at an authenticator setup QR.":
      "ఆ QR TOTP సెటప్ కోడ్ కాదు. ఆథెంటికేటర్ సెటప్ QR వైపు చూపండి.",
    "QR detected. Analyzing…": "QR గుర్తించబడింది. విశ్లేషిస్తోంది…",
    "Starting camera…": "కెమెరా ప్రారంభిస్తోంది…",
    "Analyzing QR code…": "QR కోడ్‌ను విశ్లేషిస్తోంది…",
    "Account already added": "ఖాతా ఇప్పటికే జోడించబడింది",
    "{issuer}: {account} is already in KaalKey.": "{issuer}: {account} ఇప్పటికే KaalKeyలో ఉంది.",
    "Account added": "ఖాతా జోడించబడింది",
    "{issuer}: {account} was added successfully.": "{issuer}: {account} విజయవంతంగా జోడించబడింది.",
    "Could not save the account. You can scan again.":
      "ఖాతాను సేవ్ చేయలేకపోయాము. మీరు మళ్లీ స్కాన్ చేయవచ్చు.",
    "Invalid QR code": "చెల్లని QR కోడ్",
    "KaalKey could not parse this authenticator QR code. {detail}. Use the service's TOTP setup QR code (usually starts with {prefix}).":
      "KaalKey ఈ ఆథెంటికేటర్ QR కోడ్‌ను అర్థం చేసుకోలేకపోయింది. {detail}. సేవ యొక్క TOTP సెటప్ QR కోడ్‌ను ఉపయోగించండి (సాధారణంగా {prefix}తో ప్రారంభమవుతుంది).",
    "QR could not be processed. Aim at the setup QR and try again.":
      "QR ప్రాసెస్ కాలేదు. సెటప్ QR వైపు చూపి మళ్లీ ప్రయత్నించండి.",
    "Invalid TOTP URL": "చెల్లని TOTP URL",
    "Paste a complete authenticator URL beginning with {prefix}.":
      "{prefix}తో ప్రారంభమయ్యే పూర్తి ఆథెంటికేటర్ URLను పేస్ట్ చేయండి.",
    "Clipboard is empty": "క్లిప్‌బోర్డ్ ఖాళీగా ఉంది",
    "Copy an {prefix} URL first, then tap Paste TOTP URL.":
      "ముందుగా {prefix} URLను కాపీ చేసి, తర్వాత Paste TOTP URLను నొక్కండి.",
    "Could not read clipboard": "క్లిప్‌బోర్డ్‌ను చదవలేకపోయాము",
    "Copy the TOTP setup URL and try again.": "TOTP సెటప్ URLను కాపీ చేసి మళ్లీ ప్రయత్నించండి.",
    "Storage data invalid": "నిల్వ డేటా చెల్లదు",
    "Saved account data could not be read safely.":
      "సేవ్ చేసిన ఖాతా డేటాను సురక్షితంగా చదవలేకపోయాము.",
    "Storage error": "నిల్వలో లోపం",
    "Saved accounts could not be loaded.": "సేవ్ చేసిన ఖాతాలను లోడ్ చేయలేకపోయాము.",
    "Missing information": "సమాచారం లేదు",
    "Enter the service name and account name.":
      "సేవ పేరు మరియు ఖాతా పేరును నమోదు చేయండి.",
    "Enter the service name, account name, and secret key.":
      "సేవ పేరు, ఖాతా పేరు మరియు రహస్య కీని నమోదు చేయండి.",
    "Check the Base32 secret, algorithm, digit count, and refresh period. Secrets must contain valid Base32 characters; digits must be {digits} and the period must be {minPeriod}–{maxPeriod} seconds.":
      "Base32 రహస్యం, అల్గారిథమ్, అంకెల సంఖ్య మరియు రిఫ్రెష్ వ్యవధిని తనిఖీ చేయండి. రహస్యంలో చెల్లుబాటు అయ్యే Base32 అక్షరాలు ఉండాలి; అంకెలు {digits} ఉండాలి మరియు వ్యవధి {minPeriod}–{maxPeriod} సెకన్లు ఉండాలి.",
    "An account with this service and account name is already saved.":
      "ఈ సేవ మరియు ఖాతా పేరుతో ఖాతా ఇప్పటికే సేవ్ చేయబడింది.",
    "Your account was updated.": "మీ ఖాతా నవీకరించబడింది.",
    "Your account was added securely.": "మీ ఖాతా సురక్షితంగా జోడించబడింది.",
    "Invalid OTP settings": "చెల్లని OTP సెట్టింగులు",
    "Account already exists": "ఖాతా ఇప్పటికే ఉంది",
    "Account saved": "ఖాతా సేవ్ అయింది",
    "Invalid secret key": "చెల్లని రహస్య కీ",
    "Please check that you entered a valid Base32 secret.":
      "మీరు చెల్లుబాటు అయ్యే Base32 రహస్యాన్ని నమోదు చేశారని తనిఖీ చేయండి.",
    "Account removed": "ఖాతా తొలగించబడింది",
    "The account and its secret were removed from this device.":
      "ఖాతా మరియు దాని రహస్యాన్ని ఈ పరికరం నుంచి తొలగించబడింది.",
    "Accounts cleared": "ఖాతాలు క్లియర్ చేయబడ్డాయి",
    "Clear all accounts?": "అన్ని ఖాతాలను క్లియర్ చేయాలా?",
    "Accounts could not be saved. Check browser storage availability and try again.":
      "ఖాతాలను సేవ్ చేయలేకపోయాము. బ్రౌజర్ నిల్వ అందుబాటులో ఉందో తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",
    "Account not found": "ఖాతా కనబడలేదు",
    "This account could not be found. Close the editor and try again.":
      "ఈ ఖాతా కనబడలేదు. ఎడిటర్‌ను మూసివేసి మళ్లీ ప్రయత్నించండి.",
    "All authenticator accounts and secrets were removed from this device.":
      "అన్ని ఆథెంటికేటర్ ఖాతాలు మరియు రహస్యాలు ఈ పరికరం నుంచి తొలగించబడ్డాయి.",
    "Remove account?": "ఖాతాను తొలగించాలా?",
    "This removes the account and its secret from this device.":
      "ఇది ఖాతాను మరియు దాని రహస్యాన్ని ఈ పరికరం నుంచి తొలగిస్తుంది.",
    "This permanently removes all authenticator accounts and their secrets from this device. Create an encrypted backup first if you may need these accounts later.":
      "ఇది అన్ని ఆథెంటికేటర్ ఖాతాలు మరియు వాటి రహస్యాలను ఈ పరికరం నుంచి శాశ్వతంగా తొలగిస్తుంది. ఈ ఖాతాలు మళ్లీ అవసరమైతే ముందుగా ఎన్‌క్రిప్ట్ చేయబడిన బ్యాకప్‌ను సృష్టించండి.",
    "This cannot be undone.": "ఇది తిరిగి చేయలేని చర్య.",
    "Enter your backup password": "మీ బ్యాకప్ పాస్‌వర్డ్‌ను నమోదు చేయండి",
    "Enter the password used when this backup was created.":
      "ఈ బ్యాకప్‌ను సృష్టించినప్పుడు ఉపయోగించిన పాస్‌వర్డ్‌ను నమోదు చేయండి.",
    "Unlock KaalKey Authenticator": "KaalKey ఆథెంటికేటర్‌ను అన్‌లాక్ చేయండి",
    "Use biometrics or your device screen lock":
      "బయోమెట్రిక్స్ లేదా మీ పరికర స్క్రీన్ లాక్‌ను ఉపయోగించండి",
    "Confirm to turn off KaalKey app lock":
      "KaalKey ఎప్లికేషన్ లాక్‌ను నిలిపివేయడానికి నిర్ధారించండి",
    "Enable app lock for KaalKey": "KaalKey కోసం ఎప్లికేషన్ లాక్‌ను ప్రారంభించండి",
    "Password copied": "పాస్‌వర్డ్ కాపీ అయింది",
    "Save it somewhere safe, such as WhatsApp.": "దీనిని WhatsApp వంటివి సురక్షితంగా ఉంచండి.",
    "Copy failed": "కాపీ విఫలమైంది",
    "Select and copy the password manually.": "పాస్‌వర్డ్‌ను మాన్యువల్‌గా ఎంచుకుని కాపీ చేయండి.",
    "Generating secure backup password…": "సురక్షిత బ్యాకప్ పాస్‌వర్డ్‌ను రూపొందిస్తోంది…",
    "Encrypting backup…": "బ్యాకప్‌ను ఎన్‌క్రిప్ట్ చేస్తోంది…",
    "Decrypting backup…": "బ్యాకప్‌ను డీక్రిప్ట్ చేస్తోంది…",
    "Restoring accounts…": "ఖాతాలను పునరుద్ధరిస్తోంది…",
    "Backup created": "బ్యాకప్ సృష్టించబడింది",
    "Encrypted backup saved temporarily at:\n{uri}":
      "ఎన్‌క్రిప్ట్ చేసిన బ్యాకప్ తాత్కాలికంగా ఇక్కడ సేవ్ చేయబడింది:\n{uri}",
    "Restore complete": "పునరుద్ధరణ పూర్తయింది",
    "Merge backup accounts?": "బ్యాకప్ ఖాతాలను విలీనం చేయాలా?",
    "Merge accounts": "ఖాతాలను విలీనం చేయండి",
    "Could not generate backup password": "బ్యాకప్ పాస్‌వర్డ్‌ను రూపొందించలేకపోయాము",
    "Secure random generation is unavailable.": "సురక్షిత యాదృచ్ఛిక జనరేషన్ అందుబాటులో లేదు.",
    "Backup password unavailable": "బ్యాకప్ పాస్‌వర్డ్ అందుబాటులో లేదు",
    "Close this dialog and create a new backup to generate a secure password.":
      "ఈ డైలాగ్‌ను మూసివేసి కొత్త బ్యాకప్‌ను సృష్టించి సురక్షిత పాస్‌వర్డ్‌ను రూపొందించండి.",
    "Your encrypted KaalKey backup has been downloaded. Keep the file and password private.":
      "మీ ఎన్‌క్రిప్ట్ చేసిన KaalKey బ్యాకప్ డౌన్‌లోడ్ అయింది. ఫైల్ మరియు పాస్‌వర్డ్‌ను గోప్యంగా ఉంచండి.",
    "Backup failed": "బ్యాకప్ విఫలమైంది",
    "KaalKey could not create the backup.": "KaalKey బ్యాకప్‌ను సృష్టించలేకపోయింది.",
    "Restore failed": "పునరుద్ధరణ విఫలమైంది",
    "The backup could not be read or saved.": "బ్యాకప్‌ను చదవలేకపోయాము లేదా సేవ్ చేయలేకపోయాము.",
    "Your browser does not support downloading backup files.":
      "మీ బ్రౌజర్ బ్యాకప్ ఫైళ్లను డౌన్‌లోడ్ చేయడానికి మద్దతు ఇవ్వదు.",
    "A local file location is unavailable on this device.":
      "ఈ పరికరంలో స్థానిక ఫైల్ స్థానం అందుబాటులో లేదు.",
    "Save your encrypted KaalKey backup": "మీ ఎన్‌క్రిప్ట్ చేయబడిన KaalKey బ్యాకప్‌ను సేవ్ చేయండి",
    "Code copied": "కోడ్ కాపీ అయింది",
    "Your verification code has been copied.": "మీ ధృవీకరణ కోడ్ కాపీ అయింది.",
    "Could not copy the verification code.": "ధృవీకరణ కోడ్‌ను కాపీ చేయలేకపోయాము.",
    "Camera ready. Point it at the authenticator QR code.":
      "కెమెరా సిద్ధంగా ఉంది. ఆథెంటికేటర్ QR కోడ్‌ వైపు చూపండి.",
    "Reading QR image…": "QR చిత్రాన్ని చదువుతోంది…",
    "Importing QR image…": "QR చిత్రాన్ని దిగుమతి చేస్తోంది…",
    "Importing authenticator account…": "ఆథెంటికేటర్ ఖాతాను దిగుమతి చేస్తోంది…",
    "Importing pasted QR image…": "పేస్ట్ చేసిన QR చిత్రాన్ని దిగుమతి చేస్తోంది…",
    "Set up your device screen lock": "మీ పరికర స్క్రీన్ లాక్‌ను సెటప్ చేయండి",
    "KaalKey uses your phone's built-in authentication. Set a device PIN, pattern, or password in your phone's security settings, then try again. Biometrics are optional.":
      "KaalKey మీ ఫోన్‌లోని బిల్ట్-ఇన్ ధృవీకరణను ఉపయోగిస్తుంది. మీ ఫోన్ భద్రత సెట్టింగ్‌లలో పరికర PIN, నమూనా లేదా పాస్‌వర్డ్‌ను సెట్ చేసి, మళ్లీ ప్రయత్నించండి. బయోమెట్రిక్స్ ఐచ్ఛికం.",
    "Device authentication unavailable": "పరికర ధృవీకరణ అందుబాటులో లేదు",
    "Your phone could not start secure authentication. Check that a device screen lock is configured, then try again.":
      "మీ ఫోన్ సురక్షిత ధృవీకరణను ప్రారంభించలేకపోయింది. పరికర స్క్రీన్ లాక్ సెటప్ చేసి ఉందో చూసి మళ్లీ ప్రయత్నించండి.",
    "Authentication temporarily locked": "ధృవీకరణ తాత్కాలికంగా లాక్ అయింది",
    "Your phone has temporarily disabled authentication after too many attempts. Wait and try again.":
      "చాలా ప్రయత్నాల తర్వాత మీ ఫోన్ ధృవీకరణను తాత్కాలికంగా నిలిపివేసింది. వేచి ఉండి మళ్లీ ప్రయత్నించండి.",
    "Authentication unavailable": "ధృవీకరణ అందుబాటులో లేదు",
    "KaalKey could not start the phone's secure authentication prompt. Please try again.":
      "KaalKey ఫోన్ సురక్షిత ధృవీకరణ ప్రాంప్ట్‌ను ప్రారంభించలేకపోయింది. దయచేసి మళ్లీ ప్రయత్నించండి.",
    "Device authentication lock is not available in the web version yet. The web vault remains unlocked; use the Android app for native device authentication.":
      "వెబ్ వెర్షన్‌లో పరికర ధృవీకరణ లాక్ ఇంకా అందుబాటులో లేదు. వెబ్ వాల్ట్ అన్‌లాక్‌గా మిగిలిపోతుంది; స్థానిక పరికర ధృవీకరణ కోసం Android యాప్‌ను ఉపయోగించండి.",
    "App lock disabled": "యాప్ లాక్ నిలిపివేయబడింది",
    "KaalKey app lock has been turned off.": "KaalKey యాప్ లాక్ ఆఫ్ చేయబడింది.",
    "The app lock remains enabled. Please try again.":
      "యాప్ లాక్ ఇప్పటికీ ప్రారంభించబడివుంది. దయచేసి మళ్లీ ప్రయత్నించండి.",
    "App lock enabled": "యాప్ లాక్ ప్రారంభించబడింది",
    "KaalKey will request your phone's built-in authentication when opened and when you return to it.":
      "యాప్ తెరిచినప్పుడు మరియు మీరు దానికి తిరిగి వచ్చినప్పుడు KaalKey మీ ఫోన్‌లోని బిల్ట్-ఇన్ ధృవీకరణను అడుగుతుంది.",
    "App lock could not be enabled. Please try again.":
      "యాప్ లాక్‌ను ప్రారంభించలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి.",
  },
  hi: {
    "Could not save setting": "सेटिंग सेव नहीं की जा सकी",
    "Haptic feedback preference could not be saved. Please try again.":
      "हैप्टिक फीडबैक प्रिफरेंस सेव नहीं किया जा सका। कृपया पुनः प्रयास करें।",
    "Could not save acknowledgment": "स्वीकृति सेव नहीं की जा सकी",
    "Browser storage is unavailable.": "ब्राउज़र स्टोरेज उपलब्ध नहीं है।",
    "The browser file picker is unavailable.": "ब्राउज़र फ़ाइल पिकर उपलब्ध नहीं है।",
    Cancel: "रद्द करें",
    Remove: "हटाएँ",
    "Clear all": "सभी साफ़ करें",
    "Some saved accounts need attention": "कुछ सहेजे गए खातों को ध्यान देने की आवश्यकता है",
    "{count} invalid account record(s) were not loaded. Valid accounts remain available. Consider creating a backup before making further changes.":
      "{count} अमान्य खाता रिकॉर्ड लोड नहीं किए गए। वैध खाते उपलब्ध हैं। आगे के बदलाव करने से पहले बैकअप बनाना विचार करें।",
    "The backup file is not valid JSON.": "बैकअप फ़ाइल मान्य JSON नहीं है।",
    "This is not a supported KaalKey encrypted backup.":
      "यह समर्थित KaalKey एन्क्रिप्टेड बैकअप नहीं है।",
    "Backup password is incorrect or the backup file is damaged.":
      "बैकअप पासवर्ड गलत है या बैकअप फ़ाइल दूषित है।",
    "The backup contents are invalid or incomplete.": "बैकअप सामग्री अमान्य या अपूर्ण है।",
    "Backup password is incorrect or the backup file has been modified.":
      "बैकअप पासवर्ड गलत है या बैकअप फ़ाइल बदल दी गई है।",
    "Backup password is incorrect or the file is damaged.":
      "बैकअप पासवर्ड गलत है या फ़ाइल दूषित है।",
    "Secure random generation is unavailable. Rebuild and reinstall the Android app with expo-crypto included, then try again.":
      "सुरक्षित यादृच्छिक जनरेशन उपलब्ध नहीं है। expo-crypto के साथ Android ऐप पुनः बनाकर पुनः इंस्टॉल करें, फिर कोशिश करें।",
    "One or more accounts are invalid. Fix the account data before creating a backup.":
      "एक या अधिक खाते अमान्य हैं। बैकअप बनाने से पहले खाता डेटा ठीक करें।",
    "Unsupported file": "असमर्थित फ़ाइल",
    "Choose a QR code image such as PNG or JPEG.": "PNG या JPEG जैसे QR कोड इमेज चुनें।",
    "Browser image decoding is unavailable": "ब्राउज़र इमेज डिकोडिंग उपलब्ध नहीं है",
    "Image could not be loaded": "इमेज लोड नहीं हो सकी",
    "Image has no readable dimensions": "इमेज में पढ़ने योग्य आयाम नहीं हैं",
    "No QR code found": "QR कोड नहीं मिला",
    "The copied image does not contain a readable QR code.":
      "कॉपी की गई इमेज में पढ़ने योग्य QR कोड नहीं है।",
    "The pasted image does not contain a readable QR code.":
      "पेस्ट की गई इमेज में पढ़ने योग्य QR कोड नहीं है।",
    "Try copying a clear PNG or JPEG image containing the full QR code.":
      "पूरा QR कोड वाली साफ़ PNG या JPEG इमेज कॉपी करके आज़माएँ।",
    "KaalKey decoded the selected image but did not find a QR code. Try a clear, full-resolution PNG or JPEG with the entire code visible.":
      "KaalKey ने चुनी गई इमेज डिकोड की, लेकिन QR कोड नहीं मिला। पूरा कोड दिखाई देने वाली साफ़, पूर्ण-रिज़ॉल्यूशन PNG या JPEG आज़माएँ।",
    "KaalKey could not decode a QR code in this image. Try a screenshot or a higher-resolution PNG/JPEG.":
      "KaalKey इस इमेज में QR कोड को डिकोड नहीं कर सका। स्क्रीनशॉट या उच्च-रिज़ॉल्यूशन PNG/JPEG आज़माएँ।",
    "Could not read image": "इमेज पढ़ी नहीं जा सकी",
    "Try a clear PNG or JPEG image containing the authenticator setup QR code.":
      "ऑथेंटिकेटर सेटअप QR कोड वाली साफ़ PNG या JPEG इमेज आज़माएँ।",
    "Could not open image picker": "इमेज पिकर नहीं खुल सका",
    "Please try Upload QR again.": "कृपया Upload QR फिर से आज़माएँ।",
    "Normalized image could not be decoded": "सामान्यीकृत इमेज डिकोड नहीं हो सकी",
    "Could not read pasted image": "पेस्ट की गई इमेज नहीं पढ़ी जा सकी",
    "Try a different QR image.": "अलग QR इमेज आज़माएँ।",
    "Clipboard image could not be loaded": "क्लिपबोर्ड इमेज लोड नहीं हो सकी",
    "Image processing is unavailable": "इमेज प्रोसेसिंग उपलब्ध नहीं है",
    "Image processing unavailable": "इमेज प्रोसेसिंग उपलब्ध नहीं है",
    "Try copying a clear QR screenshot.": "साफ़ QR स्क्रीनशॉट कॉपी करके आज़माएँ।",
    "Clipboard unavailable": "क्लिपबोर्ड उपलब्ध नहीं है",
    Error: "त्रुटि",
    "Clipboard text is not a valid authenticator setup URL. Copy an otpauth:// URL or QR image and try again.":
      "क्लिपबोर्ड टेक्स्ट सही ऑथेंटिकेटर सेटअप URL नहीं है। otpauth:// URL या QR इमेज कॉपी करें और फिर कोशिश करें।",
    "KaalKey could not read text or an image from the clipboard. Allow clipboard access, then copy the QR image or otpauth:// URL and tap Paste QR Image / URL again.":
      "KaalKey क्लिपबोर्ड से टेक्स्ट या इमेज नहीं पढ़ सका। क्लिपबोर्ड एक्सेस दें, फिर QR इमेज या otpauth:// URL कॉपी करें और Paste QR Image / URL फिर से दबाएँ।",
    "No image in clipboard": "क्लिपबोर्ड में इमेज नहीं है",
    "Copy a QR code image, then tap Paste QR Image again.":
      "QR कोड इमेज कॉपी करें, फिर Paste QR Image फिर से दबाएँ।",
    "QR image import failed": "QR इमेज आयात विफल",
    "KaalKey could not read that image. Please try another QR code image.":
      "KaalKey उस इमेज को नहीं पढ़ सका। कृपया किसी अन्य QR कोड इमेज से कोशिश करें।",
    "Could not paste image": "इमेज पेस्ट नहीं हो सकी",
    "Image pasting is not supported by this clipboard on this device. Use Import QR image instead.":
      "इस डिवाइस के इस क्लिपबोर्ड में इमेज पेस्ट समर्थित नहीं है। बजाय Import QR image का उपयोग करें।",
    "This QR code is not a time-based authenticator setup code.":
      "यह QR कोड टाइम-आधारित ऑथेंटिकेटर सेटअप कोड नहीं है।",
    "The QR code is missing account details.": "QR कोड में खाते का विवरण नहीं है।",
    "The QR code uses an unsupported algorithm.":
      "QR कोड unsupported algorithm का उपयोग कर रहा है।",
    "This QR code must use 6, 7, or 8 digits.": "इस QR कोड में 6, 7 या 8 अंक होने चाहिए।",
    "This QR code uses an unsupported time period.":
      "इस QR कोड में unsupported time period का उपयोग किया गया है।",
    "The QR code could not be validated.": "QR कोड मान्य नहीं किया जा सका।",
    "Please try again. You must accept the legal notice before using KaalKey.":
      "कृपया पुनः प्रयास करें। KaalKey का उपयोग करने से पहले कानूनी सूचना स्वीकार करनी होगी।",
    "Camera permission required": "कैमरा अनुमति आवश्यक है",
    "Allow camera access to scan an authenticator setup QR code.":
      "ऑथेंटिकेटर सेटअप QR कोड स्कैन करने के लिए कैमरा एक्सेस अनुमति दें।",
    "Unsupported QR code": "असमर्थित QR कोड",
    "Scan the authenticator setup QR code supplied by the service. This must be a TOTP code, not a normal login QR code.":
      "सेवा द्वारा दिए गए ऑथेंटिकेटर सेटअप QR कोड को स्कैन करें। यह सामान्य लॉगिन QR कोड नहीं बल्कि TOTP कोड होना चाहिए।",
    "That QR is not a TOTP setup code. Aim at an authenticator setup QR.":
      "यह QR TOTP सेटअप कोड नहीं है। ऑथेंटिकेटर सेटअप QR पर निशाना लगाएँ।",
    "QR detected. Analyzing…": "QR पता चला। विश्लेषण हो रहा है…",
    "Starting camera…": "कैमरा शुरू हो रहा है…",
    "Analyzing QR code…": "QR कोड का विश्लेषण किया जा रहा है…",
    "Account already added": "खाता पहले से जोड़ दिया गया है",
    "{issuer}: {account} is already in KaalKey.": "{issuer}: {account} पहले से ही KaalKey में है।",
    "Account added": "खाता जोड़ दिया गया",
    "{issuer}: {account} was added successfully.": "{issuer}: {account} सफलतापूर्वक जोड़ दिया गया।",
    "Could not save the account. You can scan again.":
      "खाता सेव नहीं किया जा सका। आप फिर से स्कैन कर सकते हैं।",
    "Invalid QR code": "अमान्य QR कोड",
    "KaalKey could not parse this authenticator QR code. {detail}. Use the service's TOTP setup QR code (usually starts with {prefix}).":
      "KaalKey इस ऑथेंटिकेटर QR कोड को पार्स नहीं कर सका। {detail}. सेवा का TOTP सेटअप QR कोड उपयोग करें (आमतौर पर {prefix} से शुरू होता है)।",
    "QR could not be processed. Aim at the setup QR and try again.":
      "QR प्रोसेस नहीं हो सका। सेटअप QR पर निशाना लगाकर पुनः प्रयास करें।",
    "Invalid TOTP URL": "अमान्य TOTP URL",
    "Paste a complete authenticator URL beginning with {prefix}.":
      "{prefix} से शुरू होने वाला पूरा ऑथेंटिकेटर URL पेस्ट करें।",
    "Clipboard is empty": "क्लिपबोर्ड खाली है",
    "Copy an {prefix} URL first, then tap Paste TOTP URL.":
      "पहले {prefix} URL कॉपी करें, फिर Paste TOTP URL टैप करें।",
    "Could not read clipboard": "क्लिपबोर्ड पढ़ा नहीं जा सका",
    "Copy the TOTP setup URL and try again.": "TOTP सेटअप URL कॉपी करें और पुनः प्रयास करें।",
    "Storage data invalid": "संग्रहण डेटा अमान्य है",
    "Saved account data could not be read safely.":
      "सहेजा गया खाता डेटा सुरक्षित रूप से पढ़ा नहीं जा सका।",
    "Storage error": "संग्रहण त्रुटि",
    "Saved accounts could not be loaded.": "सहेजे गए खाते लोड नहीं किए जा सके।",
    "Missing information": "जानकारी अनुपलब्ध",
    "Enter the service name and account name.":
      "सेवा का नाम और खाते का नाम दर्ज करें।",
    "Enter the service name, account name, and secret key.":
      "सेवा का नाम, खाते का नाम और गुप्त कुंजी दर्ज करें।",
    "Check the Base32 secret, algorithm, digit count, and refresh period. Secrets must contain valid Base32 characters; digits must be {digits} and the period must be {minPeriod}–{maxPeriod} seconds.":
      "Base32 गुप्त कुंजी, एल्गोरिदम, अंकों की संख्या और रिफ़्रेश अवधि जाँचें। गुप्त कुंजी में मान्य Base32 अक्षर होने चाहिए; अंकों की संख्या {digits} और अवधि {minPeriod}–{maxPeriod} सेकंड होनी चाहिए।",
    "An account with this service and account name is already saved.":
      "इस सेवा और खाते के नाम वाला खाता पहले से सेव है।",
    "Your account was updated.": "आपका खाता अपडेट किया गया।",
    "Your account was added securely.": "आपका खाता सुरक्षित रूप से जोड़ा गया।",
    "Invalid OTP settings": "अमान्य OTP सेटिंग्स",
    "Account already exists": "खाता पहले से मौजूद है",
    "Account saved": "खाता सेव किया गया",
    "Invalid secret key": "अमान्य गुप्त कुंजी",
    "Please check that you entered a valid Base32 secret.":
      "कृपया सत्यापन करें कि आपने सही Base32 गुप्त कुंजी दर्ज की है।",
    "Account removed": "खाता हटा दिया गया",
    "The account and its secret were removed from this device.":
      "खाता और उसकी गुप्त कुंजी इस डिवाइस से हटा दी गई है।",
    "Accounts cleared": "सभी खाते साफ़ हो गए",
    "Clear all accounts?": "सभी खाते साफ़ करें?",
    "Accounts could not be saved. Check browser storage availability and try again.":
      "खाते सेव नहीं किए जा सके। ब्राउज़र स्टोरेज उपलब्ध है या नहीं जाँचें और फिर प्रयास करें।",
    "Account not found": "खाता नहीं मिला",
    "This account could not be found. Close the editor and try again.":
      "यह खाता नहीं मिला। एडिटर बंद करें और फिर प्रयास करें।",
    "All authenticator accounts and secrets were removed from this device.":
      "सभी ऑथेंटिकेटर खाते और उनकी कुंजियाँ इस डिवाइस से हटा दी गई हैं।",
    "Remove account?": "खाता हटाएँ?",
    "This removes the account and its secret from this device.":
      "यह खाता और उसकी गुप्त कुंजी इस डिवाइस से हटा देता है।",
    "This permanently removes all authenticator accounts and their secrets from this device. Create an encrypted backup first if you may need these accounts later.":
      "यह सभी ऑथेंटिकेटर खातों और उनकी कुंजियों को इस डिवाइस से स्थायी रूप से हटा देता है। यदि आपको बाद में इन खातों की आवश्यकता हो सकती है, तो पहले एन्क्रिप्टेड बैकअप बनाएं।",
    "This cannot be undone.": "इसे वापस नहीं किया जा सकता।",
    "Enter your backup password": "अपना बैकअप पासवर्ड दर्ज करें",
    "Enter the password used when this backup was created.":
      "उस पासवर्ड को दर्ज करें जिसका उपयोग इस बैकअप के निर्माण के समय किया गया था।",
    "Unlock KaalKey Authenticator": "KaalKey ऑथेंटिकेटर अनलॉक करें",
    "Use biometrics or your device screen lock":
      "बायोमेट्रिक्स या अपने डिवाइस के स्क्रीन लॉक का उपयोग करें",
    "Confirm to turn off KaalKey app lock": "KaalKey ऐप लॉक बंद करने की पुष्टि करें",
    "Enable app lock for KaalKey": "KaalKey के लिए ऐप लॉक सक्षम करें",
    "Password copied": "पासवर्ड कॉपी हो गया",
    "Save it somewhere safe, such as WhatsApp.": "इसे सुरक्षित जगह पर रखें, जैसे WhatsApp।",
    "Copy failed": "कॉपी विफल",
    "Select and copy the password manually.": "पासवर्ड को मैन्युअल रूप से चुनें और कॉपी करें।",
    "Generating secure backup password…": "सुरक्षित बैकअप पासवर्ड बनाया जा रहा है…",
    "Encrypting backup…": "बैकअप एन्क्रिप्ट किया जा रहा है…",
    "Decrypting backup…": "बैकअप डिक्रिप्ट किया जा रहा है…",
    "Restoring accounts…": "खाते बहाल किए जा रहे हैं…",
    "Backup created": "बैकअप बनाया गया",
    "Encrypted backup saved temporarily at:\n{uri}":
      "एन्क्रिप्टेड बैकअप अस्थायी रूप से यहाँ सेव किया गया:\n{uri}",
    "Restore complete": "बहाली पूर्ण",
    "Merge backup accounts?": "बैकअप खातों को मिलाएँ?",
    "Merge accounts": "खाते मिलाएँ",
    "Could not generate backup password": "बैकअप पासवर्ड नहीं बनाया जा सका",
    "Secure random generation is unavailable.": "सुरक्षित रैंडम जनरेशन उपलब्ध नहीं है।",
    "Backup password unavailable": "बैकअप पासवर्ड उपलब्ध नहीं है",
    "Close this dialog and create a new backup to generate a secure password.":
      "इस डायलॉग को बंद करें और सुरक्षित पासवर्ड बनाने के लिए नया बैकअप बनाएं।",
    "Your encrypted KaalKey backup has been downloaded. Keep the file and password private.":
      "आपका एन्क्रिप्टेड KaalKey बैकअप डाउनलोड हो गया है। फ़ाइल और पासवर्ड को निजी रखें।",
    "Backup failed": "बैकअप विफल",
    "KaalKey could not create the backup.": "KaalKey बैकअप नहीं बना सका।",
    "Restore failed": "बहाली विफल",
    "The backup could not be read or saved.": "बैकअप पढ़ा या सेव नहीं जा सका।",
    "Your browser does not support downloading backup files.":
      "आपके ब्राउज़र में बैकअप फ़ाइलें डाउनलोड करने का समर्थन नहीं है।",
    "A local file location is unavailable on this device.":
      "इस डिवाइस पर स्थानीय फ़ाइल स्थान उपलब्ध नहीं है।",
    "Save your encrypted KaalKey backup": "अपना एन्क्रिप्टेड KaalKey बैकअप सेव करें",
    "Code copied": "कोड कॉपी हो गया",
    "Your verification code has been copied.": "आपका सत्यापन कोड कॉपी हो गया है।",
    "Could not copy the verification code.": "सत्यापन कोड कॉपी नहीं किया जा सका।",
    "Camera ready. Point it at the authenticator QR code.":
      "कैमरा तैयार है। ऑथेंटिकेटर QR कोड पर इंगित करें।",
    "Reading QR image…": "QR छवि पढ़ी जा रही है…",
    "Importing QR image…": "QR छवि आयात की जा रही है…",
    "Importing authenticator account…": "ऑथेंटिकेटर खाता आयात किया जा रहा है…",
    "Importing pasted QR image…": "पेस्ट की गई QR छवि आयात की जा रही है…",
    "Set up your device screen lock": "अपने डिवाइस स्क्रीन लॉक को सेट करें",
    "KaalKey uses your phone's built-in authentication. Set a device PIN, pattern, or password in your phone's security settings, then try again. Biometrics are optional.":
      "KaalKey आपके फ़ोन की बिल्ट-इन प्रमाणीकरण प्रणाली का उपयोग करता है। अपने फ़ोन की सुरक्षा सेटिंग्स में डिवाइस PIN, पैटर्न या पासवर्ड सेट करें, फिर पुनः प्रयास करें। बायोमेट्रिक्स वैकल्पिक है।",
    "Device authentication unavailable": "डिवाइस प्रमाणीकरण उपलब्ध नहीं है",
    "Your phone could not start secure authentication. Check that a device screen lock is configured, then try again.":
      "आपके फ़ोन ने सुरक्षित प्रमाणीकरण शुरू नहीं किया। सुनिश्चित करें कि डिवाइस स्क्रीन लॉक कॉन्फ़िगर है, फिर पुनः प्रयास करें।",
    "Authentication temporarily locked": "प्रमाणीकरण अस्थायी रूप से लॉक है",
    "Your phone has temporarily disabled authentication after too many attempts. Wait and try again.":
      "बहुत सारे प्रयासों के बाद आपके फ़ोन ने प्रमाणीकरण को अस्थायी रूप से अक्षम कर दिया है। कुछ क्षण प्रतीक्षा करें और पुनः प्रयास करें।",
    "Authentication unavailable": "प्रमाणीकरण उपलब्ध नहीं है",
    "KaalKey could not start the phone's secure authentication prompt. Please try again.":
      "KaalKey फ़ोन का सुरक्षित प्रमाणीकरण प्रॉम्प्ट शुरू नहीं कर सका। कृपया पुनः प्रयास करें।",
    "Device authentication lock is not available in the web version yet. The web vault remains unlocked; use the Android app for native device authentication.":
      "वेब संस्करण में डिवाइस प्रमाणीकरण लॉक अभी उपलब्ध नहीं है। वेब वॉल्ट अनलॉक रहता है; मूल डिवाइस प्रमाणीकरण के लिए Android ऐप का उपयोग करें।",
    "App lock disabled": "ऐप लॉक अक्षम है",
    "KaalKey app lock has been turned off.": "KaalKey ऐप लॉक बंद कर दिया गया है।",
    "The app lock remains enabled. Please try again.":
      "ऐप लॉक अभी भी सक्षम है। कृपया पुनः प्रयास करें।",
    "App lock enabled": "ऐप लॉक सक्षम है",
    "KaalKey will request your phone's built-in authentication when opened and when you return to it.":
      "ऐप खोलते समय और फिर से वापस लौटते समय KaalKey आपके फ़ोन की बिल्ट-इन प्रमाणीकरण प्रणाली का अनुरोध करेगा।",
    "App lock could not be enabled. Please try again.":
      "ऐप लॉक सक्षम नहीं किया जा सका। कृपया पुनः प्रयास करें।",
  },
};

const localize = (english: string, values?: Record<string, string | number>) => {
  const language = getCurrentLanguage();
  const translation =
    (messageTranslations[language]?.[english] ?? translate(language, english)) || english;
  return values ? interpolateTemplate(translation, values) : translation;
};

const userMessages = {
  haptics: {
    saveFailedTitle: "Could not save setting",
    saveFailedBody: "Haptic feedback preference could not be saved. Please try again.",
  },
  legalAcceptance: {
    saveFailedTitle: "Could not save acknowledgment",
    saveFailedBody: "Please try again. You must accept the legal notice before using KaalKey.",
  },
  cameraPermission: {
    title: "Camera permission required",
    body: "Allow camera access to scan an authenticator setup QR code.",
  },
  qr: {
    unsupportedTitle: "Unsupported QR code",
    unsupportedBody:
      "Scan the authenticator setup QR code supplied by the service. This must be a TOTP code, not a normal login QR code.",
    unsupportedDiagnostic: "That QR is not a TOTP setup code. Aim at an authenticator setup QR.",
    detectedDiagnostic: "QR detected. Analyzing…",
    startingCamera: "Starting camera…",
    analyzing: "Analyzing QR code…",
    duplicateTitle: "Account already added",
    duplicateBody: (issuer: string, account: string) =>
      `${issuer}: ${account} is already in KaalKey.`,
    addedTitle: "Account added",
    addedBody: (issuer: string, account: string) => `${issuer}: ${account} was added successfully.`,
    saveFailedDiagnostic: "Could not save the account. You can scan again.",
    invalidTitle: "Invalid QR code",
    invalidBody: (detail: string, prefix: string) =>
      `KaalKey could not parse this authenticator QR code. ${detail}. Use the service's TOTP setup QR code (usually starts with ${prefix}).`,
    parseFailedDiagnostic: "QR could not be processed. Aim at the setup QR and try again.",
    invalidUrlTitle: "Invalid TOTP URL",
    invalidUrlBody: (prefix: string) =>
      `Paste a complete authenticator URL beginning with ${prefix}.`,
    clipboardEmptyTitle: "Clipboard is empty",
    clipboardEmptyBody: (prefix: string) => `Copy an ${prefix} URL first, then tap Paste TOTP URL.`,
    clipboardErrorTitle: "Could not read clipboard",
    clipboardErrorBody: "Copy the TOTP setup URL and try again.",
  },
  storage: {
    browserUnavailable: "Browser storage is unavailable.",
    browserFilePickerUnavailable: "The browser file picker is unavailable.",
  },
  qrImport: {
    unsupportedFileTitle: "Unsupported file",
    unsupportedFileBody: "Choose a QR code image such as PNG or JPEG.",
    browserDecoderUnavailable: "Browser image decoding is unavailable",
    imageLoadFailed: "Image could not be loaded",
    unreadableDimensions: "Image has no readable dimensions",
    noQrCodeFoundTitle: "No QR code found",
    noQrCodeFoundBody:
      "KaalKey could not decode a QR code in this image. Try a screenshot or a higher-resolution PNG/JPEG.",
    couldNotReadImageTitle: "Could not read image",
    couldNotReadImageBody:
      "Try a clear PNG or JPEG image containing the authenticator setup QR code.",
    couldNotOpenPickerTitle: "Could not open image picker",
    couldNotOpenPickerBody: "Please try Upload QR again.",
    normalizedDecodeFailed: "Normalized image could not be decoded",
    clipboardImageLoadFailed: "Clipboard image could not be loaded",
    imageProcessingUnavailable: "Image processing is unavailable",
    imageProcessingUnavailableAlt: "Image processing unavailable",
    noImageInClipboardTitle: "No image in clipboard",
    noImageInClipboardBody: "Copy a QR code image, then tap Paste QR Image again.",
    clipboardUnavailableTitle: "Clipboard unavailable",
    clipboardUnavailableBody:
      "Clipboard text is not a valid authenticator setup URL. Copy an otpauth:// URL or QR image and try again.",
    clipboardAccessBody:
      "KaalKey could not read text or an image from the clipboard. Allow clipboard access, then copy the QR image or otpauth:// URL and tap Paste QR Image / URL again.",
    couldNotPasteImageTitle: "Could not paste image",
    couldNotPasteImageBody:
      "Image pasting is not supported by this clipboard on this device. Use Import QR image instead.",
    sourceImageDecodeFailure: "Try a different QR image.",
    sourceImageReadFailure: "Try copying a clear QR screenshot.",
    importFailedTitle: "QR image import failed",
    importFailedBody: "KaalKey could not read that image. Please try another QR code image.",
    notFoundBody: "The copied image does not contain a readable QR code.",
    pastedNotFoundBody: "The pasted image does not contain a readable QR code.",
    pastedReadFailureBody: "Try copying a clear PNG or JPEG image containing the full QR code.",
    pastedImportFailureBody: "Try a different QR image.",
    noQrCodeTextBody:
      "KaalKey decoded the selected image but did not find a QR code. Try a clear, full-resolution PNG or JPEG with the entire code visible.",
  },
  totpImport: {
    invalidTotpCode: "This QR code is not a time-based authenticator setup code.",
    missingAccountDetails: "The QR code is missing account details.",
    unsupportedAlgorithm: "The QR code uses an unsupported algorithm.",
    unsupportedDigits: "This QR code must use 6, 7, or 8 digits.",
    unsupportedPeriod: "This QR code uses an unsupported time period.",
    invalidAccount: "The QR code could not be validated.",
  },
  account: {
    storageInvalidTitle: "Storage data invalid",
    storageInvalidBody: "Saved account data could not be read safely.",
    storageErrorTitle: "Storage error",
    storageErrorBody: "Saved accounts could not be loaded.",
    missingTitle: "Missing information",
    missingEditingBody: "Enter the service name and account name.",
    missingBody: "Enter the service name, account name, and secret key.",
    invalidOtpBody: (digits: string, minPeriod: number, maxPeriod: number) =>
      `Check the Base32 secret, algorithm, digit count, and refresh period. Secrets must contain valid Base32 characters; digits must be ${digits} and the period must be ${minPeriod}–${maxPeriod} seconds.`,
    duplicateBody: "An account with this service and account name is already saved.",
    updatedBody: "Your account was updated.",
    addedBody: "Your account was added securely.",
    invalidOtpTitle: "Invalid OTP settings",
    duplicateTitle: "Account already exists",
    savedTitle: "Account saved",
    invalidSecretTitle: "Invalid secret key",
    invalidSecretBody: "Please check that you entered a valid Base32 secret.",
    removedTitle: "Account removed",
    removedBody: "The account and its secret were removed from this device.",
    clearedTitle: "Accounts cleared",
    clearedBody: "All authenticator accounts and secrets were removed from this device.",
    someSavedAccountsNeedAttentionTitle: "Some saved accounts need attention",
    someSavedAccountsNeedAttentionBody: (count: number) =>
      `${count} invalid account record(s) were not loaded. Valid accounts remain available. Consider creating a backup before making further changes.`,
    removeConfirmTitle: "Remove account?",
    removeConfirmWebTitle: "Remove account?",
    cancelButton: "Cancel",
    removeButton: "Remove",
    clearButton: "Clear all",
    clearConfirmTitle: "Clear all accounts?",
    saveErrorBody: "Accounts could not be saved. Check browser storage availability and try again.",
    notFoundTitle: "Account not found",
    notFoundBody: "This account could not be found. Close the editor and try again.",
    removeConfirmBody: "This removes the account and its secret from this device.",
    clearConfirmBody:
      "This permanently removes all authenticator accounts and their secrets from this device. Create an encrypted backup first if you may need these accounts later.",
    clearConfirmUndoBody: "This cannot be undone.",
  },
  backup: {
    invalidJson: "The backup file is not valid JSON.",
    unsupportedFormat: "This is not a supported KaalKey encrypted backup.",
    invalidPasswordOrDamaged: "Backup password is incorrect or the backup file is damaged.",
    invalidContents: "The backup contents are invalid or incomplete.",
    secureRandomUnavailableDetailed:
      "Secure random generation is unavailable. Rebuild and reinstall the Android app with expo-crypto included, then try again.",
    invalidAccountDataForBackup:
      "One or more accounts are invalid. Fix the account data before creating a backup.",
    invalidPasswordOrModified: "Backup password is incorrect or the backup file has been modified.",
    invalidPasswordOrFileDamaged: "Backup password is incorrect or the file is damaged.",
    passwordCopiedTitle: "Password copied",
    enterPasswordTitle: "Enter your backup password",
    enterPasswordBody: "Enter the password used when this backup was created.",
    passwordCopiedBody: "Save it somewhere safe, such as WhatsApp.",
    copyFailedTitle: "Copy failed",
    copyFailedBody: "Select and copy the password manually.",
    generatingPassword: "Generating secure backup password…",
    encrypting: "Encrypting backup…",
    decrypting: "Decrypting backup…",
    restoring: "Restoring accounts…",
    backupCreatedTitle: "Backup created",
    restoreCompleteTitle: "Restore complete",
    mergeConfirmTitle: "Merge backup accounts?",
    mergeConfirmButton: "Merge accounts",
    backupSavedTemporary: (uri: string) => `Encrypted backup saved temporarily at:\n${uri}`,
    generatePasswordErrorTitle: "Could not generate backup password",
    secureRandomUnavailable: "Secure random generation is unavailable.",
    passwordUnavailableTitle: "Backup password unavailable",
    passwordUnavailableBody:
      "Close this dialog and create a new backup to generate a secure password.",
    backupDownloadedBody:
      "Your encrypted KaalKey backup has been downloaded. Keep the file and password private.",
    backupFailedTitle: "Backup failed",
    backupCreateErrorBody: "KaalKey could not create the backup.",
    restoreFailedTitle: "Restore failed",
    backupReadErrorBody: "The backup could not be read or saved.",
    browserDownloadUnsupported: "Your browser does not support downloading backup files.",
    localFileUnavailable: "A local file location is unavailable on this device.",
    saveBackupTitle: "Save your encrypted KaalKey backup",
  },
  clipboard: {
    copiedTitle: "Code copied",
    copiedBody: "Your verification code has been copied.",
    errorTitle: "Error",
    errorBody: "Could not copy the verification code.",
  },
  activity: {
    cameraReady: "Camera ready. Point it at the authenticator QR code.",
    readingQrImage: "Reading QR image…",
    importingQrImage: "Importing QR image…",
    importingAccount: "Importing authenticator account…",
    importingPastedImage: "Importing pasted QR image…",
  },
  biometric: {
    unlockPrompt: "Unlock KaalKey Authenticator",
    promptSubtitle: "Use biometrics or your device screen lock",
    cancelButton: "Cancel",
    disableConfirmPrompt: "Confirm to turn off KaalKey app lock",
    enablePrompt: "Enable app lock for KaalKey",
    deviceLockTitle: "Set up your device screen lock",
    deviceLockBody:
      "KaalKey uses your phone's built-in authentication. Set a device PIN, pattern, or password in your phone's security settings, then try again. Biometrics are optional.",
    unavailableTitle: "Device authentication unavailable",
    unavailableBody:
      "Your phone could not start secure authentication. Check that a device screen lock is configured, then try again.",
    lockedTitle: "Authentication temporarily locked",
    lockedBody:
      "Your phone has temporarily disabled authentication after too many attempts. Wait and try again.",
    promptErrorTitle: "Authentication unavailable",
    promptErrorBody:
      "KaalKey could not start the phone's secure authentication prompt. Please try again.",
    webLock:
      "Device authentication lock is not available in the web version yet. The web vault remains unlocked; use the Android app for native device authentication.",
    disabledTitle: "App lock disabled",
    disabledBody: "KaalKey app lock has been turned off.",
    saveErrorTitle: "Could not save setting",
    disableSaveError: "The app lock remains enabled. Please try again.",
    enabledTitle: "App lock enabled",
    enabledBody:
      "KaalKey will request your phone's built-in authentication when opened and when you return to it.",
    enableSaveError: "App lock could not be enabled. Please try again.",
  },
} as const;

const getFunctionTemplate = (value: (...args: unknown[]) => string) => {
  const source = value.toString();
  const templateMatch = source.match(/=>\s*`([\s\S]*?)`/);
  if (!templateMatch) return null;
  return templateMatch[1]
    .replace(/\\n/g, "\n")
    .replace(/\$\{([^}]+)\}/g, (_, expr: string) => `{${expr.trim()}}`);
};

const getFunctionValues = (value: (...args: unknown[]) => string, args: unknown[]) => {
  const source = value.toString();
  const paramsMatch = source.match(/\(([^)]*)\)/);
  if (!paramsMatch) return {} as Record<string, string | number>;

  const entries = paramsMatch[1]
    .split(",")
    .map((param) => param.trim())
    .filter(Boolean)
    .map((name, index) => [name, args[index]] as const);

  return Object.fromEntries(entries) as Record<string, string | number>;
};

const localizeUserMessages = (messages: typeof userMessages) => {
  const walk = <T>(value: T): T => {
    if (typeof value === "function") {
      return ((...args: unknown[]) => {
        const template = getFunctionTemplate(value as (...args: unknown[]) => string);
        if (!template) {
          const resolved = (value as (...args: unknown[]) => string)(...args);
          return localize(resolved);
        }

        const values = getFunctionValues(value as (...args: unknown[]) => string, args);
        return localize(template, values);
      }) as unknown as T;
    }
    if (value && typeof value === "object") {
      return new Proxy(value, {
        get(target, property, receiver) {
          return walk(Reflect.get(target, property, receiver));
        },
      });
    }
    return (typeof value === "string" ? localize(value) : value) as T;
  };

  return walk(messages);
};

export const USER_MESSAGES = localizeUserMessages(userMessages);
