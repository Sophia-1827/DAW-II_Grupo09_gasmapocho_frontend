import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/api/api-error';
import { BalonesApi } from '../../../core/api/balones.api';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

/** Alta y edición de un balón del catálogo (solo ADMIN). */
@Component({
  selector: 'gm-balon-form-page',
  imports: [ReactiveFormsModule, RouterLink, Alert, Button, PageHeader],
  template: `
    <gm-page-header [title]="id() ? 'Editar balón' : 'Nuevo balón'" subtitle="Código, nombre, precio y niveles de stock" />

    <form class="gm-card gm-card--narrow gm-form" [formGroup]="form" (ngSubmit)="guardar()" novalidate>
      @if (error(); as e) {
        <gm-alert tone="error">{{ e }}</gm-alert>
      }
      <div class="gm-form__grid">
        <label class="gm-field">
          <span>Código</span>
          <input class="gm-input" type="text" formControlName="codigo" maxlength="20" placeholder="BAL-11" style="text-transform: uppercase"
                 [attr.aria-invalid]="invalido('codigo')" />
          @if (invalido('codigo')) { <span class="error">El código es obligatorio (hasta 20 caracteres).</span> }
        </label>
        <label class="gm-field">
          <span>Nombre</span>
          <input class="gm-input" type="text" formControlName="nombre" maxlength="100" placeholder="Balón de gas 11 kg"
                 [attr.aria-invalid]="invalido('nombre')" />
          @if (invalido('nombre')) { <span class="error">El nombre es obligatorio.</span> }
        </label>
      </div>
      <div class="gm-form__grid">
        <label class="gm-field">
          <span>Precio (CLP)</span>
          <input class="gm-input" type="number" min="0" step="1" formControlName="precio" [attr.aria-invalid]="invalido('precio')" />
          @if (invalido('precio')) { <span class="error">Indica un precio mayor o igual a 0.</span> }
        </label>
        <label class="gm-field">
          <span>Stock</span>
          <input class="gm-input" type="number" min="0" step="1" formControlName="stock" [attr.aria-invalid]="invalido('stock')" />
          @if (invalido('stock')) { <span class="error">Indica un stock mayor o igual a 0.</span> }
        </label>
        <label class="gm-field">
          <span>Stock mínimo</span>
          <input class="gm-input" type="number" min="0" step="1" formControlName="stockMinimo" />
          <span class="hint">Con stock igual o menor, el balón se muestra como "Últimas N unidades".</span>
        </label>
      </div>
      <div class="gm-form__actions">
        <a gm-button variant="secondary" routerLink="/app/balones">Cancelar</a>
        <button gm-button type="submit" [disabled]="enviando()">{{ enviando() ? 'Guardando...' : (id() ? 'Guardar cambios' : 'Crear balón') }}</button>
      </div>
    </form>
  `,
})
export class BalonFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(BalonesApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly id = signal<number | null>(null);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.maxLength(20)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    precio: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    stockMinimo: [10, [Validators.min(0)]],
  });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id.set(Number(idParam));
      this.api.obtener(Number(idParam)).subscribe({
        next: (b) => this.form.patchValue({ codigo: b.codigo, nombre: b.nombre, precio: b.precio, stock: b.stock, stockMinimo: b.stockMinimo }),
        error: (err: unknown) => this.error.set(mensajeDeError(err)),
      });
    }
  }

  protected invalido(campo: 'codigo' | 'nombre' | 'precio' | 'stock'): boolean {
    const c = this.form.controls[campo];
    return c.touched && c.invalid;
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const body = { codigo: v.codigo.trim().toUpperCase(), nombre: v.nombre.trim(), precio: Number(v.precio), stock: Number(v.stock), stockMinimo: Number(v.stockMinimo) };
    const peticion = this.id() ? this.api.actualizar(this.id()!, body) : this.api.crear(body);
    peticion.subscribe({
      next: () => this.router.navigateByUrl('/app/balones'),
      error: (err: unknown) => { this.error.set(mensajeDeError(err)); this.enviando.set(false); },
    });
  }
}
