import { en, type MessageKey } from './messages/en';

/**
 * Supported locales.
 *
 * Only English ships in V1. Kannada, Hindi and Hinglish are P1 (02_PRD.md);
 * they are listed separately as planned rather than registered as supported,
 * because registering a locale with no catalogue would silently fall back to
 * English while claiming support.
 */
export const LOCALES = ['en'] as const;

export type Locale = (typeof LOCALES)[number];

/** Locales scheduled for P1. Not yet selectable. */
export const PLANNED_LOCALES = ['kn', 'hi', 'en-IN-hinglish'] as const;

export type PlannedLocale = (typeof PLANNED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

const catalogues: Record<Locale, Record<MessageKey, string>> = {
  en,
};

export type InterpolationValues = Readonly<Record<string, string | number>>;

export function isSupportedLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Substitutes `{placeholder}` tokens.
 *
 * An unmatched placeholder is left intact rather than replaced with `undefined`,
 * so that a missing value is visible in review instead of shipping the word
 * "undefined" to a user.
 */
export function interpolate(template: string, values?: InterpolationValues): string {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

export type Translate = (key: MessageKey, values?: InterpolationValues) => string;

/**
 * Builds a translator bound to a locale.
 *
 * A missing key returns the key itself. That makes the gap visible in the UI and
 * in screenshots without crashing a screen.
 *
 * This is deliberately a small hand-rolled implementation: Phase 0 has no
 * screens, and pulling in a full i18n runtime before there are strings to
 * translate would be an unjustified dependency. Plural and gender rules will
 * need a real ICU implementation; `Translate` is the seam to swap behind.
 */
export function createTranslator(locale: Locale = DEFAULT_LOCALE): Translate {
  const catalogue = catalogues[locale];

  return (key, values) => {
    const template = catalogue[key];

    if (template === undefined) {
      return key;
    }

    return interpolate(template, values);
  };
}

export { en };
export type { MessageKey };
