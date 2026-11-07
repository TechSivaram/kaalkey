import { isDesktop, isWeb } from "../platform/runtime";
import { Alert } from "react-native";

function showDesktopMessage(title: string, message: string): void {
  if (typeof document === "undefined" || !document.body) return;

  const overlay = document.createElement("div");
  overlay.setAttribute("role", "presentation");
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    padding: "16px",
    background: "rgba(0, 0, 0, 0.58)",
    overflow: "auto",
  });

  const dialog = document.createElement("section");
  dialog.setAttribute("role", "alertdialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "kaalkey-alert-title");
  Object.assign(dialog.style, {
    width: "100%",
    maxWidth: "360px",
    minWidth: "0",
    boxSizing: "border-box",
    padding: "22px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#171717",
    color: "#FFFFFF",
    boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
    overflowWrap: "anywhere",
    fontFamily: "Segoe UI, Arial, sans-serif",
  });

  const heading = document.createElement("h2");
  heading.id = "kaalkey-alert-title";
  heading.textContent = title;
  Object.assign(heading.style, {
    margin: "0 0 12px",
    fontSize: "17px",
    lineHeight: "1.35",
    fontWeight: "700",
  });

  const body = document.createElement("p");
  body.textContent = message;
  Object.assign(body.style, {
    margin: "0",
    fontSize: "14px",
    lineHeight: "1.5",
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  });

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "OK";
  Object.assign(button.style, {
    display: "block",
    width: "100%",
    marginTop: "20px",
    minHeight: "42px",
    border: "0",
    borderRadius: "8px",
    background: "#F28C28",
    color: "#171717",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  });

  const close = () => {
    overlay.remove();
  };
  button.addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  dialog.append(heading, body, button);
  overlay.append(dialog);
  document.body.append(overlay);
  button.focus();
}

/** Desktop confirmation rendered inside the Electron app window. */
export function showUserConfirmation(
  title: string,
  message: string,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  destructive = false,
): Promise<boolean> {
  if (!isDesktop || typeof document === "undefined" || !document.body) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.setAttribute("role", "presentation");
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxSizing: "border-box",
      padding: "16px",
      background: "rgba(0,0,0,0.58)",
      overflow: "auto",
    });
    const dialog = document.createElement("section");
    dialog.setAttribute("role", "alertdialog");
    dialog.setAttribute("aria-modal", "true");
    Object.assign(dialog.style, {
      width: "100%",
      maxWidth: "360px",
      minWidth: "0",
      boxSizing: "border-box",
      padding: "22px",
      borderRadius: "14px",
      border: "1px solid rgba(255,255,255,0.12)",
      background: "#171717",
      color: "#FFFFFF",
      boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
      overflowWrap: "anywhere",
      fontFamily: "Segoe UI, Arial, sans-serif",
    });
    const heading = document.createElement("h2");
    heading.textContent = title;
    Object.assign(heading.style, { margin: "0 0 12px", fontSize: "17px", lineHeight: "1.35" });
    const body = document.createElement("p");
    body.textContent = message;
    Object.assign(body.style, {
      margin: "0",
      fontSize: "14px",
      lineHeight: "1.5",
      whiteSpace: "pre-wrap",
      overflowWrap: "anywhere",
    });
    const actions = document.createElement("div");
    Object.assign(actions.style, { display: "flex", gap: "10px", marginTop: "20px" });
    const finish = (value: boolean) => {
      overlay.remove();
      resolve(value);
    };
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = cancelLabel;
    Object.assign(cancel.style, {
      flex: "1",
      minWidth: "0",
      minHeight: "42px",
      border: "1px solid #555",
      borderRadius: "8px",
      background: "transparent",
      color: "#FFF",
      cursor: "pointer",
    });
    cancel.addEventListener("click", () => finish(false));
    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.textContent = confirmLabel;
    Object.assign(confirm.style, {
      flex: "1",
      minWidth: "0",
      minHeight: "42px",
      border: "0",
      borderRadius: "8px",
      background: destructive ? "#C7473A" : "#F28C28",
      color: "#171717",
      fontWeight: "700",
      cursor: "pointer",
    });
    confirm.addEventListener("click", () => finish(true));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) finish(false);
    });
    actions.append(cancel, confirm);
    dialog.append(heading, body, actions);
    overlay.append(dialog);
    document.body.append(overlay);
    confirm.focus();
  });
}

/** Displays a message consistently on Web and native platforms. */
export function showUserMessage(title: string, message: string): void {
  if (isDesktop) {
    showDesktopMessage(title, message);
  } else if (isWeb && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}
