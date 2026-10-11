import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/api/api-error';
import { BalonesApi } from '../../../core/api/balones.api';
import { Balon, TipoMovimiento } from '../../../core/api/models';
import { estadoStock } from '../../../shared/formato';
import { MovimientosApi } from '../../../core/api/movimientos.api';
import { AuthService } from '../../../core/auth/auth.service';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

@Component({
  selector: 'gm-movimiento-nuevo-page',
  imports: [ReactiveFormsModule, RouterLink, Alert, Button, PageHeader],
  template: `
    <gm-page-header title="Registrar movimiento" subtitle="La entrada suma stock y la salida lo descuenta en ms-balones" />

    <form class="gm-card gm-card--narrow gm-form" [formGroup]="form" (ngSubmit)="guardar()" novalidate>
      @if (error(); as e) {
        <gm-alert tone="error">{{ e }}</gm-alert>
      }

      <div class="gm-form__grid">
        <label class="gm-field">
          <span>Tipo</span>
          <select class="gm-select" formControlName="tipo">
            <option value="ENTRADA">Entrada (reposición)</option>
            <option value="SALIDA">Salida (venta o despacho)</option>
          </select>
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
        @if (seleccionado(); as b) { <span class="hint">Stock actual: {{ b.stock }} · {{ estadoStock(b) }}</span> }
      </label>

      <label class="gm-field">
        <span>Responsable</span>
        <input class="gm-input" type="text" formControlName="responsable" maxlength="100" [attr.aria-invalid]="invalido('responsable')" />
        @if (invalido('responsable')) { <span class="error">Indica quién registra el movimiento.</span> }
      </label>

      <label class="gm-field">
        <span>Observación <span class="hint">(opcional)</span></span>
        <textarea class="gm-textarea" formControlName="observacion" maxlength="255" placeholder="Proveedor, cliente, guía de despacho..."></textarea>
      </label>

      <div class="gm-form__actions">
        <a gm-button variant="secondary" routerLink="/app/movimientos">Cancelar</a>
        <button gm-button type="submit" [disabled]="enviando()">{{ enviando() ? 'Guardando...' : 'Registrar movimiento' }}</button>
      </div>
    </form>
  `,
})
export class MovimientoNuevoPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(MovimientosApi);
  private readonly balonesApi = inject(BalonesApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly estadoStock = estadoStock;
  protected readonly balones = signal<Balon[]>([]);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    tipo: ['SALIDA' as TipoMovimiento, Validators.required],
    balonCodigo: ['', Validators.required],
    cantidad: [1, [Validators.required, Validators.min(1)]],
    responsable: [this.auth.usuario()?.nombre ?? '', [Validators.required, Validators.maxLength(100)]],
    observacion: ['', Validators.maxLength(255)],
  });

  constructor() {
    const tipo = this.route.snapshot.queryParamMap.get('tipo');
    if (tipo === 'ENTRADA' || tipo === 'SALIDA') this.form.controls.tipo.setValue(tipo);
    this.balonesApi.listar().subscribe({
      next: (rows) => this.balones.set(rows),
      error: (err: unknown) => this.error.set(mensajeDeError(err)),
    });
  }

  protected seleccionado(): Balon | undefined {
    return this.balones().find((b) => b.codigo === this.form.controls.balonCodigo.value);
  }

  protected invalido(campo: 'tipo' | 'balonCodigo' | 'cantidad' | 'responsable'): boolean {
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
    this.api.registrar({
      tipo: v.tipo,
      balonCodigo: v.balonCodigo,
      cantidad: Number(v.cantidad),
      responsable: v.responsable.trim(),
      observacion: v.observacion.trim() || undefined,
    }).subscribe({
      next: (m) => this.router.navigate(['/app/movimientos'], { queryParams: { creado: m.folio } }),
      error: (err: unknown) => { this.error.set(mensajeDeError(err)); this.enviando.set(false); },
    });
  }
}
