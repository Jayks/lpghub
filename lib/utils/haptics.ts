/**
 * Trigger a short haptic feedback vibration on supported devices.
 * Silently no-ops on unsupported browsers.
 */
export function haptic(pattern: number | number[] = 10): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}
