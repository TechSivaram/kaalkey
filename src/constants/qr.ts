/** Image preprocessing defaults used when importing QR codes from images. */
// Keep native gallery/paste decoding lightweight; large images are resized before JPEG/Base64/RGBA work.
export const QR_IMAGE_MAX_WIDTH = 1000;

/** Browser camera QR scanning settings. Keep values stable unless intentionally tuning scan performance. */
export const WEB_QR_CAMERA_IDEAL_WIDTH = 1280;
export const WEB_QR_CAMERA_IDEAL_HEIGHT = 720;
export const WEB_QR_SCAN_MAX_FRAME_WIDTH = 1280;
export const WEB_QR_SCAN_CENTER_CROP_RATIO = 0.7;
