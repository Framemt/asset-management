import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AssetService } from '../../services/asset.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  todayThaiDate = '';
  readonly currentTime = signal('');
  private timer: any;

  get currentUser() {
    return this.authService.currentUser();
  }

  constructor(
    public authService: AuthService,
    private assetService: AssetService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.updateClock();
    this.timer = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private updateClock(): void {
    const now = new Date();
    const monthsThai = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const daysThai = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    const dayName = daysThai[now.getDay()];
    const date = now.getDate();
    const month = monthsThai[now.getMonth()];
    const year = now.getFullYear() + 543;
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    this.todayThaiDate = `${dayName} ${date} ${month} ${year}`;
    this.currentTime.set(`${hours}:${minutes}:${seconds}`);
  }

  refreshData(): void {
    this.assetService.loadAssets();
    this.toastService.success('รีเฟรชข้อมูลเชื่อมต่อ MySQL ล่าสุดสำเร็จ');
  }

  logout(): void {
    if (confirm('ยืนยันการออกจากระบบบริหารจัดการครุภัณฑ์?')) {
      this.authService.logout();
    }
  }

  onAvatarError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && !target.src.includes('fallback-avatar.svg')) {
      target.src = 'fallback-avatar.svg';
    }
  }
}
