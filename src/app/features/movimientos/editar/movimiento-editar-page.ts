import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/api/api-error';
import { Movimiento } from '../../../core/api/models';
import { MovimientosApi } from '../../../core/api/movimientos.api';
import { fechaCorta, pesos } from '../../../shared/formato';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

/**
 * Edición de un movimiento REGISTRADO (solo ADMIN). Se corrige la cantidad, el responsable y la observación;
 * el balón y el tipo no cambian. Si cambia la cantidad, el backend ajusta el stock con la diferencia.
 */
@Component({
  selector: 'gm-movimiento-editar-page',
  imports: [ReactiveFormsModule, RouterLink, Alert, Button, PageHeader],
  template: `
    <gm-page-header title="Editar movimiento" subtitle="Corrige la cantidad y el stock se ajusta con la diferencia" />

    <form class="gm-card gm-card--narrow gm-form" [formGroup]="form" (ngSubmit)="guardar()" novalidate>
      @if (error(); as e) {
        <gm-alert tone="error">{{ e }}</gm-alert>
      }

      @if (movimiento(); as m) {
        <dl class="resumen">
          <div><dt>Folio</dt><dd>{{ m.folio }}</dd></div>
          <div><dt>Fecha</dt><dd>{{ fecha(m.fecha) }}</dd></div>
          <div><dt>Tipo</dt><dd>{{ m.tipo === 'ENTRADA' ? 'Entrada' : 'Salida' }}</dd></div>
          <div><dt>Balón</dt><dd>{{ m.balonCodigo }} · {{ m.balonNombre }}</dd></div>
          <div><dt>Precio unitario</dt><dd>{{ pesos(m.precioUnitario) }}</dd></div>
          <div><dt>{{ m.proveedorNombre ? 'Proveedor' : 'Cliente' }}</dt><dd>{{ m.proveedorNombre || m.clienteNombre || '—' }}</dd></div>
        </dl>
      }

      <div class="gm-form__grid">
        <label class="gm-field">
          <span>Cantidad</span>
          <input class="gm-input" type="number" min="1" formControlName="cantidad" [attr.aria-invalid]="invalido('cantidad')" />
          @if (invalido('cantidad')) { <span class="error">Indica una cantidad de al menos 1.</span> }
          @if (diferencia(); as d) {
            <span class="hint">{{ efecto(d) }}</span>
          }
        </label>
        <label class="gm-field">
          <span>Responsable</span>
          <input class="gm-input" type="text" formControlName="responsable" maxlength="100" [attr.aria-invalid]="invalido('responsable')" />
          @if (invalido('responsable')) { <span class="error">Indica el responsable.</span> }
        </label>
      </div>

      <label class="gm-field">
        <span>Observación <span class="hint">(opcional)</span></span>
        <textarea class="gm-textarea" formControlName="observacion" maxlength="255"></textarea>
      </label>

      <div class="gm-form__actions">
        <a gm-button variant="secondary" routerLink="/app/movimientos">Cancelar</a>
        <button gm-button type="submit" [disabled]="enviando() || !movimiento()">{{ enviando() ? 'Guardando...' : 'Guardar cambios' }}</button>
      </div>
    </form>
  `,
  styles: `
    .resumen { display: grid; gap: var(--gm-space-3) var(--gm-space-5); grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin: 0; padding: var(--gm-space-4); border-radius: var(--gm-radius-sm); background: var(--gm-surface-subtle); }
    dt { font-size: var(--gm-text-xs); color: var(--gm-ink-muted); }
    dd { margin: 0; font-weight: var(--gm-weight-semibold); }
    .hint { font-size: var(--gm-text-xs); color: var(--gm-ink-muted); }
  `,
})
export class MovimientoEditarPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(MovimientosApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly fecha = fechaCorta;
  protected readonly pesos = pesos;
  protected readonly movimiento = signal<Movimiento | null>(null);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    cantidad: [1, [Validators.required, Validators.min(1)]],
    responsable: ['', [Validators.required, Validators.maxLength(100)]],
    observacion: ['', Validators.maxLength(255)],
  });

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    // El backend no expone un GET por id; el historial completo ya se pagina en cliente, así que se busca ahí.
    this.api.listar().subscribe({
      next: (rows) => {
        const m = rows.find((x) => x.id === id);
        if (!m) { this.error.set('No se encontró el movimiento.'); return; }
        if (m.estado !== 'REGISTRADO') { this.error.set(`Solo se puede editar un movimiento REGISTRADO; este está ${m.estado}.`); return; }
        this.movimiento.set(m);
        this.form.patchValue({ cantidad: m.cantidad, responsable: m.responsable, observacion: m.observacion ?? '' });
      },
      error: (err: unknown) => this.error.set(mensajeDeError(err)),
    });
  }

  protected invalido(campo: 'cantidad' | 'responsable'): boolean {
    const c = this.form.controls[campo];
    return c.touched && c.invalid;
  }

  /** Unidades que cambia la cantidad respecto de la registrada (0 = sin cambio). */
  protected diferencia(): number {
    const m = this.movimiento();
    return m ? Number(this.form.controls.cantidad.value) - m.cantidad : 0;
  }

  /** Texto del efecto en stock: una entrada que sube suma stock; una salida que sube lo resta. */
  protected efecto(d: number): string {
    const suma = this.movimiento()?.tipo === 'ENTRADA' ? d > 0 : d < 0;
    return `El stock ${suma ? 'sube' : 'baja'} ${Math.abs(d)} ${Math.abs(d) === 1 ? 'unidad' : 'unidades'}.`;
  }

  protected guardar(): void {
    const m = this.movimiento();
    if (!m) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    this.api.editar(m.id, { cantidad: Number(v.cantidad), responsable: v.responsable.trim(), observacion: v.observacion.trim() || undefined }).subscribe({
      next: (r) => this.router.navigate(['/app/movimientos'], { queryParams: { editado: r.folio } }),
      error: (err: unknown) => { this.error.set(mensajeDeError(err)); this.enviando.set(false); },
    });
  }
}
