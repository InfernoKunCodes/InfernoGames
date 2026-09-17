import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';
import { EnvironmentService } from './services/environment.service';
import { httpErrorInterceptor } from './services/http-error.interceptor';
import { dev_log } from './utils/utils';

/**
 * Pulls app.config.json before the first route renders. Throwing here is
 * deliberate: without restUrl every service call would fail anyway, and failing
 * loudly beats booting a half-configured app.
 */
async function loadEnvironment(environmentService: EnvironmentService): Promise<void> {
  const settings = await environmentService.load();

  if (!settings?.restUrl) {
    throw new Error('Environment loaded but REST URL is still undefined');
  }

  dev_log(environmentService, 'Environment loaded successfully');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })
    ),
    provideAnimations(),
    provideHttpClient(withInterceptors([httpErrorInterceptor])),
    provideNativeDateAdapter(),
    provideAppInitializer(() => loadEnvironment(inject(EnvironmentService))),
  ],
};
