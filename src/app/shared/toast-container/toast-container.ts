import { Component, inject } from '@angular/core';
import { CircleAlert, CircleCheck, Info, LucideAngularModule, X } from 'lucide-angular';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [LucideAngularModule],
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div [class]="'toast toast-' + toast.kind" role="status">
          <lucide-icon [img]="icons[toast.kind]" [size]="18" />
          <span class="toast-message">{{ toast.message }}</span>
          <button type="button" class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Schließen">
            <lucide-icon [img]="closeIcon" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: min(380px, calc(100vw - 40px));
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: var(--radius);
      background: var(--text);
      color: var(--bg);
      box-shadow: var(--shadow-lg);
      font-size: 0.9rem;
      font-weight: 500;
      animation: toast-in 0.25s var(--ease);
    }
    .toast-success lucide-icon:first-child { color: var(--green); }
    .toast-error lucide-icon:first-child { color: var(--red); }
    .toast-info lucide-icon:first-child { color: var(--honey); }
    .toast-message { flex: 1; }
    .toast-close {
      border: 0;
      background: transparent;
      color: inherit;
      opacity: 0.6;
      cursor: pointer;
      display: inline-flex;
      padding: 4px;
      border-radius: 6px;
      &:hover { opacity: 1; }
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: none; }
    }
  `
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
  protected readonly closeIcon = X;
  protected readonly icons = { success: CircleCheck, error: CircleAlert, info: Info };
}
