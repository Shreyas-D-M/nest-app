import { canonicalJson } from './canonical-json';

describe('canonicalJson', () => {
  it('produces the same string regardless of key order', () => {
    expect(canonicalJson({ a: 1, b: 2 })).toBe(canonicalJson({ b: 2, a: 1 }));
  });

  it('canonicalises nested objects', () => {
    const first = { outer: { z: 1, a: { y: 2, b: 3 } } };
    const second = { outer: { a: { b: 3, y: 2 }, z: 1 } };

    expect(canonicalJson(first)).toBe(canonicalJson(second));
  });

  it('preserves array order, which is significant', () => {
    expect(canonicalJson([1, 2])).not.toBe(canonicalJson([2, 1]));
  });

  it('distinguishes different values', () => {
    expect(canonicalJson({ a: 1 })).not.toBe(canonicalJson({ a: 2 }));
  });

  it('handles primitives and null', () => {
    expect(canonicalJson(null)).toBe('null');
    expect(canonicalJson(42)).toBe('42');
    expect(canonicalJson('text')).toBe('"text"');
  });

  it('never returns undefined for an unserialisable top-level value', () => {
    expect(canonicalJson(undefined)).toBe('null');
  });
});
