import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toasts" 
           class="toast-item"
           [class.toast-success]="toast.type === 'success'"
           [class.toast-error]="toast.type === 'error'"
           [class.toast-info]="toast.type === 'info'"
           [class.toast-warning]="toast.type === 'warning'"
           [class.toast-removing]="removingToasts.has(toast.id)">
        <div class="toast-content">
          <div class="toast-icon-wrapper">
            <i class="fas toast-icon" 
               [class.fa-check-circle]="toast.type === 'success'"
               [class.fa-exclamation-circle]="toast.type === 'error'"
               [class.fa-info-circle]="toast.type === 'info'"
               [class.fa-exclamation-triangle]="toast.type === 'warning'"></i>
          </div>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
        <button class="toast-close" (click)="removeToast(toast.id)" aria-label="Close" title="Close">
          <i class="fas fa-times"></i>
        </button>
        <div class="toast-progress" *ngIf="toast.duration && toast.duration > 0"></div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 420px;
      pointer-events: none;
    }

    .toast-item {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-radius: 0.75rem;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
      animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      min-width: 320px;
      backdrop-filter: blur(10px);
      overflow: hidden;
      pointer-events: all;
      transform-origin: right center;
      transition: all 0.3s ease;
    }

    .toast-item:hover {
      transform: translateX(-5px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.15);
    }

    .toast-removing {
      animation: slideOutRight 0.3s ease-in forwards;
    }

    .toast-content {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      flex: 1;
      min-width: 0;
    }

    .toast-icon-wrapper {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      animation: iconPulse 0.5s ease-out;
    }

    .toast-icon {
      font-size: 1.25rem;
      animation: iconScale 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    .toast-message {
      font-size: 0.95rem;
      font-weight: 500;
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .toast-close {
      flex-shrink: 0;
      background: rgba(0, 0, 0, 0.1);
      border: none;
      color: inherit;
      opacity: 0.8;
      cursor: pointer;
      padding: 0.375rem;
      margin-left: 0.75rem;
      transition: all 0.2s ease;
      font-size: 0.875rem;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast-close:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.2);
      transform: rotate(90deg) scale(1.1);
    }

    .toast-close:active {
      transform: rotate(90deg) scale(0.95);
    }

    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: rgba(255, 255, 255, 0.4);
      animation: progressBar 6s linear forwards;
      border-radius: 0 0 0 0.75rem;
    }

    /* Success Toast */
    .toast-success {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
    }

    /* Error Toast */
    .toast-error {
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
      color: white;
    }

    /* Info Toast */
    .toast-info {
      background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
      color: white;
    }

    /* Warning Toast */
    .toast-warning {
      background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
      color: #000;
    }

    @keyframes slideInRight {
      0% {
        transform: translateX(450px) scale(0.8);
        opacity: 0;
      }
      60% {
        transform: translateX(-10px) scale(1.02);
        opacity: 1;
      }
      100% {
        transform: translateX(0) scale(1);
        opacity: 1;
      }
    }

    @keyframes slideOutRight {
      0% {
        transform: translateX(0) scale(1);
        opacity: 1;
      }
      100% {
        transform: translateX(450px) scale(0.8);
        opacity: 0;
      }
    }

    @keyframes iconPulse {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes iconScale {
      0% {
        transform: scale(0) rotate(-180deg);
      }
      60% {
        transform: scale(1.2) rotate(10deg);
      }
      100% {
        transform: scale(1) rotate(0deg);
      }
    }

    @keyframes progressBar {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }

    @media (max-width: 576px) {
      .toast-container {
        right: 10px;
        left: 10px;
        max-width: none;
        top: 70px;
      }

      .toast-item {
        min-width: auto;
      }
    }
  `]
})
export class ToastContainerComponent implements OnInit {
  toasts: Toast[] = [];
  removingToasts = new Set<number>();

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.getToasts().subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  removeToast(id: number): void {
    // Add to removing set to trigger animation
    this.removingToasts.add(id);
    
    // Wait for animation to complete before actually removing
    setTimeout(() => {
      this.toastService.remove(id);
      this.removingToasts.delete(id);
    }, 300);
  }
}
