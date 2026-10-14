import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/api/api-error';
import { ClientesApi } from '../../../core/api/clientes.api';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ClienteCampos, crearGrupoCliente } from '../cliente-campos';

/** Alta y edición de un cliente. El alta está abierta a ALMACEN; la edición es solo de ADMIN (lo exige la ruta). */
@Component({
  selector: 'gm-cliente-form-page',
  imports: [ReactiveFormsModule, RouterLink, Alert, Button, PageHeader, ClienteCampos],
  template: `
    <gm-page-header [title]="id() ? 'Editar cliente' : 'Nuevo cliente'" subtitle="Datos de contacto y dirección de entrega" />

    <form class="gm-card gm-card--narrow gm-form" [formGroup]="form" (ngSubmit)="guardar()" novalidate>
      @if (error(); as e) {
        <gm-alert tone="error">{{ e }}</gm-alert>
      }
      <gm-cliente-campos [group]="form" />
      <div class="gm-form__actions">
        <a gm-button variant="secondary" routerLink="/app/clientes">Cancelar</a>
        <button gm-button type="submit" [disabled]="enviando()">{{ enviando() ? 'Guardando...' : (id() ? 'Guardar cambios' : 'Crear cliente') }}</button>
      </div>
    </form>
  `,
})
export class ClienteFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ClientesApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly id = signal<number | null>(null);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = crearGrupoCliente(this.fb);

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id.set(Number(idParam));
      this.api.obtener(Number(idParam)).subscribe({
        next: (c) => this.form.patchValue({ nombre: c.nombre, rut: c.rut, direccion: c.direccion, telefono: c.telefono }),
        error: (err: unknown) => this.error.set(mensajeDeError(err)),
      });
    }
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const body = { nombre: v.nombre.trim(), rut: v.rut.trim().toUpperCase(), direccion: v.direccion.trim(), telefono: v.telefono.trim() };
    const peticion = this.id() ? this.api.actualizar(this.id()!, body) : this.api.crear(body);
    peticion.subscribe({
      next: () => this.router.navigateByUrl('/app/clientes'),
      error: (err: unknown) => { this.error.set(mensajeDeError(err)); this.enviando.set(false); },
    });
  }
}
