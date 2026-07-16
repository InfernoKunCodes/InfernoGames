import { StringUtils } from './string-utils';

describe('StringUtils', () => {
  describe('kebabCase', () => {
    it('lowercases and replaces spaces with hyphens', () => {
      expect(StringUtils.kebabCase('Hello World')).toBe('hello-world');
    });

    it('collapses multiple spaces into a single hyphen', () => {
      expect(StringUtils.kebabCase('a   b')).toBe('a-b');
    });

    it('leaves an already-kebab string unchanged', () => {
      expect(StringUtils.kebabCase('already-kebab')).toBe('already-kebab');
    });
  });
});
