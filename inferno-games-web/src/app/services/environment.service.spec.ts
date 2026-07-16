import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EnvironmentService, EnvironmentSettings } from './environment.service';

describe('EnvironmentService', () => {
  let service: EnvironmentService;
  let httpMock: HttpTestingController;

  const settings: EnvironmentSettings = {
    production: false,
    baseUrl: 'http://localhost',
    restUrl: 'http://localhost/api',
    baseEndPoint: '/api',
    websocketUrl: 'ws://localhost',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EnvironmentService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(EnvironmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('has undefined settings before loading', () => {
    expect(service.settings).toBeUndefined();
  });

  it('loads settings from the config file', async () => {
    const loadPromise = service.load();
    const req = httpMock.expectOne('assets/environment/app.config.json');
    expect(req.request.method).toBe('GET');
    req.flush(settings);

    await loadPromise;
    expect(service.settings).toEqual(settings);
    expect(service.settings!.restUrl).toBe('http://localhost/api');
  });
});
