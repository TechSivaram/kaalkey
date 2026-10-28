import { getWebQrCameraErrorMessage } from "../utils/webQrScanner";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Platform, Text, View, StyleSheet } from "react-native";
import jsQR from "jsqr";
import { WEB_QR_SCAN_THROTTLE_MS } from "../constants/ui";
import { COLORS } from "../constants/colors";
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
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      width: "100%",
      minHeight: 220,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.webScannerBackground,
      overflow: "hidden",
    },
    message: {
      color: "white",
      fontSize: 12,
      padding: 8,
      textAlign: "center",
    },
  });
  // HTMLVideoElement uses browser CSS types, not React Native ViewStyle.
  const videoStyle: CSSProperties = {
    display: "block",
    width: "100%",
    height: 240,
    objectFit: "contain",
    backgroundColor: COLORS.webScannerBackground,
  };
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
            "Camera unavailable. Open this page on HTTPS or localhost and allow camera access.",
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
          setMessage("Camera preview is unavailable. Close and reopen the scanner.");
          stop();
          return;
        }
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        await video.play();
        setMessage("Camera ready — point it at the full QR code.");

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
          setMessage("This browser cannot process camera frames.");
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
                setMessage("QR code detected.");
                stop();
                onDetectedRef.current(result.data);
                return;
              }
            } catch {
              setMessage(
                "Couldn't read camera frames. Check camera permissions and reload this page.",
              );
            }
          }
          if (!disposed) frameRef.current = requestAnimationFrame(scanFrame);
        };
        frameRef.current = requestAnimationFrame(scanFrame);
      } catch (error) {
        setMessage(getWebQrCameraErrorMessage(error));
      }
    };
    void start();
    return () => {
      disposed = true;
      stop();
    };
  }, [active]);

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <>
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            aria-label="QR scanner camera preview"
            style={videoStyle}
          />
          <Text style={styles.message}>{message}</Text>
        </>
      ) : null}
    </View>
  );
}
