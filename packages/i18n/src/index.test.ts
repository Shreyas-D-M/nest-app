import { describe, expect, it } from 'vitest';
import {
  createTranslator,
  DEFAULT_LOCALE,
  en,
  interpolate,
  isSupportedLocale,
  LOCALES,
} from './index';

describe('locales', () => {
  it('ships English only in V1', () => {
    expect(LOCALES).toEqual(['en']);
    expect(DEFAULT_LOCALE).toBe('en');
  });

  it('does not claim support for planned P1 locales', () => {
    expect(isSupportedLocale('en')).toBe(true);
    expect(isSupportedLocale('kn')).toBe(false);
    expect(isSupportedLocale('hi')).toBe(false);
  });
});

describe('catalogue', () => {
  it('has no empty strings', () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value.trim().length, key).toBeGreaterThan(0);
    }
  });
});

describe('interpolate', () => {
  it('substitutes provided values', () => {
    expect(interpolate('API target: {url}', { url: 'http://localhost:3000' })).toBe(
      'API target: http://localhost:3000',
    );
  });

  it('leaves unmatched placeholders visible rather than printing undefined', () => {
    expect(interpolate('Hello {name}', {})).toBe('Hello {name}');
    expect(interpolate('Hello {name}')).toBe('Hello {name}');
  });

  it('coerces numbers', () => {
    expect(interpolate('{count} jobs', { count: 3 })).toBe('3 jobs');
  });
});

describe('createTranslator', () => {
  it('resolves known keys', () => {
    const t = createTranslator('en');
    expect(t('app.name')).toBe('NEST');
    expect(t('app.tagline')).toBe("Your city's trusted service network.");
  });

  it('interpolates', () => {
    const t = createTranslator('en');
    expect(t('foundation.apiTarget', { url: 'https://api.example' })).toBe(
      'API target: https://api.example',
    );
  });

  it('returns the key when a message is missing', () => {
    const t = createTranslator('en');
    // Cast is required to simulate a key that is absent from the catalogue.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- deliberately probing an unknown key
    expect(t('does.not.exist' as any)).toBe('does.not.exist');
  });
});
