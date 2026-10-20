/**
 * Convierte la respuesta JSON de ms-reportes en una tabla y la descarga como Excel (.xlsx) o PDF.
 * Las librerías se cargan con import() dinámico para no inflar el bundle inicial.
 */

type Celda = string | number | boolean | null;

interface TablaReporte {
  columnas: string[];
  filas: Celda[][];
  /** Datos sueltos (no tabulares) de la respuesta, p. ej. totales o fecha de corte. */
  resumen: [string, Celda][];
}

export interface ReporteExportable {
  titulo: string;
  archivo: string;
  datos: unknown;
}

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** "tipoBalon" / "tipo_balon" → "Tipo balon" */
function etiqueta(clave: string): string {
  const s = clave.replace(/[_-]+/g, ' ').replace(/([a-záéíóúñ0-9])([A-Z])/g, '$1 $2').toLowerCase().trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function aCelda(v: unknown): Celda {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map((x) => (esObjeto(x) ? JSON.stringify(x) : String(x))).join(', ');
  return JSON.stringify(v);
}

/** Aplana objetos anidados: { balon: { tipo: '15kg' } } → { 'balon tipo': '15kg' } */
function aplanar(obj: Record<string, unknown>, prefijo = ''): Record<string, Celda> {
  const out: Record<string, Celda> = {};
  for (const [k, v] of Object.entries(obj)) {
    const clave = prefijo ? `${prefijo}.${k}` : k;
    if (esObjeto(v)) Object.assign(out, aplanar(v, clave));
    else out[clave] = aCelda(v);
  }
  return out;
}

function aTabla(datos: unknown): TablaReporte {
  let lista: unknown[] | null = null;
  const resumen: [string, Celda][] = [];

  if (Array.isArray(datos)) {
    lista = datos;
  } else if (esObjeto(datos)) {
    for (const [k, v] of Object.entries(datos)) {
      if (Array.isArray(v) && lista === null) lista = v;
      else if (!Array.isArray(v)) {
        for (const [kk, vv] of Object.entries(esObjeto(v) ? aplanar(v, k) : { [k]: aCelda(v) })) {
          resumen.push([etiqueta(kk.replace(/\./g, ' ')), vv]);
        }
      }
    }
  }

  if (lista === null) {
    // Respuesta sin listas: se muestra como tabla de dos columnas.
    return { columnas: ['Campo', 'Valor'], filas: resumen.map(([k, v]) => [k, v]), resumen: [] };
  }

  const planas = lista.map((item) => (esObjeto(item) ? aplanar(item) : { valor: aCelda(item) }));
  const claves = [...new Set(planas.flatMap((o) => Object.keys(o)))];
  return {
    columnas: claves.map((k) => etiqueta(k.replace(/\./g, ' '))),
    filas: planas.map((o) => claves.map((k) => o[k] ?? null)),
    resumen,
  };
}

function descargar(blob: Blob, nombre: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 0);
}

const fechaHoy = () => new Date().toLocaleString('es-CL');

export async function exportarExcel({ titulo, archivo, datos }: ReporteExportable): Promise<void> {
  const mod = await import('exceljs');
  // exceljs es CommonJS: según el bundler, las clases vienen en el módulo o en `default`.
  const Workbook = mod.Workbook ?? (mod as unknown as { default: typeof mod }).default.Workbook;
  const tabla = aTabla(datos);
  const wb = new Workbook();
  wb.creator = 'Gas Mapocho';
  const ws = wb.addWorksheet(titulo.slice(0, 31));

  ws.addRow([titulo]).font = { bold: true, size: 14 };
  ws.addRow([`Generado: ${fechaHoy()}`]).font = { italic: true, color: { argb: 'FF666666' } };
  for (const [k, v] of tabla.resumen) ws.addRow([k, v]);
  ws.addRow([]);

  const cabecera = ws.addRow(tabla.columnas);
  cabecera.eachCell((c) => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B78B4' } };
    c.border = { bottom: { style: 'thin' } };
  });
  for (const fila of tabla.filas) ws.addRow(fila);

  tabla.columnas.forEach((col, i) => {
    const largo = Math.max(col.length, ...tabla.filas.map((f) => String(f[i] ?? '').length));
    ws.getColumn(i + 1).width = Math.min(Math.max(largo + 2, 12), 50);
  });

  const buffer = await wb.xlsx.writeBuffer();
  descargar(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${archivo}.xlsx`,
  );
}

export async function exportarPdf({ titulo, archivo, datos }: ReporteExportable): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const tabla = aTabla(datos);
  const doc = new jsPDF({ orientation: tabla.columnas.length > 5 ? 'landscape' : 'portrait' });

  doc.setFontSize(16);
  doc.text(titulo, 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.text(`Gas Mapocho · Generado: ${fechaHoy()}`, 14, 24);
  doc.setTextColor(0);

  let y = 30;
  for (const [k, v] of tabla.resumen) {
    doc.text(`${k}: ${v ?? ''}`, 14, y);
    y += 5;
  }

  autoTable(doc, {
    startY: y + 2,
    head: [tabla.columnas],
    body: tabla.filas.map((f) => f.map((c) => (c === null ? '' : String(c)))),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [11, 120, 180] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  doc.save(`${archivo}.pdf`);
}
