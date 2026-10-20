import { Component, inject, signal } from '@angular/core';
import { mensajeDeError } from '../../core/api/api-error';
import { REPORTES, ReporteCatalogo, ReportesApi } from '../../core/api/reportes.api';
import { Alert } from '../../shared/ui/alert/alert';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { TableCard } from '../../shared/ui/table-card/table-card';
import { environment } from '../../../environments/environment';

/** Reportes de ms-reportes. "Generar" ejecuta el reporte y descarga el resultado en JSON. */
@Component({
  selector: 'gm-reportes-page',
  imports: [Alert, Button, Icon, PageHeader, TableCard],
  template: `
    <gm-page-header title="Reportes" subtitle="Genera los reportes REST y SOAP del inventario" />

    @if (mensaje(); as m) {
      <gm-alert [tone]="m.tone">{{ m.texto }}</gm-alert>
    }

    <gm-table-card [paged]="false">
      <table class="gm-table">
        <thead>
          <tr>
            <th>Reporte</th>
            <th>Tipo</th>
            <th>Período</th>
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
              <td>{{ row.tipo }}</td>
              <td class="cell-muted">{{ row.periodo }}</td>
              <td class="cell-actions">
                <button gm-button variant="secondary" type="button" [disabled]="generando() === row.clave" (click)="generar(row)">
                  <gm-icon name="download" [size]="18" />{{ generando() === row.clave ? 'Generando...' : 'Generar' }}
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </gm-table-card>
    <p class="nota">El stock actual también se expone por SOAP: <a [href]="wsdlUrl" target="_blank" rel="noopener"><code>{{ wsdlUrl }}</code></a>.</p>
  `,
  styles: `
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

  protected generar(row: ReporteCatalogo): void {
    this.generando.set(row.clave);
    this.api.generar(row.clave).subscribe({
      next: (datos) => {
        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `reporte-${row.clave}-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        this.mensaje.set({ tone: 'success', texto: `Reporte "${row.nombre}" generado y descargado.` });
        this.generando.set(null);
      },
      error: (err: unknown) => { this.mensaje.set({ tone: 'error', texto: mensajeDeError(err) }); this.generando.set(null); },
    });
  }
}
