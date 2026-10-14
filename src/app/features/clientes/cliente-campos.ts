import { Component, input } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export type ClienteGroup = FormGroup<{
  nombre: FormControl<string>;
  rut: FormControl<string>;
  direccion: FormControl<string>;
  telefono: FormControl<string>;
}>;

/** Grupo de formulario con los datos de un cliente, todo en blanco. Lo comparten el CRUD y la venta. */
export function crearGrupoCliente(fb: FormBuilder): ClienteGroup {
  return fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    rut: ['', [Validators.required, Validators.maxLength(15)]],
    direccion: ['', [Validators.required, Validators.maxLength(150)]],
    telefono: ['', [Validators.required, Validators.maxLength(20)]],
  });
}

/** Los cuatro campos de un cliente. Si el grupo está deshabilitado se muestran de solo lectura. */
@Component({
  selector: 'gm-cliente-campos',
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
          <input class="gm-input" type="text" formControlName="rut" maxlength="15" placeholder="12.345.678-5" [attr.aria-invalid]="invalido('rut')" />
          @if (invalido('rut')) { <span class="error">El RUT es obligatorio.</span> }
        </label>
      </div>
      <div class="gm-form__grid">
        <label class="gm-field">
          <span>Teléfono</span>
          <input class="gm-input" type="text" formControlName="telefono" maxlength="20" placeholder="+56 9 1234 5678" [attr.aria-invalid]="invalido('telefono')" />
          @if (invalido('telefono')) { <span class="error">El teléfono es obligatorio.</span> }
        </label>
        <label class="gm-field">
          <span>Dirección de entrega</span>
          <input class="gm-input" type="text" formControlName="direccion" maxlength="150" [attr.aria-invalid]="invalido('direccion')" />
          @if (invalido('direccion')) { <span class="error">La dirección es obligatoria.</span> }
        </label>
      </div>
    </div>
  `,
  styles: `
    .campos { display: grid; gap: var(--gm-space-4); }
  `,
})
export class ClienteCampos {
  readonly group = input.required<ClienteGroup>();

  protected invalido(campo: keyof ClienteGroup['controls']): boolean {
    const c = this.group().controls[campo];
    return c.touched && c.invalid;
  }
}
