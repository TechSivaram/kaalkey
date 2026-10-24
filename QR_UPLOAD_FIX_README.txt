KaalKey QR image upload fix v3

Changes:
- Web decoder uses the browser Image constructor explicitly and reports import errors visibly.
- Android/iOS first normalize the gallery image to a high-quality JPEG and decode locally with jsQR, then fall back to Expo Camera still-image decoding.
- Image contents are processed locally; no image upload is performed.

Install dependencies and restart:
  npm install
  npx expo start --clear

This source patch has not been validated in a running native build/browser in this environment. Please test on both platforms.
