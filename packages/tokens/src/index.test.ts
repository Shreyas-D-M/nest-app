import { describe, expect, it } from 'vitest';
import { CONTRAST_AA_LARGE_TEXT, CONTRAST_AA_NORMAL_TEXT, MIN_TOUCH_TARGET } from './a11y';
import { lightColors } from './color';
import { palette } from './palette';
import { radius } from './radius';
import { SPACING_BASE, spacing } from './spacing';
import { typography } from './typography';

/** Linearise one 8-bit sRGB channel, per WCAG 2.1. */
function linearise(channel8Bit: number): number {
  const c = channel8Bit / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const value = hex.replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);

  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);

  return (lighter + 0.05) / (darker + 0.05);
}

describe('palette', () => {
  it('contains only six-digit uppercase hex values', () => {
    for (const [name, value] of Object.entries(palette)) {
      expect(value, name).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});

describe('contrast — text pairings must meet WCAG AA for normal text', () => {
  const textPairings: ReadonlyArray<readonly [string, string, string]> = [
    ['textPrimary on background', lightColors.textPrimary, lightColors.background],
    ['textPrimary on surface', lightColors.textPrimary, lightColors.surface],
    ['textPrimary on surfaceMuted', lightColors.textPrimary, lightColors.surfaceMuted],
    ['textSecondary on background', lightColors.textSecondary, lightColors.background],
    ['textSecondary on surface', lightColors.textSecondary, lightColors.surface],
    [
      'actionPrimaryText on actionPrimary',
      lightColors.actionPrimaryText,
      lightColors.actionPrimary,
    ],
    [
      'actionSecondaryText on actionSecondary',
      lightColors.actionSecondaryText,
      lightColors.actionSecondary,
    ],
    ['accentText on accent', lightColors.accentText, lightColors.accent],
  ];

  for (const [label, foreground, background] of textPairings) {
    it(label, () => {
      expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(CONTRAST_AA_NORMAL_TEXT);
    });
  }
});

describe('contrast — status colours', () => {
  /**
   * Status colours are held to the AA large-text / non-text-component threshold
   * (3.0) rather than 4.5.
   *
   * `warning` (#B7791F) measures ~3.64 against both light surfaces, so it does
   * NOT meet AA for normal-size body text. It is therefore only valid as a fill,
   * an icon colour, a border, or large text — always accompanied by a text
   * label, since 04_DESIGN_SYSTEM.md forbids encoding status with colour alone.
   */
  const statusColors = {
    success: lightColors.success,
    warning: lightColors.warning,
    danger: lightColors.danger,
    info: lightColors.info,
  };

  for (const [name, color] of Object.entries(statusColors)) {
    it(`${name} is distinguishable on surface`, () => {
      expect(contrastRatio(color, lightColors.surface)).toBeGreaterThanOrEqual(
        CONTRAST_AA_LARGE_TEXT,
      );
    });

    it(`${name} is distinguishable on background`, () => {
      expect(contrastRatio(color, lightColors.background)).toBeGreaterThanOrEqual(
        CONTRAST_AA_LARGE_TEXT,
      );
    });
  }
});

describe('spacing', () => {
  it('is built on the 4 px base unit', () => {
    expect(SPACING_BASE).toBe(4);

    for (const [name, value] of Object.entries(spacing)) {
      expect(value % SPACING_BASE, name).toBe(0);
    }
  });

  it('increases monotonically', () => {
    const values = Object.values(spacing);
    const sorted = [...values].sort((a, b) => a - b);
    expect(values).toEqual(sorted);
  });
});

describe('radius', () => {
  it('matches the specified scale', () => {
    expect(radius.sm).toBe(10);
    expect(radius.md).toBe(16);
    expect(radius.lg).toBe(24);
    expect(radius.pill).toBe(999);
  });
});

describe('typography', () => {
  it('keeps every size within the specified mobile ranges', () => {
    expect(typography.display.fontSize).toBeGreaterThanOrEqual(30);
    expect(typography.display.fontSize).toBeLessThanOrEqual(34);
    expect(typography.h1.fontSize).toBeGreaterThanOrEqual(24);
    expect(typography.h1.fontSize).toBeLessThanOrEqual(28);
    expect(typography.h2.fontSize).toBeGreaterThanOrEqual(20);
    expect(typography.h2.fontSize).toBeLessThanOrEqual(22);
    expect(typography.body.fontSize).toBe(16);
    expect(typography.secondary.fontSize).toBe(14);
    expect(typography.caption.fontSize).toBeGreaterThanOrEqual(12);
    expect(typography.caption.fontSize).toBeLessThanOrEqual(13);
  });

  it('gives every style a line height greater than its font size', () => {
    for (const [name, style] of Object.entries(typography)) {
      expect(style.lineHeight, name).toBeGreaterThan(style.fontSize);
    }
  });
});

describe('accessibility', () => {
  it('requires 44 pt touch targets', () => {
    expect(MIN_TOUCH_TARGET).toBe(44);
  });
});
