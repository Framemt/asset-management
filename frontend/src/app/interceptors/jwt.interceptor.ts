import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('asset_jwt_token_v1');

  let clonedReq = req;
  if (token && req.url.includes('/api')) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        localStorage.removeItem('asset_jwt_token_v1');
        localStorage.removeItem('asset_app_current_user_v1');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
