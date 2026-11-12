import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1090;">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="toast show align-items-center border-0 shadow-lg mb-2 rounded-4 overflow-hidden animate-slide-in"
          [ngClass]="getToastClass(toast.type)"
          role="alert" 
          aria-live="assertive" 
          aria-atomic="true">
          <div class="d-flex align-items-center p-3 text-white">
            <i class="bi fs-5 me-2 flex-shrink-0" [ngClass]="toast.icon"></i>
            <div class="toast-body p-0 flex-grow-1 fw-medium" style="font-size: 0.86rem;">
              {{ toast.message }}
            </div>
            <button 
              type="button" 
              class="btn-close btn-close-white ms-2 me-0" 
              (click)="toastService.dismiss(toast.id)" 
              aria-label="Close">
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      min-width: 280px;
      max-width: 420px;
      backdrop-filter: blur(8px);
      transition: all 0.25s ease-in-out;
    }
    .animate-slide-in {
      animation: slideInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes slideInDown {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}

  getToastClass(type: string): string {
    switch (type) {
      case 'success': return 'bg-success text-white';
      case 'error': return 'bg-danger text-white';
      case 'warning': return 'bg-warning text-dark';
      case 'info': default: return 'bg-dark text-white';
    }
  }
}
