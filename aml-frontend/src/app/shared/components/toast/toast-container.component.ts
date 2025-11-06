import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.css']
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
