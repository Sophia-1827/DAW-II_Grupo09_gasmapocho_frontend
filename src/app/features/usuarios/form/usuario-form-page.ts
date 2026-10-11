import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/api/api-error';
import { Rol } from '../../../core/api/models';
import { UsuariosApi } from '../../../core/api/usuarios.api';
import { Alert } from '../../../shared/ui/alert/alert';
import { Button } from '../../../shared/ui/button/button';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

/** Alta y edición de usuarios (solo ADMIN). La contraseña es obligatoria al crear y opcional al editar. */
@Component({
  selector: 'gm-usuario-form-page',
  imports: [ReactiveFormsModule, RouterLink, Alert, Button, PageHeader],
  template: `
    <gm-page-header [title]="id() ? 'Editar usuario' : 'Nuevo usuario'" subtitle="Cuenta, nombre, rol y contraseña" />

    <form class="gm-card gm-card--narrow gm-form" [formGroup]="form" (ngSubmit)="guardar()" novalidate>
      @if (error(); as e) {
        <gm-alert tone="error">{{ e }}</gm-alert>
      }
      <div class="gm-form__grid">
        <label class="gm-field">
          <span>Email</span>
          <input class="gm-input" type="email" formControlName="email" maxlength="150" placeholder="nombre@gasmapocho.cl" autocomplete="off"
                 [attr.aria-invalid]="invalido('email')" />
          @if (invalido('email')) { <span class="error">Ingresa un email válido.</span> }
        </label>
        <label class="gm-field">
          <span>Nombre</span>
          <input class="gm-input" type="text" formControlName="nombre" maxlength="100" [attr.aria-invalid]="invalido('nombre')" />
          @if (invalido('nombre')) { <span class="error">El nombre es obligatorio.</span> }
        </label>
      </div>
      <div class="gm-form__grid">
        <label class="gm-field">
          <span>Rol</span>
          <select class="gm-select" formControlName="rol">
            <option value="ALMACEN">ALMACEN · operación del almacén</option>
            <option value="ADMIN">ADMIN · administración completa</option>
          </select>
        </label>
        <label class="gm-field">
          <span>{{ id() ? 'Nueva contraseña' : 'Contraseña' }}</span>
          <input class="gm-input" type="password" formControlName="password" autocomplete="new-password"
                 [placeholder]="id() ? 'Dejar vacío para conservar la actual' : 'Mínimo 8 caracteres'" [attr.aria-invalid]="invalido('password')" />
          @if (invalido('password')) { <span class="error">La contraseña debe tener entre 8 y 72 caracteres.</span> }
        </label>
      </div>
      <div class="gm-form__actions">
        <a gm-button variant="secondary" routerLink="/app/usuarios">Cancelar</a>
        <button gm-button type="submit" [disabled]="enviando()">{{ enviando() ? 'Guardando...' : (id() ? 'Guardar cambios' : 'Crear usuario') }}</button>
      </div>
    </form>
  `,
})
export class UsuarioFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(UsuariosApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly id = signal<number | null>(null);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    rol: ['ALMACEN' as Rol, Validators.required],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(72)]],
  });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id.set(Number(idParam));
      // Al editar, la contraseña es opcional
      this.form.controls.password.setValidators([Validators.minLength(6), Validators.maxLength(72)]);
      this.form.controls.password.updateValueAndValidity();
      this.api.obtener(Number(idParam)).subscribe({
        next: (u) => this.form.patchValue({ email: u.email, nombre: u.nombre, rol: u.rol }),
        error: (err: unknown) => this.error.set(mensajeDeError(err)),
      });
    }
  }

  protected invalido(campo: 'email' | 'nombre' | 'password'): boolean {
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
    const body = { email: v.email.trim(), nombre: v.nombre.trim(), rol: v.rol, password: v.password || undefined };
    const peticion = this.id() ? this.api.actualizar(this.id()!, body) : this.api.crear(body);
    peticion.subscribe({
      next: () => this.router.navigateByUrl('/app/usuarios'),
      error: (err: unknown) => { this.error.set(mensajeDeError(err)); this.enviando.set(false); },
    });
  }
}
