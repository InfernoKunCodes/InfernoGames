import { dev_log, upperLower } from './utils';
import { EnvironmentService } from '../services/environment.service';

describe('utils', () => {
  describe('upperLower', () => {
    it('capitalizes the first character and keeps the rest', () => {
      expect(upperLower('hello')).toBe('Hello');
      expect(upperLower('pC')).toBe('PC');
    });

    it('returns falsy input unchanged', () => {
      expect(upperLower('')).toBe('');
    });
  });

  describe('dev_log', () => {
    it('logs when not in production', () => {
      const spy = spyOn(console, 'log');
      const env = { settings: { production: false } } as EnvironmentService;
      dev_log(env, 'hi');
      expect(spy).toHaveBeenCalledWith('hi');
    });

    it('does not log in production', () => {
      const spy = spyOn(console, 'log');
      const env = { settings: { production: true } } as EnvironmentService;
      dev_log(env, 'hi');
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
