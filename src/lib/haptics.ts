/** Trigger a subtle haptic pulse. Gracefully degrades on unsupported browsers. */
export function haptic(ms = 20) {
  try {
    navigator?.vibrate?.(ms);
  } catch {}
}
