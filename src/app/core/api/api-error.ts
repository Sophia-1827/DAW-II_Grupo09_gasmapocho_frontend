import { HttpErrorResponse } from '@angular/common/http';

/** Convierte un error HTTP en un texto para la pantalla, usando el mensaje del backend si existe. */
export function mensajeDeError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'No se pudo conectar con el servidor. Revisa que el gateway esté arriba.';
    const cuerpo = err.error;
    if (cuerpo && typeof cuerpo === 'object') {
      // ResponseStatusException -> "message"; validación -> "errors[].defaultMessage"
      if (Array.isArray(cuerpo.errors) && cuerpo.errors.length) {
        return cuerpo.errors.map((e: { defaultMessage?: string }) => e.defaultMessage).filter(Boolean).join('. ');
      }
      if (typeof cuerpo.message === 'string' && cuerpo.message) return cuerpo.message;
    }
    if (err.status === 401) return 'Usuario o contraseña incorrectos.';
    if (err.status === 403) return 'No tienes permisos para esta acción.';
    if (err.status === 400) return 'Revisa los datos ingresados.';
    return `Error ${err.status} del servidor.`;
  }
  return 'Ocurrió un error inesperado.';
}
