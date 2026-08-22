/**
 * Motion tokens.
 *
 * 04_DESIGN_SYSTEM.md specifies subtle 150–250 ms transitions and reserves
 * spring animation for three moments only: booking confirmation, favourite
 * toggle and status changes. Animation is not applied to every element.
 */

export const duration = {
  fast: 150,
  base: 200,
  slow: 250,
} as const;

export type DurationToken = keyof typeof duration;

/**
 * Spring configuration for the three sanctioned spring moments. Values are
 * expressed in the shape React Native's Animated spring accepts.
 */
export const spring = {
  standard: {
    damping: 18,
    stiffness: 180,
    mass: 1,
  },
} as const;

/** The interactions permitted to use spring animation. */
export const SPRING_MOMENTS = ['bookingConfirmation', 'favoriteToggle', 'statusChange'] as const;

export type SpringMoment = (typeof SPRING_MOMENTS)[number];
