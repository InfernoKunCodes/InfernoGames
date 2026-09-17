import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'inferno-games-theme';
// Key used before this app was renamed off the comics scaffold. Read once so an
// existing preference survives the rename, then rewritten under THEME_KEY.
const LEGACY_THEME_KEY = 'comic-app-theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  /** Current theme. Read directly by components; dark is the default. */
  readonly isDarkMode = signal<boolean>(true);

  constructor() {
    this.isDarkMode.set(this.readStoredPreference());
    this.applyTheme(this.isDarkMode());
  }

  private readStoredPreference(): boolean {
    const saved = localStorage.getItem(THEME_KEY) ?? localStorage.getItem(LEGACY_THEME_KEY);
    return saved ? saved === 'dark' : true;
  }

  toggleDarkMode(): void {
    this.setDarkMode(!this.isDarkMode());
  }

  setDarkMode(isDark: boolean): void {
    this.isDarkMode.set(isDark);
    this.applyTheme(isDark);
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    localStorage.removeItem(LEGACY_THEME_KEY);
  }

  private applyTheme(isDark: boolean): void {
    const root = document.documentElement;

    root.classList.toggle('dark-theme', isDark);
    root.classList.toggle('light-theme', !isDark);

    // Forces a repaint. Carried over from the original implementation: it costs a
    // synchronous reflow, but only on an explicit toggle, and dropping it was not
    // verified against the themed styles.
    root.style.display = 'none';
    root.offsetHeight;
    root.style.display = '';
  }
}
