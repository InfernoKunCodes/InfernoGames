import { DateUtils } from './date-utils';

describe('DateUtils', () => {
  describe('formatDateTime', () => {
    it('returns empty string for null/undefined', () => {
      expect(DateUtils.formatDateTime(null)).toBe('');
      expect(DateUtils.formatDateTime(undefined)).toBe('');
    });

    it('formats a date into a human-readable string', () => {
      const date = new Date(2024, 0, 2, 15, 4);
      const result = DateUtils.formatDateTime(date);
      expect(result).toContain('2024');
      expect(result).toContain('Jan');
    });

    it('includes seconds when requested', () => {
      const date = new Date(2024, 0, 2, 15, 4, 5);
      expect(DateUtils.formatDateTime(date, true)).toMatch(/:0?5/);
    });
  });

  describe('formatDate', () => {
    it('returns empty string for null', () => {
      expect(DateUtils.formatDate(null)).toBe('');
    });

    it('formats a date without time', () => {
      const result = DateUtils.formatDate(new Date(2024, 0, 2));
      expect(result).toContain('2024');
      expect(result).toContain('Jan');
    });
  });

  describe('parseDateTimeArray', () => {
    it('parses a 6-element array (month is 1-indexed input)', () => {
      const date = DateUtils.parseDateTimeArray([2024, 1, 2, 3, 4, 5]);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(2);
      expect(date.getHours()).toBe(3);
    });

    it('falls back to current date for invalid input', () => {
      expect(DateUtils.parseDateTimeArray([2024, 1] as any)).toBeInstanceOf(Date);
      expect(DateUtils.parseDateTimeArray(null as any)).toBeInstanceOf(Date);
    });

    it('converts nanoseconds to milliseconds', () => {
      const date = DateUtils.parseDateTimeArray([2024, 1, 2, 3, 4, 5, 6_000_000]);
      expect(date.getMilliseconds()).toBe(6);
    });
  });

  describe('parseDateArray', () => {
    it('parses a date-only array', () => {
      const date = DateUtils.parseDateArray([2024, 3, 15]);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(2); // March
      expect(date.getDate()).toBe(15);
    });

    it('falls back to current date for invalid input', () => {
      expect(DateUtils.parseDateArray([2024] as any)).toBeInstanceOf(Date);
    });
  });
});
