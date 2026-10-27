# KaalKey refactor notes

## Latest refactor

`src/app/index.tsx` is now 516 lines, down from 1,766 lines in the original version (1,250 fewer lines, about a 71% reduction). This pass extracted the account row UI and its one-time-code countdown into `src/components/AccountCard.tsx`.

### Custom hooks

- `src/hooks/useQrImageImport.ts` owns QR image import from the browser file picker, native photo library, native clipboard, and pasted web images. It uses a current callback ref so the web paste listener can call the latest QR handler without being re-registered on every render.
- `src/hooks/useQrAccountScanner.ts` owns camera permission/scanner state, camera scan debouncing, TOTP URI parsing and validation, duplicate checks for imported QR codes, account save after QR import, and clipboard TOTP URL import.
- `src/hooks/useBackupManager.ts` owns encrypted backup export, backup file selection, restore/decryption, duplicate merging, and the associated backup UI actions.
- `src/hooks/useAccounts.ts` owns account loading and persistence, account editor fields, account creation/editing, duplicate checks, and account deletion. QR parsing/scanning remains in the QR scanner hook and uses the shared account-save function.
- `src/hooks/useLegalAcceptance.ts` owns loading and saving legal-notice acceptance, plus the legal notice screen's state.
- `src/hooks/useBiometricLock.ts` owns saved app-lock preference loading, native authentication prompts, enable/disable behavior, background/foreground relocking, and Android Back handling while locked.
- `src/hooks/useHaptics.ts` owns the saved haptic-feedback preference, toggling/persistence, and best-effort platform vibration feedback.
- `src/components/AccountCard.tsx` renders one account row, its generated TOTP code, the countdown ring, and the QR/edit/delete actions; handlers remain owned by the screen and existing hooks.

The existing UI components and service functions remain in place. The refactor is intended to preserve existing workflows rather than redesign them. The account-card extraction is a presentation-boundary change: it receives the account, current time, and callbacks as props.

## Validation status

- TypeScript transpilation/syntax checks should be run after this change; a full project type-check and runtime tests have not been performed for this version.
- ZIP integrity check passed after packaging.
- A complete TypeScript type-check, Expo build, and device runtime test were not performed in this environment. Please run `npx tsc --noEmit`, `npx expo-doctor`, and test app-lock enable/disable, background/foreground relocking, legal acceptance persistence, QR camera scanning, gallery QR import, pasted QR images, clipboard TOTP URL import, account creation/edit/delete, encrypted backup export/restore, and Web behavior before producing a release APK.

## Assets

The uploaded source archive did not contain the `assets/` directory. Keep the existing project's assets unchanged when applying these source changes.

## V10: Account list toolbar

- Extracted the account search input, clear-search control, and service/account sort buttons from `src/app/index.tsx` into `src/components/AccountListToolbar.tsx`.
- The existing `useAccountList` hook remains responsible for search/sort state and derived visible accounts; the new component only renders the controls and invokes the supplied callbacks.
- Preserved labels, styles, haptic feedback, and conditional visibility when the account list is non-empty.
- Verification in this environment: source syntax/transpilation and ZIP integrity only. Run `npx tsc --noEmit`, `npm run lint`, and app interaction tests locally.
