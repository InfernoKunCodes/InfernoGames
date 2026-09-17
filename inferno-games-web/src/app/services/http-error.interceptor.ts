import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Single place that reports failed requests.
 *
 * The services each build their own fallback ApiResponse on error, which keeps
 * the UI working but means a failure can otherwise pass without ever being
 * logged. This only observes and rethrows, so that per-service handling is left
 * exactly as it is.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const where = `${req.method} ${req.urlWithParams}`;

      if (error.status === 0) {
        console.error(`${where} failed: network unreachable or request blocked`, error.error);
      } else {
        console.error(`${where} failed with ${error.status} ${error.statusText}`, error.error);
      }

      return throwError(() => error);
    })
  );
