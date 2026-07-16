import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.removeItem('comic-app-theme');
    TestBed.configureTestingModule({ providers: [ThemeService] });
    service = TestBed.inject(ThemeService);
  });

  it('is created and defaults to dark mode with no saved preference', () => {
    expect(service).toBeTruthy();
    expect(service.isDarkMode).toBeTrue();
  });

  it('toggles dark mode', () => {
    const initial = service.isDarkMode;
    service.toggleDarkMode();
    expect(service.isDarkMode).toBe(!initial);
  });

  it('persists the chosen theme to localStorage', () => {
    service.setDarkMode(false);
    expect(localStorage.getItem('comic-app-theme')).toBe('light');
    service.setDarkMode(true);
    expect(localStorage.getItem('comic-app-theme')).toBe('dark');
  });

  it('emits the current mode via isDarkMode$', (done) => {
    service.setDarkMode(false);
    service.isDarkMode$.subscribe((isDark) => {
      expect(isDark).toBeFalse();
      done();
    });
  });

  it('applies the dark-theme class to the document root', () => {
    service.setDarkMode(true);
    expect(document.documentElement.classList.contains('dark-theme')).toBeTrue();
    service.setDarkMode(false);
    expect(document.documentElement.classList.contains('light-theme')).toBeTrue();
  });
});
