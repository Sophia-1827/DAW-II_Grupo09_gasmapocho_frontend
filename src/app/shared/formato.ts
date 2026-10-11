/** Formato de fecha y moneda para las tablas (es-CL). */
export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function pesos(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return '—';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(valor);
}

/** Texto de estado según stock y mínimo: "Disponible", "Últimas N unidades" o "Sin stock". */
export function estadoStock(b: { stock: number; stockMinimo: number }): string {
  if (b.stock <= 0) return 'Sin stock';
  if (b.stock <= b.stockMinimo) return `Últimas ${b.stock} unidades`;
  return 'Disponible';
}

/** true si la fecha ISO corresponde al día de hoy (hora local). */
export function esHoy(iso: string): boolean {
  const d = new Date(iso);
  const h = new Date();
  return d.getFullYear() === h.getFullYear() && d.getMonth() === h.getMonth() && d.getDate() === h.getDate();
}
