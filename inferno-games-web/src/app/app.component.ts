import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { APP_VERSION } from '../app/version';
import { ThemeService } from './services/theme.service';
import { GameService } from './services/game.service';
import { SteamUserProfile } from './models/game.model';
import { MaterialModule } from './material.module';
import { VersionInfoComponent } from './components/version-info/version-info.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  // Default on purpose. Every page renders inside this component's
  // router-outlet, and the feature components still update plain fields from
  // subscribe callbacks. An OnPush root that is not marked dirty makes Angular
  // skip the whole subtree, so those updates never reach the DOM.
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MaterialModule, VersionInfoComponent],
})
export class AppComponent implements OnInit {
  private readonly themeService = inject(ThemeService);
  private readonly gameService = inject(GameService);
  private readonly destroyRef = inject(DestroyRef);

  readonly title = 'Inferno Games';
  readonly version: string = APP_VERSION;

  /** Read straight off the service; the service owns the DOM theme classes. */
  readonly isDarkMode = this.themeService.isDarkMode;

  readonly steamUser = signal<SteamUserProfile | null>(null);
  readonly steamConfigured = signal(false);

  // Computed rather than template methods, which would re-run on every check.
  readonly personaStateClass = computed(() =>
    this.steamUser()?.personaState ? 'online' : 'offline'
  );
  readonly personaStateText = computed(() =>
    this.steamUser()?.personaState ? 'Online' : 'Offline'
  );

  ngOnInit(): void {
    this.loadSteamUserProfile();
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }

  /** Chained rather than nested so the profile call is skipped when Steam is off. */
  private loadSteamUserProfile(): void {
    this.gameService
      .getSteamStatus()
      .pipe(
        switchMap((response) => {
          const configured = response.data?.configured ?? false;
          this.steamConfigured.set(configured);
          return configured ? this.gameService.getSteamUserProfile() : of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((profileResponse) => {
        if (profileResponse?.data) {
          this.steamUser.set(profileResponse.data);
        }
      });
  }
}
