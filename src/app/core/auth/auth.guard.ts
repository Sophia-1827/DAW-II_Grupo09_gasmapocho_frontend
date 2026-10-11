import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Protege las rutas internas: sin sesión, vuelve al login. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.estaAutenticado() ? true : inject(Router).createUrlTree(['/login']);
};
