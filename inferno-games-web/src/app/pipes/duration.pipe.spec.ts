import { DurationPipe } from './duration.pipe';

describe('DurationPipe', () => {
  const pipe = new DurationPipe();

  it('creates an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('returns empty string for null or NaN', () => {
    expect(pipe.transform(null as any)).toBe('');
    expect(pipe.transform(NaN)).toBe('');
  });

  it('formats seconds only', () => {
    expect(pipe.transform(1)).toBe('1 second');
    expect(pipe.transform(30)).toBe('30 seconds');
  });

  it('formats zero as 0 seconds', () => {
    expect(pipe.transform(0)).toBe('0 seconds');
  });

  it('formats minutes and seconds', () => {
    expect(pipe.transform(90)).toBe('1 minute 30 seconds');
  });

  it('formats hours', () => {
    expect(pipe.transform(3600)).toBe('1 hour');
  });

  it('formats days', () => {
    expect(pipe.transform(24 * 3600)).toBe('1 day');
  });

  it('formats a composite duration across units', () => {
    // 1 day, 2 hours, 3 minutes, 4 seconds
    const total = 24 * 3600 + 2 * 3600 + 3 * 60 + 4;
    expect(pipe.transform(total)).toBe('1 day 2 hours 3 minutes 4 seconds');
  });

  it('floors fractional seconds', () => {
    expect(pipe.transform(59.9)).toBe('59 seconds');
  });
});
