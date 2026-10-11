import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../api/models';
import { AuthService } from './auth.service';

/** Deja pasar solo a los roles indicados; si no, vuelve al inicio con el aviso `sinAcceso`. */
export function rolGuard(...roles: readonly Rol[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    if (auth.tieneRol(...roles)) return true;
    return inject(Router).createUrlTree(['/app/inicio'], { queryParams: { sinAcceso: 1 } });
  };
}
