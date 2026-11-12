import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Asset, AssetStatus } from '../../models/asset.model';
import { AssetService } from '../../services/asset.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-modal-inspect-asset',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-inspect-asset.component.html',
  styleUrl: './modal-inspect-asset.component.scss'
})
export class ModalInspectAssetComponent {
  @Input() isOpen = false;
  @Input() asset: Asset | null = null;
  @Output() closeEvent = new EventEmitter<void>();
  @Output() closed = this.closeEvent;
  @Output() updatedEvent = new EventEmitter<void>();
  @Output() statusUpdated = this.updatedEvent;

  selectedStatus: AssetStatus = 'ใช้งาน';
  inspectionNotes = '';
  disposedReason = '';
  errorMessage = '';

  constructor(
    private assetService: AssetService,
    private toastService: ToastService
  ) {}

  ngOnChanges(): void {
    if (this.asset) {
      this.selectedStatus = this.asset.status;
      this.inspectionNotes = '';
      this.disposedReason = this.asset.disposedReason || '';
      this.errorMessage = '';
    }
  }

  close(): void {
    this.closeEvent.emit();
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && !target.src.includes('fallback-asset.svg')) {
      target.src = 'fallback-asset.svg';
    }
  }

  saveInspection(): void {
    if (!this.asset) return;

    if (this.selectedStatus === 'จำหน่าย' && !this.disposedReason.trim()) {
      this.errorMessage = 'กรุณาระบุเหตุผลในการจำหน่ายครุภัณฑ์';
      return;
    }

    this.assetService.verifyStatus(
      this.asset.id,
      this.selectedStatus,
      this.inspectionNotes,
      this.disposedReason
    ).subscribe({
      next: res => {
        if (res.success) {
          this.toastService.success(`อัปเดตสถานะเป็น "${this.selectedStatus}" เรียบร้อย`);
          this.updatedEvent.emit();
          this.close();
        } else {
          this.errorMessage = res.message;
          this.toastService.error(res.message || 'ไม่สามารถบันทึกสถานะได้');
        }
      },
      error: err => {
        this.errorMessage = err.error?.message || 'ไม่สามารถบันทึกสถานะได้';
        this.toastService.error(this.errorMessage);
      }
    });
  }
}
