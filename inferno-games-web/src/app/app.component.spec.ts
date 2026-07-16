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

  beforeEach(() => {
    mockThemeService = jasmine.createSpyObj<ThemeService>('ThemeService', ['toggleDarkMode']);
    mockThemeService.isDarkMode$ = of(false);

    mockGameService = jasmine.createSpyObj<GameService>('GameService', [
      'getSteamStatus',
      'getSteamUserProfile',
    ]);
    mockGameService.getSteamStatus.and.returnValue(of(steamStatus(false)));
    mockGameService.getSteamUserProfile.and.returnValue(
      of(new ApiResponse<SteamUserProfile>({ code: 404, type: Type.ERROR }))
    );

    component = new AppComponent(mockThemeService, mockGameService);
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

  it('should proxy the dark mode observable from the theme service', () => {
    expect(component.isDarkMode$).toBe(mockThemeService.isDarkMode$);
  });

  it('should toggle dark mode when toggleTheme is called', () => {
    component.toggleTheme();
    expect(mockThemeService.toggleDarkMode).toHaveBeenCalled();
  });

  describe('ngOnInit', () => {
    it('applies theme classes and loads Steam status', () => {
      component.ngOnInit();
      expect(mockGameService.getSteamStatus).toHaveBeenCalled();
      expect(component.steamConfigured).toBeFalse();
    });

    it('loads the Steam user profile when Steam is configured', () => {
      mockGameService.getSteamStatus.and.returnValue(of(steamStatus(true)));
      const profile = { personaName: 'Player', personaState: 1 } as SteamUserProfile;
      mockGameService.getSteamUserProfile.and.returnValue(
        of(new ApiResponse<SteamUserProfile>({ code: 200, data: profile, type: Type.SUCCESS }))
      );

      component.ngOnInit();

      expect(component.steamConfigured).toBeTrue();
      expect(component.steamUser).toEqual(profile);
    });
  });

  describe('persona helpers', () => {
    it('returns offline defaults when no Steam user is loaded', () => {
      component.steamUser = null;
      expect(component.getPersonaStateClass()).toBe('offline');
      expect(component.getPersonaStateText()).toBe('Offline');
    });

    it('returns online when the persona state is non-zero', () => {
      component.steamUser = { personaState: 1 } as SteamUserProfile;
      expect(component.getPersonaStateClass()).toBe('online');
      expect(component.getPersonaStateText()).toBe('Online');
    });
  });

  describe('ngOnDestroy', () => {
    it('unsubscribes from the theme subscription', () => {
      component.ngOnInit();
      const sub = (component as any).themeSubscription;
      spyOn(sub, 'unsubscribe');
      component.ngOnDestroy();
      expect(sub.unsubscribe).toHaveBeenCalled();
    });
  });
});
