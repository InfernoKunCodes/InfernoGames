import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Marks every HttpClient request so the service worker passes it straight to the
 * network.
 *
 * ngsw-config.json deliberately has no dataGroups, so the worker was never meant
 * to serve API traffic. Without this header it still sits in the request path and
 * can turn a real network failure into a synthetic response, which hides the
 * actual status code from the error handling in the services.
 *
 * Everything HttpClient fetches here is either the REST API or app.config.json,
 * and both should always be read fresh. Static assets are requested by the
 * browser rather than HttpClient, so they are unaffected and stay cacheable.
 *
 * Registered last in the chain so earlier interceptors still see the original URL.
 */
export const serviceWorkerBypassInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { 'ngsw-bypass': 'true' } }));
