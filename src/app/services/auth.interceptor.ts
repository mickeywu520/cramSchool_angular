import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { catchError, switchMap, throwError, from } from 'rxjs';

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function onRefreshed(token: string) {
  failedQueue.forEach(({ resolve }) => resolve(token));
  failedQueue = [];
}

function onRefreshFailed(err: unknown) {
  failedQueue.forEach(({ reject }) => reject(err));
  failedQueue = [];
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const session = inject(SessionService);
  const token = localStorage.getItem('access_token');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((err) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !req.url.includes('/auth/')) {
        // 後台人員（admin/maintainer/user）：access 過期即登出，不做靜默續命
        if (auth.isBackendUser) {
          session.showExpired();
          return throwError(() => err);
        }
        if (!isRefreshing) {
          isRefreshing = true;

          return auth.refreshToken().pipe(
            switchMap((res) => {
              isRefreshing = false;
              onRefreshed(res.access_token);
              return next(
                req.clone({
                  setHeaders: { Authorization: `Bearer ${res.access_token}` },
                }),
              );
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              onRefreshFailed(refreshErr);
              session.showExpired();
              return throwError(() => refreshErr);
            }),
          );
        } else {
          return from(new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })).pipe(
            switchMap((newToken) => {
              return next(
                req.clone({
                  setHeaders: { Authorization: `Bearer ${newToken}` },
                }),
              );
            }),
          );
        }
      }
      return throwError(() => err);
    }),
  );
};
