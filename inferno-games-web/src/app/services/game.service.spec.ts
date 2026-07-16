import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { EnvironmentService } from './environment.service';
import { Game, GameStatus, GamePlatform } from '../models/game.model';
import { Type } from '../models/api-response.model';

describe('GameService', () => {
  let service: GameService;
  let httpMock: HttpTestingController;
  const BASE = 'http://test/api/games';

  const okResponse = <T>(data: T) => ({ code: 200, data, message: 'ok', type: Type.SUCCESS, timeMs: 1 });

  beforeEach(() => {
    const envMock = { settings: { restUrl: 'http://test/api' } } as EnvironmentService;
    TestBed.configureTestingModule({
      providers: [
        GameService,
        { provide: EnvironmentService, useValue: envMock },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(GameService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  it('getAllGames maps payloads into Game instances', () => {
    service.getAllGames().subscribe((res) => {
      expect(res.data!.length).toBe(1);
      expect(res.data![0]).toBeInstanceOf(Game);
      expect(res.data![0].title).toBe('Halo');
    });
    const req = httpMock.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    req.flush(okResponse([{ id: 1, title: 'Halo' }]));
  });

  it('getAllGames returns an error fallback on failure', () => {
    service.getAllGames().subscribe((res) => {
      expect(res.code).toBe(500);
      expect(res.data).toEqual([]);
      expect(res.type).toBe(Type.ERROR);
    });
    httpMock.expectOne(BASE).flush('err', { status: 500, statusText: 'Server Error' });
  });

  it('getGameById requests the id and wraps the result', () => {
    service.getGameById(7).subscribe((res) => {
      expect(res.data).toBeInstanceOf(Game);
      expect(res.data!.id).toBe(7);
    });
    const req = httpMock.expectOne(`${BASE}/7`);
    expect(req.request.method).toBe('GET');
    req.flush(okResponse({ id: 7, title: 'Doom' }));
  });

  it('createGame POSTs the body', () => {
    service.createGame({ title: 'New' }).subscribe((res) => {
      expect(res.data!.title).toBe('New');
    });
    const req = httpMock.expectOne(BASE);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'New' });
    req.flush(okResponse({ id: 9, title: 'New' }));
  });

  it('updateGame PUTs to the id', () => {
    service.updateGame(3, { rating: 8 }).subscribe();
    const req = httpMock.expectOne(`${BASE}/3`);
    expect(req.request.method).toBe('PUT');
    req.flush(okResponse({ id: 3, rating: 8 }));
  });

  it('deleteGame DELETEs the id', () => {
    service.deleteGame(4).subscribe((res) => expect(res.code).toBe(200));
    const req = httpMock.expectOne(`${BASE}/4`);
    expect(req.request.method).toBe('DELETE');
    req.flush(okResponse(undefined));
  });

  it('updateGameStatus posts the status as a query param', () => {
    service.updateGameStatus(1, GameStatus.COMPLETED).subscribe();
    const req = httpMock.expectOne(`${BASE}/1/status?status=${GameStatus.COMPLETED}`);
    expect(req.request.method).toBe('POST');
    req.flush(okResponse({ id: 1, status: GameStatus.COMPLETED }));
  });

  it('searchGames encodes the query', () => {
    service.searchGames('halo 2').subscribe((res) => expect(res.data!.length).toBe(0));
    const req = httpMock.expectOne(`${BASE}/search?query=halo%202`);
    expect(req.request.method).toBe('GET');
    req.flush(okResponse([]));
  });

  it('advancedSearch sends only the provided params', () => {
    service
      .advancedSearch('Zelda', GameStatus.IN_PROGRESS, GamePlatform.NINTENDO_SWITCH, undefined)
      .subscribe();
    const req = httpMock.expectOne((r) => r.url === `${BASE}/search/advanced`);
    expect(req.request.params.get('title')).toBe('Zelda');
    expect(req.request.params.get('status')).toBe(GameStatus.IN_PROGRESS);
    expect(req.request.params.get('platform')).toBe(GamePlatform.NINTENDO_SWITCH);
    expect(req.request.params.has('genre')).toBeFalse();
    req.flush(okResponse([]));
  });

  it('getGameStats returns a zeroed fallback on error', () => {
    service.getGameStats().subscribe((res) => {
      expect(res.code).toBe(500);
      expect(res.data!.totalGames).toBe(0);
    });
    httpMock.expectOne(`${BASE}/stats`).flush('err', { status: 500, statusText: 'Server Error' });
  });

  it('getPlatformStats derives entries from the stats breakdown', () => {
    service.getPlatformStats().subscribe((res) => {
      expect(res.data!.length).toBe(1);
      expect(res.data![0].platform).toBe('PC');
      expect(res.data![0].gameCount).toBe(5);
    });
    httpMock.expectOne(`${BASE}/stats`).flush(okResponse({ platformBreakdown: { PC: 5 } }));
  });

  it('getSteamStatus returns a not-configured fallback on error', () => {
    service.getSteamStatus().subscribe((res) => {
      expect(res.data!.configured).toBeFalse();
    });
    httpMock.expectOne(`${BASE}/steam/status`).flush('err', { status: 500, statusText: 'Server Error' });
  });
});
