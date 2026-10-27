import { useState } from "react";

/** Owns visibility state for the account editor and QR scanner overlays. */
export function useHomeOverlayState() {
  const [modalVisible, setModalVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);

  return {
    modalVisible,
    setModalVisible,
    scannerVisible,
    setScannerVisible,
  };
}
