/** Contratos JSON de los microservicios (vía gateway). Coinciden con las entidades y DTO del backend. */
export interface Balon {
  id: number;
  codigo: string;
  nombre: string;
  precio: number;
  stock: number;
  stockMinimo: number;
}

export interface BalonRequest {
  codigo: string;
  nombre: string;
  precio: number;
  stock: number;
  stockMinimo: number;
}

export type TipoMovimiento = 'ENTRADA' | 'SALIDA';

export interface Movimiento {
  id: number;
  folio: string;
  tipo: TipoMovimiento;
  balonCodigo: string;
  balonNombre: string;
  cantidad: number;
  precioUnitario: number;
  responsable: string;
  observacion: string | null;
  fecha: string;
}

export interface MovimientoRequest {
  tipo: TipoMovimiento;
  balonCodigo: string;
  cantidad: number;
  responsable: string;
  observacion?: string;
}

export type Rol = 'ADMIN' | 'ALMACEN';

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: Rol;
}

export interface UsuarioRequest {
  email: string;
  nombre: string;
  password?: string;
  rol: Rol;
}

export interface LoginResponse {
  token: string;
  nombre: string;
  rol: Rol;
}
