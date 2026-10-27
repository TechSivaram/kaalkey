import { useEffect, useState } from "react";
import {
  BRAND_SPLASH_DURATION_MS,
  TOTP_CLOCK_REFRESH_INTERVAL_MS,
} from "../constants/ui";

/** Owns the home screen's startup splash and live TOTP clock lifecycle. */
export function useHomeLifecycle() {
  const [now, setNow] = useState(() => Date.now());
  const [showBrandSplash, setShowBrandSplash] = useState(true);

  useEffect(() => {
    const splashTimer = setTimeout(
      () => setShowBrandSplash(false),
      BRAND_SPLASH_DURATION_MS,
    );
    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, TOTP_CLOCK_REFRESH_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  return { now, showBrandSplash };
}
