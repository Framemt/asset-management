import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username = '';
  password = '';
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  isCapsLockOn = false;

  get greeting(): string {
    const hr = new Date().getHours();
    if (hr < 12) return 'สวัสดีตอนเช้า';
    if (hr < 17) return 'สวัสดีตอนบ่าย';
    return 'สวัสดีตอนเย็น';
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  checkCapsLock(event: KeyboardEvent): void {
    this.isCapsLockOn = event.getModifierState && event.getModifierState('CapsLock');
  }

  onSubmit(e: Event): void {
    e.preventDefault();
    if (!this.username.trim() || !this.password) {
      this.errorMessage = 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login(this.username.trim(), this.password).subscribe({
      next: res => {
        this.isLoading = false;
        if (res.success) {
          this.router.navigate(['/assets']);
        } else {
          this.errorMessage = res.message || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง';
        }
      },
      error: err => {
        this.isLoading = false;
        if (err.status === 403) {
          this.errorMessage = err.error?.message || 'บัญชีนี้ถูกระงับสิทธิ์การใช้งาน (Inactive)';
        } else if (err.status === 401) {
          this.errorMessage = err.error?.message || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง';
        } else if (err.status === 0) {
          this.errorMessage = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อระบบ';
        } else {
          this.errorMessage = err.error?.message || 'การเข้าสู่ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง';
        }
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
