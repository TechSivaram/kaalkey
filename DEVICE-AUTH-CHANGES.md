KaalKey — native device authentication fallback

Changes in this update:

- Uses expo-local-authentication with disableDeviceFallback: false so the OS can offer device credentials where supported.
- Removes biometric-hardware/enrollment prechecks that prevented enabling app lock on devices without biometrics.
- Explains that the user may authenticate with biometrics or the configured device screen lock (PIN, pattern, or password).
- Keeps the vault locked unless authenticateAsync returns success.
- Handles missing device screen lock, unavailable authentication, and temporary lockout with explicit messages.
- Avoids unlocking as a side effect while confirming app-lock enable/disable; the setting is changed only after successful authentication and preference persistence.
- Preserves the existing SecureStore key so previously saved app-lock preferences continue to work.

Testing note: Source changes have been syntax-checked, but they have not been built or tested on a physical Android device. Test device-credential fallback, biometrics, cancellation, failed attempts, Back navigation, and background/foreground behavior before releasing an APK.
