import { describe, expect, it } from 'vitest';
import {
  DEFAULT_OTP_EXPIRY_SECONDS,
  MAX_OTP_COOLDOWN_SECONDS,
  getResendButtonLabel,
  resolveCooldownSeconds,
} from './auth-cooldown';

describe('OTP resend cooldown and expiry rules', () => {
  it('displays 60 seconds when retryAfterSeconds=60', () => {
    const cooldown = resolveCooldownSeconds(60);
    expect(cooldown).toBe(60);
    expect(getResendButtonLabel(cooldown)).toBe('Resend code in 60s');
  });

  it('reflects server retryAfterSeconds directly when provided', () => {
    const cooldown17 = resolveCooldownSeconds(17);
    expect(cooldown17).toBe(17);
    expect(getResendButtonLabel(cooldown17)).toBe('Resend code in 17s');

    const cooldown45 = resolveCooldownSeconds(45);
    expect(cooldown45).toBe(45);
    expect(getResendButtonLabel(cooldown45)).toBe('Resend code in 45s');

    const cooldown1 = resolveCooldownSeconds(1);
    expect(cooldown1).toBe(1);
    expect(getResendButtonLabel(cooldown1)).toBe('Resend code in 1s');
  });

  it('defaults to 60 seconds if retryAfterSeconds is missing or invalid', () => {
    expect(resolveCooldownSeconds(undefined)).toBe(60);
    expect(resolveCooldownSeconds(null)).toBe(60);
    expect(resolveCooldownSeconds(0)).toBe(60);
    expect(resolveCooldownSeconds(-10)).toBe(60);
  });

  it('confirms OTP validity expiry remains at 300 seconds (5 minutes)', () => {
    expect(DEFAULT_OTP_EXPIRY_SECONDS).toBe(300);
    expect(MAX_OTP_COOLDOWN_SECONDS).toBe(60);
  });

  it('transitions button label to "Resend code" when countdown reaches 0', () => {
    let timer = resolveCooldownSeconds(60);
    expect(getResendButtonLabel(timer)).toBe('Resend code in 60s');

    // Simulate countdown
    while (timer > 0) {
      timer -= 1;
    }

    expect(timer).toBe(0);
    expect(getResendButtonLabel(timer)).toBe('Resend code');
  });
});
