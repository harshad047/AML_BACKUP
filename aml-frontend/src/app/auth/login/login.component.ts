import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('captchaCanvas', { static: false }) captchaCanvas!: ElementRef<HTMLCanvasElement>;
  
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  
  // Captcha properties
  captchaText = '';
  captchaInput = '';
  captchaError = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.generateCaptcha();
  }

  ngAfterViewInit(): void {
    this.drawCaptcha();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      captcha: ['', [Validators.required]]
    });
  }

  generateCaptcha(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.captchaText = captcha;
    this.captchaError = false;
    this.loginForm.patchValue({ captcha: '' });
    
    // Redraw captcha if canvas is available
    setTimeout(() => {
      if (this.captchaCanvas) {
        this.drawCaptcha();
      }
    }, 0);
  }

  drawCaptcha(): void {
    if (!this.captchaCanvas) return;
    
    const canvas = this.captchaCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 180;
    canvas.height = 60;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background with gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f0f4f8');
    gradient.addColorStop(0.5, '#e8eef5');
    gradient.addColorStop(1, '#dce4ec');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise lines
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100}, 0.3)`;
      ctx.lineWidth = Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Add noise dots
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 150}, ${Math.random() * 150}, ${Math.random() * 150}, 0.4)`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Draw captcha text with distortion
    const text = this.captchaText;
    const startX = 15;
    const baseY = 40;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const x = startX + i * 25;
      const y = baseY + (Math.random() - 0.5) * 8;
      const rotation = (Math.random() - 0.5) * 0.4;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      // Random font size between 24-28
      const fontSize = 24 + Math.random() * 4;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      
      // Random color (dark shades)
      const colors = ['#2c3e50', '#34495e', '#1a252f', '#16a085', '#2980b9'];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      
      // Add text shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }

    // Add interference lines on top
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100}, 0.5)`;
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.bezierCurveTo(
        Math.random() * canvas.width, Math.random() * canvas.height,
        Math.random() * canvas.width, Math.random() * canvas.height,
        Math.random() * canvas.width, Math.random() * canvas.height
      );
      ctx.stroke();
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      // Validate captcha first
      const captchaValue = this.loginForm.get('captcha')?.value;
      if (captchaValue !== this.captchaText) {
        this.captchaError = true;
        this.toastService.error('Invalid captcha. Please try again.');
        this.generateCaptcha();
        return;
      }

      this.isLoading = true;
      this.errorMessage = '';
      this.captchaError = false;

      const credentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      // Authenticate user credentials
      this.authService.login(credentials).subscribe({
        next: (response) => {
          const user = response?.user;
          if (user) {
            // Navigate immediately for better UX - don't wait for isLoading
            const route = this.getRouteForRole(user.role);
            this.router.navigate([route]).then(() => {
              this.isLoading = false;
            });
          } else {
            this.isLoading = false;
            this.toastService.error('Login succeeded but user data is missing.');
            this.generateCaptcha();
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.toastService.error(error.error?.message || 'Login failed. Please try again.', 5000);
          this.generateCaptcha();
          console.error('Login error:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private getRouteForRole(role: string): string {
    switch (role) {
      case 'CUSTOMER':
        return '/customer';
      case 'OFFICER':
        return '/compliance';
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return '/admin';
      default:
        return '/';
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
