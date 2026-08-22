/**
 * Accessibility constants.
 *
 * These are requirements from 04_DESIGN_SYSTEM.md, expressed as tokens so that
 * components can reference them instead of restating magic numbers.
 */

/** Minimum touch target, in points, for any interactive element. */
export const MIN_TOUCH_TARGET = 44;

/**
 * WCAG 2.1 AA contrast minimums.
 *
 * Used by the token contrast test. Status must never be conveyed by colour
 * alone, so these thresholds are a floor, not a substitute for a text or icon
 * label.
 */
export const CONTRAST_AA_NORMAL_TEXT = 4.5;
export const CONTRAST_AA_LARGE_TEXT = 3;
