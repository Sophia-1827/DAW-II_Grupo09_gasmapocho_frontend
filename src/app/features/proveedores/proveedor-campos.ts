import { Component, input } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export type ProveedorGroup = FormGroup<{
  nombre: FormControl<string>;
  rut: FormControl<string>;
  telefono: FormControl<string>;
  direccion: FormControl<string>;
  region: FormControl<string>;
}>;

/** Grupo de formulario con los datos de un proveedor, todo en blanco. Lo comparten el CRUD y la compra. */
export function crearGrupoProveedor(fb: FormBuilder): ProveedorGroup {
  return fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    rut: ['', [Validators.required, Validators.maxLength(15)]],
    telefono: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(/^\+?[0-9 ]{7,20}$/)]],
    direccion: ['', [Validators.required, Validators.maxLength(150)]],
    region: ['', [Validators.required, Validators.maxLength(60)]],
  });
}

const REGIONES = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso', 'Región Metropolitana',
  "O'Higgins", 'Maule', 'Ñuble', 'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes',
];

/** Los cinco campos de un proveedor. Si el grupo está deshabilitado se muestran de solo lectura. */
@Component({
  selector: 'gm-proveedor-campos',
  imports: [ReactiveFormsModule],
  template: `
    <div class="campos" [formGroup]="group()">
      <div class="gm-form__grid">
        <label class="gm-field">
          <span>Nombre</span>
          <input class="gm-input" type="text" formControlName="nombre" maxlength="100" [attr.aria-invalid]="invalido('nombre')" />
          @if (invalido('nombre')) { <span class="error">El nombre es obligatorio.</span> }
        </label>
        <label class="gm-field">
          <span>RUT</span>
          <input class="gm-input" type="text" formControlName="rut" maxlength="15" placeholder="76.123.456-7" [attr.aria-invalid]="invalido('rut')" />
          @if (invalido('rut')) { <span class="error">El RUT es obligatorio.</span> }
        </label>
      </div>
      <div class="gm-form__grid">
        <label class="gm-field">
          <span>Teléfono</span>
          <input class="gm-input" type="text" formControlName="telefono" maxlength="20" placeholder="+56 2 2345 6789" [attr.aria-invalid]="invalido('telefono')" />
          @if (invalido('telefono')) { <span class="error">{{ group().controls.telefono.hasError('required') ? 'El teléfono es obligatorio.' : 'Solo se permiten números, espacios y +.' }}</span> }
        </label>
        <label class="gm-field">
          <span>Región</span>
          <input class="gm-input" type="text" formControlName="region" maxlength="60" list="gm-regiones" [attr.aria-invalid]="invalido('region')" />
          <datalist id="gm-regiones">
            @for (r of regiones; track r) { <option [value]="r"></option> }
          </datalist>
          @if (invalido('region')) { <span class="error">La región es obligatoria.</span> }
        </label>
      </div>
      <label class="gm-field">
        <span>Dirección</span>
        <input class="gm-input" type="text" formControlName="direccion" maxlength="150" [attr.aria-invalid]="invalido('direccion')" />
        @if (invalido('direccion')) { <span class="error">La dirección es obligatoria.</span> }
      </label>
    </div>
  `,
  styles: `
    .campos { display: grid; gap: var(--gm-space-4); }
  `,
})
export class ProveedorCampos {
  readonly group = input.required<ProveedorGroup>();
  protected readonly regiones = REGIONES;

  protected invalido(campo: keyof ProveedorGroup['controls']): boolean {
    const c = this.group().controls[campo];
    return c.touched && c.invalid;
  }
}
