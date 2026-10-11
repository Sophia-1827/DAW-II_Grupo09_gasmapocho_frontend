import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/** Agrega el Bearer a las llamadas a la API y cierra sesión si el backend responde 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const esApi = req.url.startsWith(environment.apiUrl);
  const esLogin = req.url.endsWith('/api/auth/login');
  const peticion = esApi && token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(peticion).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && esApi && !esLogin) auth.logout();
      return throwError(() => err);
    }),
  );
};
