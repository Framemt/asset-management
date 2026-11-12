import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AssetService } from '../../services/asset.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  get inUseCount() {
    return this.assetService.scopedAssets().filter(a => a.status === 'ใช้งาน').length;
  }

  get damagedCount() {
    return this.assetService.scopedAssets().filter(a => a.status === 'ชำรุด').length;
  }

  get disposedCount() {
    return this.assetService.scopedAssets().filter(a => a.status === 'จำหน่าย').length;
  }

  constructor(
    public authService: AuthService,
    public assetService: AssetService
  ) {}
}
