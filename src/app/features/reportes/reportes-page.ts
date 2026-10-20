import { Component, inject, signal } from '@angular/core';
import { mensajeDeError } from '../../core/api/api-error';
import { REPORTES, ReporteCatalogo, ReportesApi } from '../../core/api/reportes.api';
import { exportarExcel, exportarPdf } from '../../core/reportes/exportar-reporte';
import { Alert } from '../../shared/ui/alert/alert';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { TableCard } from '../../shared/ui/table-card/table-card';
import { environment } from '../../../environments/environment';

/** Reportes de ms-reportes. Cada reporte se descarga en Excel (.xlsx) o PDF. */
type Formato = 'excel' | 'pdf';

@Component({
  selector: 'gm-reportes-page',
  imports: [Alert, Button, Icon, PageHeader, TableCard],
  template: `
    <gm-page-header title="Reportes" subtitle="Consulta el estado del inventario y descarga cada reporte en el formato que necesites" />

    @if (mensaje(); as m) {
      <gm-alert [tone]="m.tone">{{ m.texto }}</gm-alert>
    }

    <gm-table-card [paged]="false">
      <table class="gm-table">
        <thead>
          <tr>
            <th>Reporte</th>
            <th class="cell-actions"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          @for (row of reportes; track row.clave) {
            <tr>
              <td>
                <span class="name">{{ row.nombre }}</span>
                <span class="desc">{{ row.descripcion }}</span>
              </td>
              <td class="cell-actions">
                <div class="acciones">
                  <button gm-button variant="secondary" type="button" [disabled]="generando() !== null" (click)="descargar(row, 'excel')">
                    <gm-icon name="download" [size]="18" />{{ generando() === row.clave + '-excel' ? 'Descargando...' : 'Excel' }}
                  </button>
                  <button gm-button variant="secondary" type="button" [disabled]="generando() !== null" (click)="descargar(row, 'pdf')">
                    <gm-icon name="download" [size]="18" />{{ generando() === row.clave + '-pdf' ? 'Descargando...' : 'PDF' }}
                  </button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </gm-table-card>
    <p class="nota">El stock actual también se expone por SOAP: <a [href]="wsdlUrl" target="_blank" rel="noopener"><code>{{ wsdlUrl }}</code></a>.</p>
  `,
  styles: `
    .acciones { display: inline-flex; gap: var(--gm-space-2); justify-content: flex-end; flex-wrap: wrap; }
    .name { display: block; font-weight: var(--gm-weight-bold); }
    .desc { display: block; margin-top: var(--gm-space-1); color: var(--gm-ink-muted); font-size: var(--gm-text-sm); }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    gm-alert { display: block; margin-bottom: var(--gm-space-4); }
    .nota { margin-top: var(--gm-space-4); color: var(--gm-ink-muted); font-size: var(--gm-text-sm); }
    .nota code { font-family: var(--gm-font-mono); }
    .nota a { color: inherit; }
  `,
})
export class ReportesPage {
  private readonly api = inject(ReportesApi);

  protected readonly reportes = REPORTES;
  protected readonly wsdlUrl = `${environment.apiUrl}/ws/reportes?wsdl`;
  protected readonly generando = signal<string | null>(null);
  protected readonly mensaje = signal<{ tone: 'error' | 'success'; texto: string } | null>(null);

  protected descargar(row: ReporteCatalogo, formato: Formato): void {
    this.generando.set(`${row.clave}-${formato}`);
    this.mensaje.set(null);
    this.api.generar(row.clave).subscribe({
      next: async (datos) => {
        const reporte = {
          titulo: row.nombre,
          archivo: `reporte-${row.clave}-${new Date().toISOString().slice(0, 10)}`,
          datos,
        };
        try {
          await (formato === 'excel' ? exportarExcel(reporte) : exportarPdf(reporte));
          this.mensaje.set({ tone: 'success', texto: `Reporte "${row.nombre}" descargado en ${formato === 'excel' ? 'Excel' : 'PDF'}.` });
        } catch {
          this.mensaje.set({ tone: 'error', texto: `No se pudo generar el archivo ${formato === 'excel' ? 'Excel' : 'PDF'}.` });
        } finally {
          this.generando.set(null);
        }
      },
      error: (err: unknown) => { this.mensaje.set({ tone: 'error', texto: mensajeDeError(err) }); this.generando.set(null); },
    });
  }
}
