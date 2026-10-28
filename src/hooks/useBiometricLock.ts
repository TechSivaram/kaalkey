import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, BackHandler, Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

import { BIOMETRIC_ENABLED_STORAGE_KEY } from "../constants/storage";

export function useBiometricLock() {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const authenticatingRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    let mounted = true;

    async function loadBiometricPreference() {
      try {
        const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_STORAGE_KEY);
        if (!mounted) return;
        // Native device authentication is not available through this web build.
        // Keep the web vault unlocked by default rather than showing a dead-end prompt.
        // Native platforms continue to respect the user's saved switch preference.
        const shouldEnable = Platform.OS !== "web" && enabled === "true";
        setBiometricEnabled(shouldEnable);
        setIsUnlocked(!shouldEnable);
      } catch {
        if (mounted) {
          if (Platform.OS === "web") {
            // Web has no native authentication flow, so it must not get trapped behind
            // an authentication prompt that cannot run.
            setBiometricEnabled(false);
            setIsUnlocked(true);
          } else {
            // On native platforms, fail closed if a previously saved lock preference
            // cannot be read; never silently bypass an existing lock.
            setBiometricEnabled(true);
            setIsUnlocked(false);
          }
        }
      } finally {
        if (mounted) setBiometricReady(true);
      }
    }

    void loadBiometricPreference();
    return () => {
      mounted = false;
    };
  }, []);

  const authenticateUser = useCallback(
    async (
      promptMessage = "Unlock KaalKey Authenticator",
      unlockOnSuccess = true,
    ): Promise<boolean> => {
      if (authenticatingRef.current) return false;
      authenticatingRef.current = true;
      setAuthenticating(true);
      try {
        // Use Android's native BiometricPrompt with device-credential fallback enabled.
        // This allows biometrics when available and the OS screen-lock credential (PIN,
        // pattern, or password) when supported. Never unlock unless the native API succeeds.
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage,
          promptSubtitle: "Use biometrics or your device screen lock",
          cancelLabel: "Cancel",
          disableDeviceFallback: false,
          biometricsSecurityLevel: "strong",
        });
        if (result.success) {
          if (unlockOnSuccess) setIsUnlocked(true);
          return true;
        }

        // A missing device screen lock must not create a fallback or bypass.
        if (result.error === "not_enrolled" || result.error === "passcode_not_set") {
          Alert.alert(
            "Set up your device screen lock",
            "KaalKey uses your phone's built-in authentication. Set a device PIN, pattern, or password in your phone's security settings, then try again. Biometrics are optional.",
          );
        } else if (result.error === "not_available") {
          Alert.alert(
            "Device authentication unavailable",
            "Your phone could not start secure authentication. Check that a device screen lock is configured, then try again.",
          );
        } else if (result.error === "lockout") {
          Alert.alert(
            "Authentication temporarily locked",
            "Your phone has temporarily disabled authentication after too many attempts. Wait and try again.",
          );
        }
        // Cancellation, failed verification, and every other error leave the vault locked.
        return false;
      } catch {
        Alert.alert(
          "Authentication unavailable",
          "KaalKey could not start the phone's secure authentication prompt. Please try again.",
        );
        return false;
      } finally {
        authenticatingRef.current = false;
        setAuthenticating(false);
      }
    },
    [],
  );

  const toggleBiometricLock = useCallback(async () => {
    // Do not expose a non-working native-auth switch on web. The web build currently
    // has no implemented browser-authentication flow, so keep its app-level lock OFF.
    if (Platform.OS === "web") {
      const message =
        "Device authentication lock is not available in the web version yet. The web vault remains unlocked; use the Android app for native device authentication.";
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert(message);
      } else {
        Alert.alert("Authentication unavailable", message);
      }
      setBiometricEnabled(false);
      setIsUnlocked(true);
      return;
    }

    if (biometricEnabled) {
      // Do not unlock as a side effect of confirming the setting change. Only disable
      // the lock after authentication succeeds and the preference is persisted.
      const authenticated = await authenticateUser("Confirm to turn off KaalKey app lock", false);
      if (!authenticated) return;
      try {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_STORAGE_KEY, "false");
        setBiometricEnabled(false);
        setIsUnlocked(true);
        Alert.alert("App lock disabled", "KaalKey app lock has been turned off.");
      } catch {
        setIsUnlocked(false);
        Alert.alert("Could not save setting", "The app lock remains enabled. Please try again.");
      }
      return;
    }

    // Biometrics are not required to enable app lock. The native OS prompt can use
    // the configured device credential when biometrics are unavailable.
    const authenticated = await authenticateUser("Enable app lock for KaalKey", false);
    if (!authenticated) return;
    try {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_STORAGE_KEY, "true");
      setBiometricEnabled(true);
      setIsUnlocked(true);
      Alert.alert(
        "App lock enabled",
        "KaalKey will request your phone's built-in authentication when opened and when you return to it.",
      );
    } catch {
      Alert.alert("Could not save setting", "App lock could not be enabled. Please try again.");
    }
  }, [authenticateUser, biometricEnabled]);

  useEffect(() => {
    if (!biometricReady || !biometricEnabled || isUnlocked) return;

    // Defer the native authentication prompt until after the effect has committed.
    // This avoids synchronously triggering React state updates inside the effect.
    const promptTimer = setTimeout(() => {
      void authenticateUser();
    }, 0);

    return () => clearTimeout(promptTimer);
    // Prompt once when the saved lock setting requires authentication.
  }, [biometricReady, biometricEnabled, isUnlocked, authenticateUser]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const wasBackgrounded = /inactive|background/.test(appStateRef.current ?? "");
      appStateRef.current = nextState;
      if (biometricEnabled && nextState === "active" && wasBackgrounded) {
        setIsUnlocked(false);
        void authenticateUser();
      } else if (biometricEnabled && /inactive|background/.test(nextState)) {
        setIsUnlocked(false);
      }
    });
    return () => subscription.remove();
  }, [biometricEnabled, authenticateUser]);

  // While locked, Android Back must never uncover the underlying vault.
  useEffect(() => {
    if (!biometricReady || !biometricEnabled || isUnlocked) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => subscription.remove();
  }, [biometricReady, biometricEnabled, isUnlocked]);

  return {
    biometricEnabled,
    biometricReady,
    isUnlocked,
    authenticating,
    authenticateUser,
    toggleBiometricLock,
  };
}
