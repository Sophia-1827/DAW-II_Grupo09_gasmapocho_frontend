import { Rol } from './api/models';

export const APP_NAME = 'Gas Mapocho';
export const APP_VERSION = '0.1.0';

/** Etiquetas de cada rol para la interfaz. */
export const ROL_LABEL: Record<Rol, string> = {
  ADMIN: 'Administración',
  ALMACEN: 'Almacén',
};

export const ROL_DESCRIPCION: Record<Rol, string> = {
  ADMIN: 'Administra usuarios, catálogo de balones, movimientos y reportes de toda la operación.',
  ALMACEN: 'Consulta el stock de balones y registra las entradas y salidas del almacén.',
};

/** Cuentas del seed de desarrollo que se muestran en el login. Quitar al desplegar. */
export const DEMO_USUARIOS = [
  { rol: 'ALMACEN', email: 'almacen@gasmapocho.cl', clave: 'Almacen123' },
  { rol: 'ADMIN', email: 'admin@gasmapocho.cl', clave: 'Admin123' },
] as const;
