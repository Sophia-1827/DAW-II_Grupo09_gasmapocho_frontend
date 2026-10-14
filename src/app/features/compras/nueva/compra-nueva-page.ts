import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, map, of, switchMap } from 'rxjs';
import { mensajeDeError } from '../../../core/api/api-error';
import { BalonesApi } from '../../../core/api/balones.api';
import { Balon, Proveedor } from '../../../core/api/models';
import { MovimientosApi } from '../../../core/api/movimientos.api';
import { ProveedoresApi } from '../../../core/api/proveedores.api';
import { AuthService } from '../../../core/auth/auth.service';
import { estadoStock, pesos } from '../../../shared/formato';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ProveedorCampos, crearGrupoProveedor } from '../../proveedores/proveedor-campos';

const NUEVO = 'nuevo';

/**
 * Compra a proveedor: una entrada de stock asociada a un proveedor.
 * Elegir un proveedor existente autocompleta sus datos (ADMIN puede corregirlos, ALMACEN solo los ve);
 * "Nuevo proveedor" muestra los mismos campos en blanco y lo da de alta al registrar la compra.
 */
@Component({
  selector: 'gm-compra-nueva-page',
  imports: [ReactiveFormsModule, RouterLink, Alert, Button, PageHeader, ProveedorCampos],
  template: `
    <gm-page-header title="Nueva compra" subtitle="Registra el ingreso de balones comprados a un proveedor" />

    <form class="gm-card gm-card--narrow gm-form" [formGroup]="form" (ngSubmit)="guardar()" novalidate>
      @if (error(); as e) {
        <gm-alert tone="error">{{ e }}</gm-alert>
      }

      <label class="gm-field">
        <span>Proveedor</span>
        <select class="gm-select" formControlName="proveedorId" [attr.aria-invalid]="invalido('proveedorId')">
          <option value="" disabled>Selecciona un proveedor</option>
          @for (p of proveedores(); track p.id) {
            <option [value]="p.id">{{ p.nombre }} · {{ p.rut }}</option>
          }
          <option [value]="nuevo">+ Nuevo proveedor</option>
        </select>
        @if (invalido('proveedorId')) { <span class="error">Selecciona un proveedor o crea uno nuevo.</span> }
      </label>

      @if (seleccion() !== '') {
        <fieldset class="datos">
          <legend>{{ seleccion() === nuevo ? 'Datos del nuevo proveedor' : 'Datos del proveedor' }}</legend>
          <gm-proveedor-campos [group]="proveedor" />
          @if (seleccion() !== nuevo) {
            <p class="hint">{{ auth.esAdmin() ? 'Puedes corregir estos datos; se guardan al registrar la compra.' : 'Solo un administrador puede modificar los datos de un proveedor existente.' }}</p>
          }
        </fieldset>
      }

      <div class="gm-form__grid">
        <label class="gm-field">
          <span>Balón</span>
          <select class="gm-select" formControlName="balonCodigo" [attr.aria-invalid]="invalido('balonCodigo')">
            <option value="" disabled>Selecciona un balón</option>
            @for (b of balones(); track b.id) {
              <option [value]="b.codigo">{{ b.codigo }} · {{ b.nombre }} (stock {{ b.stock }})</option>
            }
          </select>
          @if (invalido('balonCodigo')) { <span class="error">Selecciona el balón.</span> }
          @if (balon(); as b) { <span class="hint">Stock actual: {{ b.stock }} · {{ estadoStock(b) }}</span> }
        </label>
        <label class="gm-field">
          <span>Cantidad</span>
          <input class="gm-input" type="number" min="1" formControlName="cantidad" [attr.aria-invalid]="invalido('cantidad')" />
          @if (invalido('cantidad')) { <span class="error">Indica una cantidad de al menos 1.</span> }
        </label>
      </div>

      <div class="gm-form__grid">
        <label class="gm-field">
          <span>Costo unitario (CLP) <span class="hint">(opcional)</span></span>
          <input class="gm-input" type="number" min="1" step="1" formControlName="precioUnitario" [attr.aria-invalid]="invalido('precioUnitario')" />
          @if (balon(); as b) { <span class="hint">Si lo dejas vacío se usa el precio de catálogo: {{ pesos(b.precio) }}</span> }
          @if (invalido('precioUnitario')) { <span class="error">El costo debe ser mayor a 0.</span> }
        </label>
        <div class="gm-field">
          <span>Total de la compra</span>
          <output class="total">{{ total() === null ? '—' : pesos(total()) }}</output>
        </div>
      </div>

      <label class="gm-field">
        <span>Responsable</span>
        <input class="gm-input" type="text" formControlName="responsable" maxlength="100" [attr.aria-invalid]="invalido('responsable')" />
        @if (invalido('responsable')) { <span class="error">Indica quién registra la compra.</span> }
      </label>

      <label class="gm-field">
        <span>Observación <span class="hint">(opcional)</span></span>
        <textarea class="gm-textarea" formControlName="observacion" maxlength="255" placeholder="Guía de despacho, condiciones de pago..."></textarea>
      </label>

      <div class="gm-form__actions">
        <a gm-button variant="secondary" routerLink="/app/compras">Cancelar</a>
        <button gm-button type="submit" [disabled]="enviando()">{{ enviando() ? 'Guardando...' : 'Registrar compra' }}</button>
      </div>
    </form>
  `,
  styles: `
    .datos { display: grid; gap: var(--gm-space-4); margin: 0; padding: var(--gm-space-4); border: 1px solid var(--gm-line); border-radius: var(--gm-radius-sm); }
    legend { padding: 0 var(--gm-space-2); font-size: var(--gm-text-sm); font-weight: var(--gm-weight-semibold); }
    .hint { font-size: var(--gm-text-xs); color: var(--gm-ink-muted); margin: 0; }
    .total { display: flex; align-items: center; min-height: var(--gm-control-height); font-size: var(--gm-text-lg); font-weight: var(--gm-weight-bold); }
  `,
})
export class CompraNuevaPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(MovimientosApi);
  private readonly balonesApi = inject(BalonesApi);
  private readonly proveedoresApi = inject(ProveedoresApi);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly nuevo = NUEVO;
  protected readonly pesos = pesos;
  protected readonly estadoStock = estadoStock;
  protected readonly proveedores = signal<Proveedor[]>([]);
  protected readonly balones = signal<Balon[]>([]);
  /** '' = sin elegir, 'nuevo' = alta en el mismo flujo, o el id (texto) de un proveedor existente. */
  protected readonly seleccion = signal('');
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly proveedor = crearGrupoProveedor(this.fb);
  protected readonly form = this.fb.nonNullable.group({
    proveedorId: ['', Validators.required],
    balonCodigo: ['', Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    precioUnitario: new FormControl<number | null>(null, Validators.min(1)),
    responsable: [this.auth.usuario()?.nombre ?? '', [Validators.required, Validators.maxLength(100)]],
    observacion: ['', Validators.maxLength(255)],
  });

  constructor() {
    this.proveedoresApi.listarActivos().subscribe({
      next: (rows) => this.proveedores.set(rows),
      error: (err: unknown) => this.error.set(mensajeDeError(err)),
    });
    this.balonesApi.listar().subscribe({
      next: (rows) => this.balones.set(rows),
      error: (err: unknown) => this.error.set(mensajeDeError(err)),
    });
    this.form.controls.proveedorId.valueChanges.subscribe((valor) => this.alElegirProveedor(valor));
  }

  protected balon(): Balon | undefined {
    return this.balones().find((b) => b.codigo === this.form.controls.balonCodigo.value);
  }

  /** Cantidad por costo; sin costo indicado usa el precio de catálogo del balón. */
  protected total(): number | null {
    const b = this.balon();
    const v = this.form.getRawValue();
    const unitario = v.precioUnitario ?? b?.precio ?? null;
    return unitario === null ? null : Number(v.cantidad) * unitario;
  }

  protected invalido(campo: 'proveedorId' | 'balonCodigo' | 'cantidad' | 'precioUnitario' | 'responsable'): boolean {
    const c = this.form.controls[campo];
    return c.touched && c.invalid;
  }

  private alElegirProveedor(valor: string): void {
    this.seleccion.set(valor);
    if (valor === NUEVO) {
      this.proveedor.reset();
      this.proveedor.enable();
      return;
    }
    const existente = this.proveedores().find((p) => String(p.id) === valor);
    if (!existente) return;
    this.proveedor.patchValue({ nombre: existente.nombre, rut: existente.rut, telefono: existente.telefono, direccion: existente.direccion, region: existente.region });
    // ALMACEN solo ve los datos; ADMIN puede corregirlos antes de registrar la compra.
    if (this.auth.esAdmin()) this.proveedor.enable(); else this.proveedor.disable();
  }

  protected guardar(): void {
    this.proveedor.markAllAsTouched();
    if (this.form.invalid || this.proveedor.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    this.resolverProveedor().pipe(
      switchMap((proveedorId) => this.api.registrarCompra({
        proveedorId,
        balonCodigo: v.balonCodigo,
        cantidad: Number(v.cantidad),
        precioUnitario: v.precioUnitario ?? undefined,
        responsable: v.responsable.trim(),
        observacion: v.observacion.trim() || undefined,
      })),
    ).subscribe({
      next: (m) => this.router.navigate(['/app/compras'], { queryParams: { creada: m.folio } }),
      error: (err: unknown) => { this.error.set(mensajeDeError(err)); this.enviando.set(false); },
    });
  }

  /** Da de alta el proveedor nuevo, guarda las correcciones del ADMIN, o usa el existente tal cual. Devuelve su id. */
  private resolverProveedor(): Observable<number> {
    const datos = this.proveedor.getRawValue();
    const body = { nombre: datos.nombre.trim(), rut: datos.rut.trim().toUpperCase(), telefono: datos.telefono.trim(), direccion: datos.direccion.trim(), region: datos.region.trim() };
    if (this.seleccion() === NUEVO) return this.proveedoresApi.crear(body).pipe(map((p) => p.id));

    const existente = this.proveedores().find((p) => String(p.id) === this.seleccion())!;
    const cambio = (Object.keys(body) as (keyof typeof body)[]).some((k) => body[k] !== existente[k]);
    return this.auth.esAdmin() && cambio ? this.proveedoresApi.actualizar(existente.id, body).pipe(map((p) => p.id)) : of(existente.id);
  }
}
