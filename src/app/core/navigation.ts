import { Rol } from './api/models';
import { IconName } from '../shared/ui/icon/icon';

/**
 * Navegación principal. Fuente única para el sidenav y las rutas.
 * `roles` indica quién ve el ítem; el guard de la ruta aplica la misma regla.
 */
export interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: IconName;
  readonly roles: readonly Rol[];
}

export const TODOS: readonly Rol[] = ['ADMIN', 'ALMACEN'];
export const SOLO_ADMIN: readonly Rol[] = ['ADMIN'];

export const NAV_ITEMS: readonly NavItem[] = [
  { path: 'inicio', label: 'Inicio', icon: 'home', roles: TODOS },
  { path: 'usuarios', label: 'Usuarios', icon: 'users', roles: SOLO_ADMIN },
  { path: 'balones', label: 'Balones', icon: 'cylinder', roles: TODOS },
  { path: 'movimientos', label: 'Movimientos', icon: 'swap', roles: TODOS },
  { path: 'reportes', label: 'Reportes', icon: 'chart', roles: SOLO_ADMIN },
];
