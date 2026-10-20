import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { rolGuard } from './core/auth/rol.guard';
import { SOLO_ADMIN } from './core/navigation';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    title: 'Iniciar Sesión | Gas Mapocho',
    loadComponent: () => import('./features/auth/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', title: 'Inicio | Gas Mapocho', loadComponent: () => import('./features/inicio/inicio-page').then((m) => m.InicioPage) },
      { path: 'balones', title: 'Balones | Gas Mapocho', loadComponent: () => import('./features/balones/balones-page').then((m) => m.BalonesPage) },
      { path: 'balones/nuevo', title: 'Nuevo balón | Gas Mapocho', canActivate: [rolGuard(...SOLO_ADMIN)], loadComponent: () => import('./features/balones/form/balon-form-page').then((m) => m.BalonFormPage) },
      { path: 'balones/:id/editar', title: 'Editar balón | Gas Mapocho', canActivate: [rolGuard(...SOLO_ADMIN)], loadComponent: () => import('./features/balones/form/balon-form-page').then((m) => m.BalonFormPage) },
      { path: 'proveedores', title: 'Proveedores | Gas Mapocho', loadComponent: () => import('./features/proveedores/proveedores-page').then((m) => m.ProveedoresPage) },
      { path: 'proveedores/nuevo', title: 'Nuevo proveedor | Gas Mapocho', loadComponent: () => import('./features/proveedores/form/proveedor-form-page').then((m) => m.ProveedorFormPage) },
      { path: 'proveedores/:id/editar', title: 'Editar proveedor | Gas Mapocho', canActivate: [rolGuard(...SOLO_ADMIN)], loadComponent: () => import('./features/proveedores/form/proveedor-form-page').then((m) => m.ProveedorFormPage) },
      { path: 'clientes', title: 'Clientes | Gas Mapocho', loadComponent: () => import('./features/clientes/clientes-page').then((m) => m.ClientesPage) },
      { path: 'clientes/nuevo', title: 'Nuevo cliente | Gas Mapocho', loadComponent: () => import('./features/clientes/form/cliente-form-page').then((m) => m.ClienteFormPage) },
      { path: 'clientes/:id/editar', title: 'Editar cliente | Gas Mapocho', canActivate: [rolGuard(...SOLO_ADMIN)], loadComponent: () => import('./features/clientes/form/cliente-form-page').then((m) => m.ClienteFormPage) },
      { path: 'compras', title: 'Compras | Gas Mapocho', loadComponent: () => import('./features/compras/compras-page').then((m) => m.ComprasPage) },
      { path: 'compras/nueva', title: 'Nueva compra | Gas Mapocho', loadComponent: () => import('./features/compras/nueva/compra-nueva-page').then((m) => m.CompraNuevaPage) },
      { path: 'movimientos', title: 'Movimientos | Gas Mapocho', loadComponent: () => import('./features/movimientos/movimientos-page').then((m) => m.MovimientosPage) },
      { path: 'movimientos/nuevo', title: 'Registrar movimiento | Gas Mapocho', loadComponent: () => import('./features/movimientos/nuevo/movimiento-nuevo-page').then((m) => m.MovimientoNuevoPage) },
      { path: 'movimientos/:id/editar', title: 'Editar movimiento | Gas Mapocho', canActivate: [rolGuard(...SOLO_ADMIN)], loadComponent: () => import('./features/movimientos/editar/movimiento-editar-page').then((m) => m.MovimientoEditarPage) },
      { path: 'usuarios', title: 'Usuarios | Gas Mapocho', canActivate: [rolGuard(...SOLO_ADMIN)], loadComponent: () => import('./features/usuarios/usuarios-page').then((m) => m.UsuariosPage) },
      { path: 'usuarios/nuevo', title: 'Nuevo usuario | Gas Mapocho', canActivate: [rolGuard(...SOLO_ADMIN)], loadComponent: () => import('./features/usuarios/form/usuario-form-page').then((m) => m.UsuarioFormPage) },
      { path: 'usuarios/:id/editar', title: 'Editar usuario | Gas Mapocho', canActivate: [rolGuard(...SOLO_ADMIN)], loadComponent: () => import('./features/usuarios/form/usuario-form-page').then((m) => m.UsuarioFormPage) },
      { path: 'reportes', title: 'Reportes | Gas Mapocho', canActivate: [rolGuard(...SOLO_ADMIN)], loadComponent: () => import('./features/reportes/reportes-page').then((m) => m.ReportesPage) },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
