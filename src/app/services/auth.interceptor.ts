import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
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
  const token = localStorage.getItem('access_token');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((err) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !req.url.includes('/auth/')) {
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
              auth.logout();
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
