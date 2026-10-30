import { getWebQrCameraErrorMessage } from "../utils/webQrScanner";
import { translate, useAppLanguage } from "../i18n";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Text, View } from "react-native";
import jsQR from "jsqr";
import { WEB_QR_SCAN_THROTTLE_MS } from "../constants/ui";
import { webQrScannerStyles as styles, webQrVideoStyle } from "../styles/component.styles";
import {
  WEB_QR_CAMERA_IDEAL_HEIGHT,
  WEB_QR_CAMERA_IDEAL_WIDTH,
  WEB_QR_SCAN_CENTER_CROP_RATIO,
  WEB_QR_SCAN_MAX_FRAME_WIDTH,
} from "../constants/qr";

type Props = {
  active: boolean;
  onDetected: (data: string) => void;
};

/** Browser-only camera scanner. Uses jsQR directly so a stalled experimental
 * BarcodeDetector cannot block frame decoding. */
export default function WebQrScanner({ active, onDetected }: Props) {
  const { language } = useAppLanguage();
  const t = useCallback((key: string) => translate(language, key), [language]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const onDetectedRef = useRef(onDetected);
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);
  const [message, setMessage] = useState("Starting camera…");

  useEffect(() => {
    if (Platform.OS !== "web" || !active) return;
    let disposed = false;
    let lastScan = 0;

    const stop = () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setMessage(
            t("Camera unavailable. Open this page on HTTPS or localhost and allow camera access."),
          );
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: WEB_QR_CAMERA_IDEAL_WIDTH },
            height: { ideal: WEB_QR_CAMERA_IDEAL_HEIGHT },
          },
        });
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          setMessage(t("Camera preview is unavailable. Close and reopen the scanner."));
          stop();
          return;
        }
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        await video.play();
        setMessage(t("Camera ready — point it at the full QR code."));

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
          setMessage(t("This browser cannot process camera frames."));
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
              canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
              canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              let pixels = context.getImageData(0, 0, canvas.width, canvas.height);
              let result = jsQR(pixels.data, pixels.width, pixels.height, {
                inversionAttempts: "attemptBoth",
              });

              // If the full frame misses, retry the central region; this helps
              // when a QR is small in a wide webcam frame.
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
                setMessage(t("QR code detected."));
                stop();
                onDetectedRef.current(result.data);
                return;
              }
            } catch {
              setMessage(
                t("Couldn't read camera frames. Check camera permissions and reload this page."),
              );
            }
          }
          if (!disposed) frameRef.current = requestAnimationFrame(scanFrame);
        };
        frameRef.current = requestAnimationFrame(scanFrame);
      } catch (error) {
        setMessage(t(getWebQrCameraErrorMessage(error)));
      }
    };
    void start();
    return () => {
      disposed = true;
      stop();
    };
  }, [active, language, t]);

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <>
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            aria-label={t("QR scanner camera preview")}
            style={webQrVideoStyle}
          />
          <Text style={styles.message}>{message}</Text>
        </>
      ) : null}
    </View>
  );
}
