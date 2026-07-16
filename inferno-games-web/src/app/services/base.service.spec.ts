import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { BaseService } from './base.service';

// Concrete subclass exposing the protected verbs for direct testing.
@Injectable()
class TestService extends BaseService {
  constructor(http: HttpClient) {
    super(http);
  }
  doGet<T>(url: string, options?: any): Observable<T> {
    return this.get<T>(url, options);
  }
  doPost<T>(url: string, body: any): Observable<T> {
    return this.post<T>(url, body);
  }
  doPut<T>(url: string, body: any): Observable<T> {
    return this.put<T>(url, body);
  }
  doPatch<T>(url: string, body: any): Observable<T> {
    return this.patch<T>(url, body);
  }
  doDelete<T>(url: string): Observable<T> {
    return this.delete<T>(url);
  }
}

describe('BaseService', () => {
  let service: TestService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TestService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TestService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('issues a GET request and returns the body', () => {
    service.doGet<{ ok: boolean }>('/api/thing').subscribe((res) => {
      expect(res.ok).toBeTrue();
    });
    const req = httpMock.expectOne('/api/thing');
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true });
  });

  it('issues a POST request with a body', () => {
    const payload = { name: 'x' };
    service.doPost('/api/thing', payload).subscribe();
    const req = httpMock.expectOne('/api/thing');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('issues PUT, PATCH and DELETE requests', () => {
    service.doPut('/api/1', { a: 1 }).subscribe();
    const put = httpMock.expectOne('/api/1');
    expect(put.request.method).toBe('PUT');
    put.flush({});

    service.doPatch('/api/1', { a: 2 }).subscribe();
    const patch = httpMock.expectOne('/api/1');
    expect(patch.request.method).toBe('PATCH');
    patch.flush({});

    service.doDelete('/api/1').subscribe();
    const del = httpMock.expectOne('/api/1');
    expect(del.request.method).toBe('DELETE');
    del.flush({});
  });

  it('propagates HTTP errors to the caller', () => {
    let errored = false;
    service.doGet('/api/fail').subscribe({
      next: () => fail('should not succeed'),
      error: (err) => {
        errored = true;
        expect(err.status).toBe(500);
      },
    });
    httpMock.expectOne('/api/fail').flush('boom', { status: 500, statusText: 'Server Error' });
    expect(errored).toBeTrue();
  });
});
