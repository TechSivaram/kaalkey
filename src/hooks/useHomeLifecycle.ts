import { useEffect, useState } from "react";
import { BRAND_SPLASH_DURATION_MS } from "../constants/ui";

/** Owns the home screen's startup splash and live TOTP clock lifecycle. */
export function useHomeLifecycle() {
  const [showBrandSplash, setShowBrandSplash] = useState(true);

  useEffect(() => {
    const splashTimer = setTimeout(() => setShowBrandSplash(false), BRAND_SPLASH_DURATION_MS);
    return () => clearTimeout(splashTimer);
  }, []);

  return { showBrandSplash };
}
