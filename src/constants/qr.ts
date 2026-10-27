/** Image preprocessing defaults used when importing QR codes from images. */
export const QR_IMAGE_MAX_WIDTH = 1800;

/** Browser camera QR scanning settings. Keep values stable unless intentionally tuning scan performance. */
export const WEB_QR_CAMERA_IDEAL_WIDTH = 1280;
export const WEB_QR_CAMERA_IDEAL_HEIGHT = 720;
export const WEB_QR_SCAN_MAX_FRAME_WIDTH = 1280;
export const WEB_QR_SCAN_CENTER_CROP_RATIO = 0.7;

/** Browser image-import decode attempts; these values affect scan reliability. */
export const QR_IMAGE_SMALL_SOURCE_THRESHOLD = 1400;
export const QR_IMAGE_SMALL_SOURCE_SCALE = 2;
export const QR_IMAGE_LARGE_SOURCE_SCALE = 0.5;
export const QR_IMAGE_ALTERNATE_SCALE = 1.5;
export const QR_IMAGE_HIGH_SCALE = 3;
export const QR_IMAGE_CROP_RATIO = 0.72;
