/**
 * Platform-neutral permission and capability contracts.
 */
export type CameraPermissionState = {
  granted: boolean;
} | null;

export type CameraPermissionRequestResult = {
  granted: boolean;
};

export type CameraPermissionController = {
  permission: CameraPermissionState;
  requestPermission: () => Promise<CameraPermissionRequestResult>;
};

export type BiometricCapabilities = {
  hardwareAvailable: boolean;
  biometricsEnrolled: boolean;
  supportedAuthenticationTypes: number[];
};
