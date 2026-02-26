import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthStoreService } from './auth-store.service';

const AUTH_ENDPOINTS = ['/auth/signin', '/auth/register', '/auth/refresh'];
const RETRY_HEADER = 'x-auth-retried';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authStore = inject(AuthStoreService);
  const authApi = inject(AuthApiService);
  const accessToken = authStore.getAccessToken();

  const requestWithToken =
    accessToken && !AUTH_ENDPOINTS.some((endpoint) => req.url.includes(endpoint))
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      : req;

  return next(requestWithToken).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        req.headers.has(RETRY_HEADER) ||
        AUTH_ENDPOINTS.some((endpoint) => req.url.includes(endpoint))
      ) {
        return throwError(() => error);
      }

      const refreshToken = authStore.getRefreshToken();
      if (!refreshToken) {
        authStore.clearSession();
        return throwError(() => error);
      }

      return authApi.refresh(refreshToken).pipe(
        switchMap((session) => {
          authStore.setSession(session);
          return next(
            req.clone({
              setHeaders: {
                Authorization: `Bearer ${session.tokens.accessToken}`,
                [RETRY_HEADER]: '1',
              },
            }),
          );
        }),
        catchError((refreshError: unknown) => {
          authStore.clearSession();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
