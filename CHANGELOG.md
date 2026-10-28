## 1.1.22

- Added an Expo Camera native still-image QR scan attempt for Android and iOS before the existing JavaScript image decoding fallback.
- Kept web image import unchanged and preserved shared QR validation/account import handling.
- The native decoder returns QR text directly when successful, avoiding JPEG/Base64/RGBA processing in JavaScript for that path.

## 1.1.21

- Reduced native gallery and pasted-image preprocessing width from 1800px to 1000px before JPEG/Base64/RGBA decoding to reduce pixel-processing cost on Android/iOS.
- Kept the existing native camera scanner and QR decoder behavior unchanged.
- This is a performance tradeoff: very small QR codes embedded in large images may need a higher-resolution source.

## 1.1.20

- Reduced web QR image import fallback from up to 24 jsQR attempts to a bounded sequence: normalized full image, center crop, and at most one alternate-scale decode.
- Preserved the native camera scanning path and Android image-import pipeline.

## 1.1.19

- Fixed extracted-style references in ActivityOverlayModal and CountdownRing.
- Removed unused imports and local variables reported by ESLint.

## 1.1.18

- Moved component-local style definitions into `src/styles/component.styles.ts`.
- Extracted state-dependent styles into style factory functions.
- Kept browser video CSS separate from React Native styles.
