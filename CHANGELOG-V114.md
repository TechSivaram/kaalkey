# V114 — Inline style refactor

- Extracted JSX inline style object literals into `StyleSheet.create` declarations across the source components.
- Refactored inline style objects in account import, activity overlay, countdown ring, home header, legal notice/document, QR scanner, and settings backup/activity components.
- Preserved runtime-dependent style values in component scope so they continue to respond to state and props.
- Updated package and Expo app versions to `1.1.14`.
- No intended UI behavior or feature changes.
