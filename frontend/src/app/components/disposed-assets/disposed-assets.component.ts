import { Component, computed, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../../services/asset.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { Asset } from '../../models/asset.model';

@Component({
  selector: 'app-disposed-assets',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: './disposed-assets.component.html',
  styleUrl: './disposed-assets.component.scss'
})
export class DisposedAssetsComponent {
  readonly searchKeyword = signal('');
  previewAsset: Asset | null = null;

  filteredDisposedAssets = computed(() => {
    const list = this.assetService.disposedScopedAssets();
    const kw = this.searchKeyword().trim().toLowerCase();
    if (!kw) return list;

    return list.filter(a => 
      (a.name && a.name.toLowerCase().includes(kw)) ||
      (a.brand && a.brand.toLowerCase().includes(kw)) ||
      (a.model && a.model.toLowerCase().includes(kw)) ||
      (a.serialNumber && a.serialNumber.toLowerCase().includes(kw)) ||
      (a.assetNumber && a.assetNumber.toLowerCase().includes(kw)) ||
      (a.disposedReason && a.disposedReason.toLowerCase().includes(kw))
    );
  });

  constructor(
    public assetService: AssetService,
    public authService: AuthService,
    private toastService: ToastService
  ) {}

  @HostListener('window:keydown', ['$event'])
  onGlobalKeydown(e: KeyboardEvent): void {
    if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
      e.preventDefault();
      const el = document.getElementById('disposedSearchInput');
      if (el) el.focus();
    }
  }

  copySerialNumber(serial: string, event: Event): void {
    event.stopPropagation();
    if (!serial) return;
    navigator.clipboard.writeText(serial).then(() => {
      this.toastService.success(`คัดลอก Serial No. "${serial}" แล้ว`);
    });
  }

  openPreview(asset: Asset, event: Event): void {
    event.stopPropagation();
    this.previewAsset = asset;
  }

  closePreview(): void {
    this.previewAsset = null;
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchKeyword.set(target.value);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && !target.src.includes('fallback-asset.svg')) {
      target.src = 'fallback-asset.svg';
    }
  }
}
