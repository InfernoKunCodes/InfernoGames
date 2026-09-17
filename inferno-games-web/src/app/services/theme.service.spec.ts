import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

const THEME_KEY = 'inferno-games-theme';
const LEGACY_THEME_KEY = 'comic-app-theme';

describe('ThemeService', () => {
  function createService(): ThemeService {
    TestBed.configureTestingModule({ providers: [ThemeService] });
    return TestBed.inject(ThemeService);
  }

  beforeEach(() => {
    localStorage.removeItem(THEME_KEY);
    localStorage.removeItem(LEGACY_THEME_KEY);
  });

  it('is created and defaults to dark mode with no saved preference', () => {
    const service = createService();
    expect(service).toBeTruthy();
    expect(service.isDarkMode()).toBeTrue();
  });

  it('toggles dark mode', () => {
    const service = createService();
    const initial = service.isDarkMode();
    service.toggleDarkMode();
    expect(service.isDarkMode()).toBe(!initial);
  });

  it('persists the chosen theme to localStorage', () => {
    const service = createService();
    service.setDarkMode(false);
    expect(localStorage.getItem(THEME_KEY)).toBe('light');
    service.setDarkMode(true);
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });

  it('adopts a preference saved under the legacy key', () => {
    localStorage.setItem(LEGACY_THEME_KEY, 'light');
    const service = createService();
    expect(service.isDarkMode()).toBeFalse();
  });

  it('drops the legacy key once the preference is rewritten', () => {
    localStorage.setItem(LEGACY_THEME_KEY, 'light');
    const service = createService();
    service.setDarkMode(true);
    expect(localStorage.getItem(LEGACY_THEME_KEY)).toBeNull();
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });

  it('prefers the current key over the legacy one', () => {
    localStorage.setItem(LEGACY_THEME_KEY, 'light');
    localStorage.setItem(THEME_KEY, 'dark');
    const service = createService();
    expect(service.isDarkMode()).toBeTrue();
  });

  it('applies the dark-theme class to the document root', () => {
    const service = createService();
    service.setDarkMode(true);
    expect(document.documentElement.classList.contains('dark-theme')).toBeTrue();
    service.setDarkMode(false);
    expect(document.documentElement.classList.contains('light-theme')).toBeTrue();
  });
});
