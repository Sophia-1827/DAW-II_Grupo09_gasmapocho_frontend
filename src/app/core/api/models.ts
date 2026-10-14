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

export interface Proveedor {
  id: number;
  nombre: string;
  rut: string;
  telefono: string;
  direccion: string;
  region: string;
  activo: boolean;
}

export type ProveedorRequest = Omit<Proveedor, 'id' | 'activo'>;

export interface Cliente {
  id: number;
  nombre: string;
  rut: string;
  direccion: string;
  telefono: string;
  activo: boolean;
}

export type ClienteRequest = Omit<Cliente, 'id' | 'activo'>;

export type TipoMovimiento = 'ENTRADA' | 'SALIDA';

export type EstadoMovimiento = 'REGISTRADO' | 'CONFIRMADO' | 'ANULADO';

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
  estado: EstadoMovimiento;
  /** Solo las compras a proveedor. */
  proveedorId: number | null;
  proveedorNombre: string | null;
  /** Solo las ventas con cliente; se copian al registrar para conservar el historial. */
  clienteId: number | null;
  clienteNombre: string | null;
  clienteDireccion: string | null;
}

export interface MovimientoRequest {
  tipo: TipoMovimiento;
  balonCodigo: string;
  cantidad: number;
  responsable: string;
  observacion?: string;
  /** Opcional y solo para ventas (SALIDA). */
  clienteId?: number;
}

/** Compra a proveedor: una ENTRADA asociada a un proveedor activo. Sin costo se usa el precio del catálogo. */
export interface CompraRequest {
  proveedorId: number;
  balonCodigo: string;
  cantidad: number;
  precioUnitario?: number;
  responsable: string;
  observacion?: string;
}

/** Lo único editable de un movimiento REGISTRADO. */
export interface MovimientoEdicion {
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
  activo: boolean;
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
