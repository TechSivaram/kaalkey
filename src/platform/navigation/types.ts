/** Shared contract for subscribing to the Android hardware Back action. */
export type HardwareBackPressHandler = () => boolean;
export type Unsubscribe = () => void;
