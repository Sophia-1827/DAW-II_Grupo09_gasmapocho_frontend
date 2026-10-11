import { Component, booleanAttribute, input } from '@angular/core';

/**
 * Botón del sistema. Se aplica como atributo sobre <button> o <a> para no perder
 * semántica ni routerLink. Variantes nombradas por jerarquía, no por color.
 *  - primary: la acción principal de la pantalla (una por pantalla).
 *  - secondary: acciones de apoyo, contorno.
 *  - ghost: acciones de bajo peso (header, enlaces de tabla).
 *  - icon / icon-danger: acciones por fila (editar / eliminar), solo ícono.
 */
@Component({
  selector: 'button[gm-button], a[gm-button]',
  template: '<ng-content />',
  styleUrl: './button.scss',
  host: {
    class: 'gm-btn',
    '[class.gm-btn--primary]': 'variant() === "primary"',
    '[class.gm-btn--secondary]': 'variant() === "secondary"',
    '[class.gm-btn--ghost]': 'variant() === "ghost"',
    '[class.gm-btn--icon]': 'variant() === "icon" || variant() === "icon-danger"',
    '[class.gm-btn--icon-danger]': 'variant() === "icon-danger"',
    '[class.gm-btn--block]': 'block()',
  },
})
export class Button {
  readonly variant = input<'primary' | 'secondary' | 'ghost' | 'icon' | 'icon-danger'>('primary');
  readonly block = input(false, { transform: booleanAttribute });
}
