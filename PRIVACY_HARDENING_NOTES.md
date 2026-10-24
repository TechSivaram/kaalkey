# KaalKey privacy hardening

## Changes

- Added `expo-screen-capture` (`~58.0.6`) to the Expo SDK 58 dependencies.
- Enabled screen-capture prevention in the root layout for the entire app lifetime.
  On Android this applies `FLAG_SECURE`, blocking screenshots/recording and blanking
  the recent-apps preview.
- Enabled the iOS app-switcher privacy overlay at a high blur intensity.
- Existing vault render gating remains in place: while the lock preference is being
  read, or while app lock is enabled and authentication has not succeeded, the account
  list and OTP screen are not rendered.

## Before building

The uploaded bundle's `package-lock.json` predates `expo-screen-capture`. Run
`npm install` (or `npx expo install expo-screen-capture`) once to update the lockfile,
then run `npx expo-doctor`, `npm run lint`, and `npx tsc --noEmit`.

## Required device verification

This source-only review cannot prove behavior on a running native build. After
installing a fresh Android/iOS build, verify:

1. With app lock enabled, force-stop and reopen; cancel authentication and confirm no OTPs appear.
2. With app lock enabled, open OTPs, press Home/Recents, and inspect the preview.
3. Try a screenshot and screen recording while KaalKey is foregrounded.
4. Switch away and return quickly; confirm no OTP is visible until authentication succeeds.
5. Repeat after phone lock/unlock and after authentication cancellation.
6. Confirm the web build still behaves as expected; native capture protection does not
   provide equivalent browser security.

Note: preventing screenshots does not stop a second physical camera from photographing
the screen, and no client-side code can guarantee protection against a compromised OS.
