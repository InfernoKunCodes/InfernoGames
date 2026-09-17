import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { ThemeService } from './services/theme.service';
import { GameService } from './services/game.service';
import { ApiResponse, Type } from './models/api-response.model';
import { SteamStatus, SteamUserProfile } from './models/game.model';

describe('AppComponent', () => {
  let component: AppComponent;
  let mockThemeService: jasmine.SpyObj<ThemeService>;
  let mockGameService: jasmine.SpyObj<GameService>;

  function steamStatus(configured: boolean): ApiResponse<SteamStatus> {
    return new ApiResponse<SteamStatus>({
      code: 200,
      data: { configured, message: 'ok' },
      type: Type.SUCCESS,
    });
  }

  /** Built after the spies are armed, since ngOnInit reads them immediately. */
  function createComponent(): AppComponent {
    return TestBed.runInInjectionContext(() => new AppComponent());
  }

  beforeEach(() => {
    mockThemeService = jasmine.createSpyObj<ThemeService>('ThemeService', ['toggleDarkMode']);
    (mockThemeService as unknown as { isDarkMode: unknown }).isDarkMode = signal(false);

    mockGameService = jasmine.createSpyObj<GameService>('GameService', [
      'getSteamStatus',
      'getSteamUserProfile',
    ]);
    mockGameService.getSteamStatus.and.returnValue(of(steamStatus(false)));
    mockGameService.getSteamUserProfile.and.returnValue(
      of(new ApiResponse<SteamUserProfile>({ code: 404, type: Type.ERROR }))
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
        { provide: GameService, useValue: mockGameService },
      ],
    });

    component = createComponent();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have the correct title', () => {
    expect(component.title).toEqual('Inferno Games');
  });

  it('should expose a defined version', () => {
    expect(component.version).toBeDefined();
  });

  it('should read dark mode from the theme service', () => {
    expect(component.isDarkMode()).toBeFalse();
  });

  it('should toggle dark mode when toggleTheme is called', () => {
    component.toggleTheme();
    expect(mockThemeService.toggleDarkMode).toHaveBeenCalled();
  });

  describe('ngOnInit', () => {
    it('loads Steam status and skips the profile when Steam is not configured', () => {
      component.ngOnInit();
      expect(mockGameService.getSteamStatus).toHaveBeenCalled();
      expect(component.steamConfigured()).toBeFalse();
      expect(mockGameService.getSteamUserProfile).not.toHaveBeenCalled();
      expect(component.steamUser()).toBeNull();
    });

    it('loads the Steam user profile when Steam is configured', () => {
      mockGameService.getSteamStatus.and.returnValue(of(steamStatus(true)));
      const profile = { personaName: 'Player', personaState: 1 } as SteamUserProfile;
      mockGameService.getSteamUserProfile.and.returnValue(
        of(new ApiResponse<SteamUserProfile>({ code: 200, data: profile, type: Type.SUCCESS }))
      );

      component = createComponent();
      component.ngOnInit();

      expect(component.steamConfigured()).toBeTrue();
      expect(component.steamUser()).toEqual(profile);
    });
  });

  describe('persona state', () => {
    it('returns offline defaults when no Steam user is loaded', () => {
      component.steamUser.set(null);
      expect(component.personaStateClass()).toBe('offline');
      expect(component.personaStateText()).toBe('Offline');
    });

    it('returns offline when the persona state is zero', () => {
      component.steamUser.set({ personaState: 0 } as SteamUserProfile);
      expect(component.personaStateClass()).toBe('offline');
      expect(component.personaStateText()).toBe('Offline');
    });

    it('returns online when the persona state is non-zero', () => {
      component.steamUser.set({ personaState: 1 } as SteamUserProfile);
      expect(component.personaStateClass()).toBe('online');
      expect(component.personaStateText()).toBe('Online');
    });
  });
});
