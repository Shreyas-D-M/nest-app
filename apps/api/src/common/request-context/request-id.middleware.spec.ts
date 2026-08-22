import { resolveRequestId } from './request-id.middleware';

describe('resolveRequestId', () => {
  it('reuses a well-formed client-supplied id so traces span client and server', () => {
    expect(resolveRequestId('abc123-def456_x.1')).toBe('abc123-def456_x.1');
  });

  it('generates an id when none is supplied', () => {
    const id = resolveRequestId(undefined);

    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('replaces an id containing newlines, preventing forged log lines', () => {
    const injected = 'abc12345\nlevel=error msg="fake entry"';

    expect(resolveRequestId(injected)).not.toBe(injected);
    expect(resolveRequestId(injected)).not.toContain('\n');
  });

  it('replaces ids with unexpected characters', () => {
    expect(resolveRequestId('<script>alert(1)</script>')).toMatch(/^[0-9a-f-]{36}$/);
    expect(resolveRequestId('id with spaces')).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('rejects ids that are too short or too long', () => {
    expect(resolveRequestId('short')).toMatch(/^[0-9a-f-]{36}$/);
    expect(resolveRequestId('a'.repeat(129))).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('uses the first value when the header is repeated', () => {
    expect(resolveRequestId(['first-value-1', 'second-value-2'])).toBe('first-value-1');
  });
});
