import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
import { LucideAngularModule, X } from 'lucide-angular';

/**
 * Dialog based on the native <dialog> element: focus trap, Esc to close and
 * a dimmed backdrop come from the browser for free.
 *
 * <app-modal [open]="isOpen()" title="..." (closed)="isOpen.set(false)">
 *   ...body...
 *   <div modal-footer class="modal-footer">...buttons...</div>
 * </app-modal>
 */
@Component({
  selector: 'app-modal',
  imports: [LucideAngularModule],
  template: `
    <dialog #dialog class="modal" [class.modal-wide]="wide()" (close)="closed.emit()" (click)="onDialogClick($event)">
      <div class="modal-panel">
        <header class="modal-header">
          <div>
            <h2 class="modal-title">{{ title() }}</h2>
            @if (subtitle()) {
              <p class="modal-subtitle">{{ subtitle() }}</p>
            }
          </div>
          <button type="button" class="btn btn-ghost btn-icon btn-sm" (click)="closed.emit()" aria-label="Schließen">
            <lucide-icon [img]="closeIcon" [size]="18" />
          </button>
        </header>
        <div class="modal-body">
          <ng-content />
        </div>
        <ng-content select="[modal-footer]" />
      </div>
    </dialog>
  `
})
export class ModalComponent {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly wide = input(false);
  readonly closed = output<void>();

  protected readonly closeIcon = X;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.open()) {
        if (!dialog.open) dialog.showModal?.();
      } else if (dialog.open) {
        dialog.close();
      }
    });
  }

  // A click on the dimmed backdrop targets the <dialog> element itself.
  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.closed.emit();
    }
  }
}
