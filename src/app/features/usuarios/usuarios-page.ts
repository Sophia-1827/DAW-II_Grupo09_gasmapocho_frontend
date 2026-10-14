import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api/api-error';
import { Usuario } from '../../core/api/models';
import { UsuariosApi } from '../../core/api/usuarios.api';
import { AuthService } from '../../core/auth/auth.service';
import { Alert } from '../../shared/ui/alert/alert';
import { Badge } from '../../shared/ui/badge/badge';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { Search } from '../../shared/ui/search/search';
import { TableCard } from '../../shared/ui/table-card/table-card';

const TAMANO = 5;

@Component({
  selector: 'gm-usuarios-page',
  imports: [RouterLink, Alert, Badge, Button, Icon, PageHeader, Search, TableCard],
  template: `
    <gm-page-header title="Usuarios" subtitle="Administra las cuentas y los roles de acceso">
      <a gm-button routerLink="/app/usuarios/nuevo"><gm-icon name="plus" [size]="18" />Nuevo usuario</a>
    </gm-page-header>

    @if (mensaje(); as m) {
      <gm-alert [tone]="m.tone">{{ m.texto }}</gm-alert>
    }

    <gm-table-card [total]="filtrados().length" [pageSize]="tamano" [pagina]="pagina()" (paginaChange)="pagina.set($event)">
      <gm-search toolbar placeholder="Buscar usuario" (busqueda)="filtro.set($event); pagina.set(1)" />
      <table class="gm-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Nombre</th>
            <th>Rol</th>
            <th>Estado</th>
            <th class="cell-actions"><span class="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          @if (cargando()) {
            <tr class="row-state"><td colspan="5">Cargando...</td></tr>
          } @else if (paginaActual().length === 0) {
            <tr class="row-state"><td colspan="5">Sin usuarios que coincidan</td></tr>
          }
          @for (row of paginaActual(); track row.id) {
            <tr>
              <td class="cell-code">{{ row.email }}</td>
              <td>{{ row.nombre }}</td>
              <td>{{ row.rol }}</td>
              <td><gm-badge [tone]="row.activo ? 'success' : 'neutral'">{{ row.activo ? 'Activo' : 'Inactivo' }}</gm-badge></td>
              <td class="cell-actions">
                <a gm-button variant="icon" [routerLink]="['/app/usuarios', row.id, 'editar']" [attr.aria-label]="'Editar ' + row.email"><gm-icon name="pencil" [size]="18" /></a>
                <button gm-button variant="icon" type="button" [attr.aria-label]="(row.activo ? 'Desactivar ' : 'Activar ') + row.email"
                        [title]="row.email === yo() ? 'No puedes desactivar tu propia cuenta' : (row.activo ? 'Desactivar' : 'Activar')"
                        [disabled]="row.email === yo()" (click)="cambiarEstado(row)"><gm-icon name="power" [size]="18" /></button>
                <button gm-button variant="icon-danger" type="button" [attr.aria-label]="'Eliminar ' + row.email"
                        [disabled]="row.email === yo()" (click)="eliminar(row)"><gm-icon name="trash" [size]="18" /></button>
              </td>
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
export class UsuariosPage {
  private readonly api = inject(UsuariosApi);
  private readonly auth = inject(AuthService);

  protected readonly tamano = TAMANO;
  protected readonly yo = computed(() => this.auth.usuario()?.email ?? '');
  protected readonly todos = signal<Usuario[]>([]);
  protected readonly filtro = signal('');
  protected readonly pagina = signal(1);
  protected readonly cargando = signal(true);
  protected readonly mensaje = signal<{ tone: 'error' | 'success'; texto: string } | null>(null);

  protected readonly filtrados = computed(() => {
    const q = this.filtro().trim().toLowerCase();
    return q ? this.todos().filter((u) => u.email.toLowerCase().includes(q) || u.nombre.toLowerCase().includes(q)) : this.todos();
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

  protected cambiarEstado(row: Usuario): void {
    const accion = row.activo ? 'desactivar' : 'activar';
    if (!confirm(`¿Quieres ${accion} al usuario ${row.email}?${row.activo ? ' Ya no podrá iniciar sesión.' : ''}`)) return;
    this.api.cambiarEstado(row.id).subscribe({
      next: (u) => { this.mensaje.set({ tone: 'success', texto: `Usuario ${u.email} ${u.activo ? 'activado' : 'desactivado'}.` }); this.cargar(); },
      error: (err: unknown) => this.mensaje.set({ tone: 'error', texto: mensajeDeError(err) }),
    });
  }

  protected eliminar(row: Usuario): void {
    if (!confirm(`¿Eliminar al usuario ${row.email}?`)) return;
    this.api.eliminar(row.id).subscribe({
      next: () => { this.mensaje.set({ tone: 'success', texto: `Usuario ${row.email} eliminado.` }); this.cargar(); },
      error: (err: unknown) => this.mensaje.set({ tone: 'error', texto: mensajeDeError(err) }),
    });
  }
}
