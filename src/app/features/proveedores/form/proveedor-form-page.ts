import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/api/api-error';
import { ProveedoresApi } from '../../../core/api/proveedores.api';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ProveedorCampos, crearGrupoProveedor } from '../proveedor-campos';

/** Alta y edición de un proveedor. El alta está abierta a ALMACEN; la edición es solo de ADMIN (lo exige la ruta). */
@Component({
  selector: 'gm-proveedor-form-page',
  imports: [ReactiveFormsModule, RouterLink, Alert, Button, PageHeader, ProveedorCampos],
  template: `
    <gm-page-header [title]="id() ? 'Editar proveedor' : 'Nuevo proveedor'" subtitle="Datos de contacto y ubicación del proveedor" />

    <form class="gm-card gm-card--narrow gm-form" [formGroup]="form" (ngSubmit)="guardar()" novalidate>
      @if (error(); as e) {
        <gm-alert tone="error">{{ e }}</gm-alert>
      }
      <gm-proveedor-campos [group]="form" />
      <div class="gm-form__actions">
        <a gm-button variant="secondary" routerLink="/app/proveedores">Cancelar</a>
        <button gm-button type="submit" [disabled]="enviando()">{{ enviando() ? 'Guardando...' : (id() ? 'Guardar cambios' : 'Crear proveedor') }}</button>
      </div>
    </form>
  `,
})
export class ProveedorFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ProveedoresApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly id = signal<number | null>(null);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = crearGrupoProveedor(this.fb);

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id.set(Number(idParam));
      this.api.obtener(Number(idParam)).subscribe({
        next: (p) => this.form.patchValue({ nombre: p.nombre, rut: p.rut, telefono: p.telefono, direccion: p.direccion, region: p.region }),
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
    const body = { nombre: v.nombre.trim(), rut: v.rut.trim().toUpperCase(), telefono: v.telefono.trim(), direccion: v.direccion.trim(), region: v.region.trim() };
    const peticion = this.id() ? this.api.actualizar(this.id()!, body) : this.api.crear(body);
    peticion.subscribe({
      next: () => this.router.navigateByUrl('/app/proveedores'),
      error: (err: unknown) => { this.error.set(mensajeDeError(err)); this.enviando.set(false); },
    });
  }
}
