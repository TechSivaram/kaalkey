# V116 — Web QR scanner style typing fix

- Split React Native container/text styles from browser video CSS styles in `WebQrScanner.tsx`.
- Replaced invalid React Native `display: "block"` with a properly typed `CSSProperties` style for the HTML video element.
- Typed container and message styles through `StyleSheet.create` to prevent the mixed `ViewStyle | TextStyle | ImageStyle` union from reaching component props.
- Updated package and Expo app versions to `1.1.16`.
