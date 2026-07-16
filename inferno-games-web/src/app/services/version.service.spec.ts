import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { VersionService } from './version.service';
import { EnvironmentService } from './environment.service';
import { Type } from '../models/api-response.model';

describe('VersionService', () => {
  let service: VersionService;
  let httpMock: HttpTestingController;
  const API = 'http://test/api/version';

  beforeEach(() => {
    const envMock = { settings: { restUrl: 'http://test/api' } } as EnvironmentService;
    TestBed.configureTestingModule({
      providers: [
        VersionService,
        { provide: EnvironmentService, useValue: envMock },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(VersionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('reports the web app version', () => {
    const v = service.getWebAppVersion();
    expect(v.name).toBe('inferno-games-web');
    expect(v.version).toBeDefined();
  });

  it('fetches backend versions from the version endpoint', () => {
    service.getBackendAppVersions().subscribe((res) => {
      expect(res.data!.version).toBe('9.9.9');
    });
    const req = httpMock.expectOne(API);
    expect(req.request.method).toBe('GET');
    req.flush({ code: 200, data: { name: 'rest', version: '9.9.9' }, type: Type.SUCCESS, timeMs: 1 });
  });

  it('getRest falls back to N/A when no data is returned', () => {
    service.getRest().subscribe((res) => {
      expect(res.version.version).toBe('N/A');
    });
    httpMock.expectOne(API).flush({ code: 200, data: null, type: Type.SUCCESS, timeMs: 1 });
  });

  it('getAllVersions combines web and rest versions', () => {
    service.getAllVersions().subscribe((res) => {
      expect(res.data!.web.name).toBe('inferno-games-web');
      expect(res.data!.rest.version).toBe('2.0.0');
    });
    httpMock.expectOne(API).flush({ code: 200, data: { name: 'rest', version: '2.0.0' }, type: Type.SUCCESS, timeMs: 5 });
  });
});
