import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, BackHandler, Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

import { BIOMETRIC_ENABLED_STORAGE_KEY } from "../constants/storage";
import { USER_MESSAGES } from "../constants/userMessages";
import { showUserMessage } from "../utils/user-message";
import { shouldIgnoreExternalActivityTransition } from "../utils/externalActivity";

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
            USER_MESSAGES.biometric.deviceLockTitle,
            USER_MESSAGES.biometric.deviceLockBody,
          );
        } else if (result.error === "not_available") {
          Alert.alert(
            USER_MESSAGES.biometric.unavailableTitle,
            USER_MESSAGES.biometric.unavailableBody,
          );
        } else if (result.error === "lockout") {
          Alert.alert(USER_MESSAGES.biometric.lockedTitle, USER_MESSAGES.biometric.lockedBody);
        }
        // Cancellation, failed verification, and every other error leave the vault locked.
        return false;
      } catch {
        Alert.alert(
          USER_MESSAGES.biometric.promptErrorTitle,
          USER_MESSAGES.biometric.promptErrorBody,
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
      const message = USER_MESSAGES.biometric.webLock;
      showUserMessage(USER_MESSAGES.biometric.unavailableTitle, message);
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
        Alert.alert(USER_MESSAGES.biometric.disabledTitle, USER_MESSAGES.biometric.disabledBody);
      } catch {
        setIsUnlocked(false);
        Alert.alert(
          USER_MESSAGES.biometric.saveErrorTitle,
          USER_MESSAGES.biometric.disableSaveError,
        );
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
      Alert.alert(USER_MESSAGES.biometric.enabledTitle, USER_MESSAGES.biometric.enabledBody);
    } catch {
      Alert.alert(USER_MESSAGES.biometric.saveErrorTitle, USER_MESSAGES.biometric.enableSaveError);
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

      // Android's system image/document picker temporarily backgrounds KaalKey.
      // Keep the current unlock state while one of these trusted activities is open.
      if (shouldIgnoreExternalActivityTransition(nextState)) return;

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
