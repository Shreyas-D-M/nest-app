export const MAX_OTP_COOLDOWN_SECONDS = 60;
export const DEFAULT_OTP_EXPIRY_SECONDS = 300;

/**
 * Resolves the OTP resend cooldown in seconds using the server's retryAfterSeconds as the source of truth.
 *
 * If the server returns a positive number (e.g. 17, 45, 60), it is used directly.
 * Defaults to 60 seconds if not provided or non-positive.
 */
export function resolveCooldownSeconds(rawSeconds?: number | null): number {
  if (typeof rawSeconds === 'number' && Number.isFinite(rawSeconds) && rawSeconds >= 1) {
    return Math.round(rawSeconds);
  }
  return 60;
}

/**
 * Formats the resend button label according to cooldown state.
 *
 * When cooldown > 0: "Resend code in 60s" counting down to "Resend code in 1s".
 * When cooldown <= 0: "Resend code".
 */
export function getResendButtonLabel(cooldownSeconds: number): string {
  if (cooldownSeconds > 0) {
    return `Resend code in ${cooldownSeconds}s`;
  }
  return 'Resend code';
}
