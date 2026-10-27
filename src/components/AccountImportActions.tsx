import type { Dispatch, SetStateAction } from "react";
import AccountQrImportActions from "./AccountQrImportActions";
import AccountManualEntryToggle from "./AccountManualEntryToggle";
import AccountTotpUrlImport from "./AccountTotpUrlImport";

type Props = {
  editingId: string | null;
  totpUrlInput: string;
  setTotpUrlInput: Dispatch<SetStateAction<string>>;
  manualExpanded: boolean;
  setManualExpanded: Dispatch<SetStateAction<boolean>>;
  openQrScanner: () => Promise<void>;
  importQrImage: () => Promise<void>;
  pasteQrImage: () => Promise<void>;
  importTotpUrl: (value: string) => Promise<void>;
  pasteTotpUrl: () => Promise<void>;
};

export default function AccountImportActions(props: Props) {
  const {
    editingId, totpUrlInput, setTotpUrlInput, manualExpanded, setManualExpanded,
    openQrScanner, importQrImage, pasteQrImage, importTotpUrl, pasteTotpUrl,
  } = props;
  return (
    <>
              {!editingId && (
                <AccountQrImportActions
                  onScan={openQrScanner}
                  onImportImage={importQrImage}
                  onPasteImage={pasteQrImage}
                />
              )}
              {!editingId && (
                <AccountTotpUrlImport
                  value={totpUrlInput}
                  setValue={setTotpUrlInput}
                  onImport={importTotpUrl}
                  onPaste={pasteTotpUrl}
                />
              )}
              {!editingId && (
                <AccountManualEntryToggle
                  expanded={manualExpanded}
                  setExpanded={setManualExpanded}
                />
              )}
    </>
  );
}
