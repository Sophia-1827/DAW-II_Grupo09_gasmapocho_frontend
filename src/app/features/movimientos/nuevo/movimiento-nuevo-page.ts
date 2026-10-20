import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, map, of, switchMap } from 'rxjs';
import { mensajeDeError } from '../../../core/api/api-error';
import { BalonesApi } from '../../../core/api/balones.api';
import { ClientesApi } from '../../../core/api/clientes.api';
import { Balon, Cliente, TipoMovimiento } from '../../../core/api/models';
import { estadoStock, pesos } from '../../../shared/formato';
import { MovimientosApi } from '../../../core/api/movimientos.api';
import { AuthService } from '../../../core/auth/auth.service';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { ClienteCampos, crearGrupoCliente } from '../../clientes/cliente-campos';

const NUEVO = 'nuevo';

/**
 * Registro de una venta o un ajuste de stock. Las ventas (salida) pueden llevar cliente: elegir uno existente
 * autocompleta sus datos (ADMIN puede corregirlos, ALMACEN solo los ve) y "Nuevo cliente" muestra los campos en blanco.
 * Las compras a proveedores tienen su propio flujo en Compras.
 */
@Component({
  selector: 'gm-movimiento-nuevo-page',
  imports: [ReactiveFormsModule, RouterLink, Alert, Button, PageHeader, ClienteCampos],
  template: `
    <gm-page-header title="Registrar movimiento" />

    <form class="gm-card gm-card--narrow gm-form" [formGroup]="form" (ngSubmit)="guardar()" novalidate>
      @if (error(); as e) {
        <gm-alert tone="error">{{ e }}</gm-alert>
      }

      <div class="gm-form__grid">
        <label class="gm-field">
          <span>Tipo</span>
          <select class="gm-select" formControlName="tipo">
            <option value="SALIDA">Salida (venta o despacho)</option>
            <option value="ENTRADA">Entrada (ajuste sin proveedor)</option>
          </select>
          @if (tipo() === 'ENTRADA') {
            <span class="hint">Para compras a proveedores usa <a routerLink="/app/compras/nueva">Nueva compra</a>.</span>
          }
        </label>
        <label class="gm-field">
          <span>Cantidad</span>
          <input class="gm-input" type="number" min="1" formControlName="cantidad"
                 [attr.aria-invalid]="invalido('cantidad')" />
          @if (invalido('cantidad')) { <span class="error">Indica una cantidad de al menos 1.</span> }
        </label>
      </div>

      <label class="gm-field">
        <span>Balón</span>
        <select class="gm-select" formControlName="balonCodigo" [attr.aria-invalid]="invalido('balonCodigo')">
          <option value="" disabled>Selecciona un balón</option>
          @for (b of balones(); track b.id) {
            <option [value]="b.codigo">{{ b.codigo }} · {{ b.nombre }} (stock {{ b.stock }})</option>
          }
        </select>
        @if (invalido('balonCodigo')) { <span class="error">Selecciona el balón.</span> }
        @if (seleccionado(); as b) {
          <span class="hint">Stock actual: {{ b.stock }} · {{ estadoStock(b) }} · Precio: {{ pesos(b.precio) }} · Total: {{ pesos(b.precio * cantidad()) }}</span>
        }
      </label>

      @if (tipo() === 'SALIDA') {
        <label class="gm-field">
          <span>Cliente <span class="hint">(opcional)</span></span>
          <select class="gm-select" formControlName="clienteId">
            <option value="">Sin cliente (venta de mostrador)</option>
            @for (c of clientes(); track c.id) {
              <option [value]="c.id">{{ c.nombre }} · {{ c.rut }}</option>
            }
            <option [value]="nuevo">+ Nuevo cliente</option>
          </select>
        </label>

        @if (seleccionCliente() !== '') {
          <fieldset class="datos">
            <legend>{{ seleccionCliente() === nuevo ? 'Datos del nuevo cliente' : 'Datos del cliente' }}</legend>
            <gm-cliente-campos [group]="cliente" />
            @if (seleccionCliente() !== nuevo) {
              <p class="hint">{{ auth.esAdmin() ? 'Puedes corregir estos datos; se guardan al registrar la venta.' : 'Solo un administrador puede modificar los datos de un cliente existente.' }}</p>
            }
          </fieldset>
        }
      }

      <label class="gm-field">
        <span>Responsable</span>
        <input class="gm-input" type="text" formControlName="responsable" maxlength="100" [attr.aria-invalid]="invalido('responsable')" />
        @if (invalido('responsable')) { <span class="error">Indica quién registra el movimiento.</span> }
      </label>

      <label class="gm-field">
        <span>Observación <span class="hint">(opcional)</span></span>
        <textarea class="gm-textarea" formControlName="observacion" maxlength="255" placeholder="Guía de despacho, detalle de la entrega..."></textarea>
      </label>

      <div class="gm-form__actions">
        <a gm-button variant="secondary" routerLink="/app/movimientos">Cancelar</a>
        <button gm-button type="submit" [disabled]="enviando()">{{ enviando() ? 'Guardando...' : 'Registrar movimiento' }}</button>
      </div>
    </form>
  `,
  styles: `
    .datos { display: grid; gap: var(--gm-space-4); margin: 0; padding: var(--gm-space-4); border: 1px solid var(--gm-line); border-radius: var(--gm-radius-sm); }
    legend { padding: 0 var(--gm-space-2); font-size: var(--gm-text-sm); font-weight: var(--gm-weight-semibold); }
    .hint { font-size: var(--gm-text-xs); color: var(--gm-ink-muted); margin: 0; }
  `,
})
export class MovimientoNuevoPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(MovimientosApi);
  private readonly balonesApi = inject(BalonesApi);
  private readonly clientesApi = inject(ClientesApi);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly nuevo = NUEVO;
  protected readonly estadoStock = estadoStock;
  protected readonly pesos = pesos;
  protected readonly balones = signal<Balon[]>([]);
  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly tipo = signal<TipoMovimiento>('SALIDA');
  /** '' = sin cliente, 'nuevo' = alta en el mismo flujo, o el id (texto) de un cliente existente. */
  protected readonly seleccionCliente = signal('');
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly cliente = crearGrupoCliente(this.fb);
  protected readonly form = this.fb.nonNullable.group({
    tipo: ['SALIDA' as TipoMovimiento, Validators.required],
    balonCodigo: ['', Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    clienteId: [''],
    responsable: [this.auth.usuario()?.nombre ?? '', [Validators.required, Validators.maxLength(100)]],
    observacion: ['', Validators.maxLength(255)],
  });

  constructor() {
    const tipo = this.route.snapshot.queryParamMap.get('tipo');
    if (tipo === 'ENTRADA' || tipo === 'SALIDA') this.form.controls.tipo.setValue(tipo);
    this.tipo.set(this.form.controls.tipo.value);
    this.balonesApi.listar().subscribe({
      next: (rows) => this.balones.set(rows),
      error: (err: unknown) => this.error.set(mensajeDeError(err)),
    });
    this.clientesApi.listarActivos().subscribe({
      next: (rows) => this.clientes.set(rows),
      error: (err: unknown) => this.error.set(mensajeDeError(err)),
    });
    this.form.controls.tipo.valueChanges.subscribe((t) => {
      this.tipo.set(t);
      if (t !== 'SALIDA') this.form.controls.clienteId.setValue('');
    });
    this.form.controls.clienteId.valueChanges.subscribe((valor) => this.alElegirCliente(valor));
  }

  protected seleccionado(): Balon | undefined {
    return this.balones().find((b) => b.codigo === this.form.controls.balonCodigo.value);
  }

  protected cantidad(): number {
    return Number(this.form.controls.cantidad.value) || 0;
  }

  protected invalido(campo: 'tipo' | 'balonCodigo' | 'cantidad' | 'responsable'): boolean {
    const c = this.form.controls[campo];
    return c.touched && c.invalid;
  }

  private alElegirCliente(valor: string): void {
    this.seleccionCliente.set(valor);
    if (valor === NUEVO) {
      this.cliente.reset();
      this.cliente.enable();
      return;
    }
    const existente = this.clientes().find((c) => String(c.id) === valor);
    if (!existente) return;
    this.cliente.patchValue({ nombre: existente.nombre, rut: existente.rut, direccion: existente.direccion, telefono: existente.telefono });
    // ALMACEN solo ve los datos; ADMIN puede corregirlos antes de registrar la venta.
    if (this.auth.esAdmin()) this.cliente.enable(); else this.cliente.disable();
  }

  protected guardar(): void {
    const conCliente = this.tipo() === 'SALIDA' && this.seleccionCliente() !== '';
    if (conCliente) this.cliente.markAllAsTouched();
    if (this.form.invalid || (conCliente && this.cliente.invalid)) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    const clienteId$: Observable<number | undefined> = conCliente ? this.resolverCliente() : of(undefined);
    clienteId$.pipe(
      switchMap((clienteId) => this.api.registrar({
        tipo: v.tipo,
        balonCodigo: v.balonCodigo,
        cantidad: Number(v.cantidad),
        responsable: v.responsable.trim(),
        observacion: v.observacion.trim() || undefined,
        clienteId,
      })),
    ).subscribe({
      next: (m) => this.router.navigate(['/app/movimientos'], { queryParams: { creado: m.folio } }),
      error: (err: unknown) => { this.error.set(mensajeDeError(err)); this.enviando.set(false); },
    });
  }

  /** Da de alta el cliente nuevo, guarda las correcciones del ADMIN, o usa el existente tal cual. Devuelve su id. */
  private resolverCliente(): Observable<number> {
    const datos = this.cliente.getRawValue();
    const body = { nombre: datos.nombre.trim(), rut: datos.rut.trim().toUpperCase(), direccion: datos.direccion.trim(), telefono: datos.telefono.trim() };
    if (this.seleccionCliente() === NUEVO) return this.clientesApi.crear(body).pipe(map((c) => c.id));

    const existente = this.clientes().find((c) => String(c.id) === this.seleccionCliente())!;
    const cambio = (Object.keys(body) as (keyof typeof body)[]).some((k) => body[k] !== existente[k]);
    return this.auth.esAdmin() && cambio ? this.clientesApi.actualizar(existente.id, body).pipe(map((c) => c.id)) : of(existente.id);
  }
}
