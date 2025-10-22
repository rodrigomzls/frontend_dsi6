// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { LOCALE_ID } from '@angular/core';
import localeEsPe from '@angular/common/locales/es-PE';
import { registerLocaleData } from '@angular/common';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor'; // ✅ Solo este

registerLocaleData(localeEsPe, 'es-PE');

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-PE' },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor]) // ✅ Solo un interceptor
    ),
    provideAnimations()
  ]
};