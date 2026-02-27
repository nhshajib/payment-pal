/** Light tap — digit press */
export function haptic(ms = 10) {
  try {
    navigator?.vibrate?.(ms);
  } catch {}
}

/** Error pattern — wrong PIN */
export function hapticError() {
  try {
    navigator?.vibrate?.([40, 50, 40, 50, 40]);
  } catch {}
}

/** Success pattern — correct PIN / login */
export function hapticSuccess() {
  try {
    navigator?.vibrate?.([10, 30, 10]);
  } catch {}
}
