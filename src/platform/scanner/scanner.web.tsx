import { getWebQrCameraErrorMessage } from "../../utils/webQrScanner";
import { useAppLanguage } from "../../i18n";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import jsQR from "jsqr";
import { WEB_QR_SCAN_THROTTLE_MS } from "../../constants/ui";
import { webQrScannerStyles as styles, webQrVideoStyle } from "../../styles/component.styles";
import {
  WEB_QR_CAMERA_IDEAL_HEIGHT,
  WEB_QR_CAMERA_IDEAL_WIDTH,
  WEB_QR_SCAN_CENTER_CROP_RATIO,
  WEB_QR_SCAN_MAX_FRAME_WIDTH,
} from "../../constants/qr";

import type { ScannerCameraProps } from "./types";

/** Browser-only camera scanner. Uses jsQR directly so a stalled experimental
 * BarcodeDetector cannot block frame decoding. */
export default function WebScannerCamera({
  active,
  onDetected,
  facing = "back",
  selectedCameraDeviceId,
  onCameraDevicesChange,
  onCameraReady,
  onMountError,
}: ScannerCameraProps) {
  const { t } = useAppLanguage();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const onDetectedRef = useRef(onDetected);
  const onCameraReadyRef = useRef(onCameraReady);
  const onMountErrorRef = useRef(onMountError);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    onCameraReadyRef.current = onCameraReady;
    onMountErrorRef.current = onMountError;
  }, [onCameraReady, onMountError]);

  useEffect(() => {
    if (!active) return;
    let disposed = false;
    let lastScan = 0;

    const stop = () => {
      if (scanTimerRef.current !== null) window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          onMountErrorRef.current({ message: t("qrScanner.cameraUnavailableOpen") });
          return;
        }
        // Prefer an explicitly selected device. On first launch, use facingMode
        // as a hint because browsers may hide camera labels until permission is granted.
        const devices = await navigator.mediaDevices.enumerateDevices();
        let cameras = devices.filter((device) => device.kind === "videoinput");
        const frontLabel = /front|user|facetime|selfie/i;
        const backLabel = /back|rear|environment|world/i;
        const wantedLabel = facing === "front" ? frontLabel : backLabel;
        let selectedCamera = selectedCameraDeviceId
          ? cameras.find((camera) => camera.deviceId === selectedCameraDeviceId)
          : cameras.find((camera) => wantedLabel.test(camera.label));

        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: WEB_QR_CAMERA_IDEAL_WIDTH },
          height: { ideal: WEB_QR_CAMERA_IDEAL_HEIGHT },
          ...(selectedCamera
            ? { deviceId: { exact: selectedCamera.deviceId } }
            : { facingMode: { ideal: facing === "front" ? "user" : "environment" } }),
        };
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: videoConstraints,
          });
        } catch (error) {
          // A device may disappear between enumeration and acquisition. Retry
          // with facingMode so scanning can still start on the remaining camera.
          if (!selectedCamera) throw error;
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: facing === "front" ? "user" : "environment" },
              width: { ideal: WEB_QR_CAMERA_IDEAL_WIDTH },
              height: { ideal: WEB_QR_CAMERA_IDEAL_HEIGHT },
            },
          });
        }
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        // Permission has now been granted, so browsers generally expose camera labels.
        try {
          cameras = (await navigator.mediaDevices.enumerateDevices()).filter(
            (device) => device.kind === "videoinput",
          );
          const activeDeviceId =
            stream.getVideoTracks()[0]?.getSettings().deviceId ?? selectedCamera?.deviceId ?? null;
          onCameraDevicesChange?.(
            cameras.map((camera, index) => ({
              deviceId: camera.deviceId,
              label: camera.label.trim() || `Camera ${index + 1}`,
            })),
            activeDeviceId,
          );
        } catch {
          // Camera enumeration is optional; scanning can continue without the picker.
        }
        const video = videoRef.current;
        if (!video) {
          onMountErrorRef.current({ message: t("qrScanner.cameraPreviewUnavailable") });
          stop();
          return;
        }
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        await video.play();
        onCameraReadyRef.current();

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
          onMountErrorRef.current({ message: t("qrScanner.browserCannotProcess") });
          stop();
          return;
        }

        const scanFrame = () => {
          if (disposed) return;
          const now = performance.now();
          if (
            video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
            video.videoWidth > 0 &&
            now - lastScan > WEB_QR_SCAN_THROTTLE_MS
          ) {
            lastScan = now;
            try {
              // Limit the frame dimensions for consistent performance.
              const scale = Math.min(1, WEB_QR_SCAN_MAX_FRAME_WIDTH / video.videoWidth);
              const frameWidth = Math.max(1, Math.round(video.videoWidth * scale));
              const frameHeight = Math.max(1, Math.round(video.videoHeight * scale));

              // Assigning canvas dimensions clears its bitmap and resets the
              // context. Avoid doing that on every scan when the camera size
              // has not changed.
              if (canvas.width !== frameWidth) canvas.width = frameWidth;
              if (canvas.height !== frameHeight) canvas.height = frameHeight;

              context.drawImage(video, 0, 0, frameWidth, frameHeight);
              let pixels = context.getImageData(0, 0, canvas.width, canvas.height);
              // Most authenticator QR codes use the standard dark-on-light
              // format. Try that inexpensive path first instead of asking jsQR
              // to test both polarities on every frame.
              let result = jsQR(pixels.data, pixels.width, pixels.height, {
                inversionAttempts: "dontInvert",
              });

              // If the full frame misses, retry the central region; this helps
              // when a QR is small in a wide webcam frame. The cropped retry
              // checks both polarities so inverted QR codes remain supported.
              if (!result) {
                const cropWidth = Math.max(
                  1,
                  Math.floor(canvas.width * WEB_QR_SCAN_CENTER_CROP_RATIO),
                );
                const cropHeight = Math.max(
                  1,
                  Math.floor(canvas.height * WEB_QR_SCAN_CENTER_CROP_RATIO),
                );
                const cropX = Math.floor((canvas.width - cropWidth) / 2);
                const cropY = Math.floor((canvas.height - cropHeight) / 2);
                pixels = context.getImageData(cropX, cropY, cropWidth, cropHeight);
                result = jsQR(pixels.data, pixels.width, pixels.height, {
                  inversionAttempts: "attemptBoth",
                });
              }
              if (result?.data && !disposed) {
                stop();
                onDetectedRef.current(result.data);
                return;
              }
            } catch {}
          }
          if (!disposed) {
            scanTimerRef.current = window.setTimeout(scanFrame, WEB_QR_SCAN_THROTTLE_MS);
          }
        };
        scanFrame();
      } catch (error) {
        onMountErrorRef.current({ message: t(getWebQrCameraErrorMessage(error)) });
      }
    };
    void start();
    return () => {
      disposed = true;
      stop();
    };
  }, [active, facing, selectedCameraDeviceId, onCameraDevicesChange, t]);

  return (
    <View style={styles.container}>
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        aria-label={t("qrScanner.qrScannerCamera")}
        style={webQrVideoStyle}
      />
    </View>
  );
}
