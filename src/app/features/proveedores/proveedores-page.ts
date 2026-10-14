import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api/api-error';
import { Proveedor } from '../../core/api/models';
import { ProveedoresApi } from '../../core/api/proveedores.api';
import { AuthService } from '../../core/auth/auth.service';
import { Alert } from '../../shared/ui/alert/alert';
import { Badge } from '../../shared/ui/badge/badge';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { Search } from '../../shared/ui/search/search';
import { TableCard } from '../../shared/ui/table-card/table-card';

const TAMANO = 5;

/** Proveedores de balones. ALMACEN consulta y da de alta; solo ADMIN edita y activa o desactiva. */
@Component({
  selector: 'gm-proveedores-page',
  imports: [RouterLink, Alert, Badge, Button, Icon, PageHeader, Search, TableCard],
  template: `
    <gm-page-header title="Proveedores"
      [subtitle]="auth.esAdmin() ? 'Administra los proveedores que abastecen el almacén' : 'Consulta los proveedores que abastecen el almacén'">
      <a gm-button routerLink="/app/proveedores/nuevo"><gm-icon name="plus" [size]="18" />Nuevo proveedor</a>
    </gm-page-header>

    @if (mensaje(); as m) {
      <gm-alert [tone]="m.tone">{{ m.texto }}</gm-alert>
    }

    <gm-table-card [total]="filtrados().length" [pageSize]="tamano" [pagina]="pagina()" (paginaChange)="pagina.set($event)">
      <gm-search toolbar placeholder="Buscar proveedor" (busqueda)="filtro.set($event); pagina.set(1)" />
      <table class="gm-table">
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>RUT</th>
            <th>Teléfono</th>
            <th>Región</th>
            <th>Estado</th>
            @if (auth.esAdmin()) {
              <th class="cell-actions"><span class="sr-only">Acciones</span></th>
            }
          </tr>
        </thead>
        <tbody>
          @if (cargando()) {
            <tr class="row-state"><td [attr.colspan]="columnas()">Cargando...</td></tr>
          } @else if (paginaActual().length === 0) {
            <tr class="row-state"><td [attr.colspan]="columnas()">Sin proveedores que coincidan</td></tr>
          }
          @for (row of paginaActual(); track row.id) {
            <tr>
              <td class="cell-code">{{ row.nombre }}</td>
              <td class="cell-muted">{{ row.rut }}</td>
              <td class="cell-muted">{{ row.telefono }}</td>
              <td class="cell-muted">{{ row.region }}</td>
              <td><gm-badge [tone]="row.activo ? 'success' : 'neutral'">{{ row.activo ? 'Activo' : 'Inactivo' }}</gm-badge></td>
              @if (auth.esAdmin()) {
                <td class="cell-actions">
                  <a gm-button variant="icon" [routerLink]="['/app/proveedores', row.id, 'editar']" [attr.aria-label]="'Editar ' + row.nombre"><gm-icon name="pencil" [size]="18" /></a>
                  <button gm-button variant="icon" type="button" [attr.aria-label]="(row.activo ? 'Desactivar ' : 'Activar ') + row.nombre"
                          [title]="row.activo ? 'Desactivar' : 'Activar'" (click)="cambiarEstado(row)"><gm-icon name="power" [size]="18" /></button>
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </gm-table-card>
  `,
  styles: `
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    gm-alert { display: block; margin-bottom: var(--gm-space-4); }
  `,
})
export class ProveedoresPage {
  private readonly api = inject(ProveedoresApi);
  protected readonly auth = inject(AuthService);

  protected readonly tamano = TAMANO;
  protected readonly columnas = computed(() => (this.auth.esAdmin() ? 6 : 5));
  protected readonly todos = signal<Proveedor[]>([]);
  protected readonly filtro = signal('');
  protected readonly pagina = signal(1);
  protected readonly cargando = signal(true);
  protected readonly mensaje = signal<{ tone: 'error' | 'success'; texto: string } | null>(null);

  protected readonly filtrados = computed(() => {
    const q = this.filtro().trim().toLowerCase();
    return q
      ? this.todos().filter((p) => p.nombre.toLowerCase().includes(q) || p.rut.toLowerCase().includes(q) || p.region.toLowerCase().includes(q))
      : this.todos();
  });
  protected readonly paginaActual = computed(() => {
    const inicio = (this.pagina() - 1) * TAMANO;
    return this.filtrados().slice(inicio, inicio + TAMANO);
  });

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.api.listar().subscribe({
      next: (rows) => { this.todos.set(rows); this.cargando.set(false); },
      error: (err: unknown) => { this.mensaje.set({ tone: 'error', texto: mensajeDeError(err) }); this.cargando.set(false); },
    });
  }

  protected cambiarEstado(row: Proveedor): void {
    const accion = row.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿Quieres ${accion} al proveedor ${row.nombre}?`)) return;
    this.api.cambiarEstado(row.id).subscribe({
      next: (p) => { this.mensaje.set({ tone: 'success', texto: `Proveedor ${p.nombre} ${p.activo ? 'activado' : 'desactivado'}.` }); this.cargar(); },
      error: (err: unknown) => this.mensaje.set({ tone: 'error', texto: mensajeDeError(err) }),
    });
  }
}
