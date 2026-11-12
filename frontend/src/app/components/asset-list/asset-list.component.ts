import { Component, computed, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AssetService } from '../../services/asset.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Asset } from '../../models/asset.model';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { ModalInspectAssetComponent } from '../modal-inspect-asset/modal-inspect-asset.component';
import { ModalEditAssetComponent } from '../modal-edit-asset/modal-edit-asset.component';
import { ModalAddAssetComponent } from '../modal-add-asset/modal-add-asset.component';
import { ModalRequisitionComponent } from '../modal-requisition/modal-requisition.component';
import { DEPARTMENTS } from '../../models/department';

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink,
    StatusBadgeComponent, 
    ModalInspectAssetComponent, 
    ModalEditAssetComponent,
    ModalAddAssetComponent,
    ModalRequisitionComponent
  ],
  templateUrl: './asset-list.component.html',
  styleUrl: './asset-list.component.scss'
})
export class AssetListComponent implements OnInit {
  readonly searchKeyword = signal('');
  readonly selectedStatus = signal('all');
  readonly selectedDepartment = signal('all');

  departmentList = DEPARTMENTS;

  // Modals state
  isInspectModalOpen = false;
  isEditModalOpen = false;
  isAddModalOpen = false;
  isRequisitionModalOpen = false;
  selectedAsset: Asset | null = null;
  previewAsset: Asset | null = null;

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && !target.src.includes('fallback-asset.svg')) {
      target.src = 'fallback-asset.svg';
    }
  }

  filteredAssets = computed(() => {
    let list = this.assetService.scopedAssets();
    const dept = this.selectedDepartment();
    const status = this.selectedStatus();
    const kw = this.searchKeyword().trim().toLowerCase();

    // Department filter (admin only)
    if (this.authService.isAdmin() && dept !== 'all') {
      list = list.filter(a => a.department === dept);
    }

    // Status filter
    if (status !== 'all') {
      list = list.filter(a => a.status === status);
    }

    // Keyword search
    if (kw) {
      list = list.filter(a => 
        (a.name && a.name.toLowerCase().includes(kw)) ||
        (a.brand && a.brand.toLowerCase().includes(kw)) ||
        (a.model && a.model.toLowerCase().includes(kw)) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(kw)) ||
        (a.assetNumber && a.assetNumber.toLowerCase().includes(kw)) ||
        (a.assignedPersonnelName && a.assignedPersonnelName.toLowerCase().includes(kw)) ||
        (a.location && a.location.toLowerCase().includes(kw)) ||
        (a.room && a.room.toLowerCase().includes(kw))
      );
    }

    return list;
  });

  get totalCount() {
    return this.assetService.scopedAssets().length;
  }

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
    public assetService: AssetService,
    public authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.assetService.loadAssets();
  }

  // Keyboard shortcut: Pressing "/" or "Ctrl+K" focuses the search box
  @HostListener('window:keydown', ['$event'])
  onGlobalKeydown(e: KeyboardEvent): void {
    if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
      e.preventDefault();
      const el = document.getElementById('assetSearchInput');
      if (el) el.focus();
    }
  }

  filterByStatus(status: string): void {
    this.selectedStatus.set(this.selectedStatus() === status ? 'all' : status);
    const label = status === 'all' ? 'ทั้งหมด' : status;
    this.toastService.info(`แสดงครุภัณฑ์สถานะ: ${label}`);
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

  deleteAsset(asset: Asset): void {
    if (!this.authService.isAdmin()) return;
    if (confirm(`ยืนยันการลบครุภัณฑ์ "${asset.name}" (${asset.serialNumber}) ออกจากระบบอย่างถาวร?`)) {
      this.assetService.deleteAsset(asset.id).subscribe({
        next: res => {
          if (res.success) {
            this.toastService.success(`ลบครุภัณฑ์ "${asset.name}" สำเร็จ`);
          } else {
            this.toastService.error(res.message || 'ไม่สามารถลบข้อมูลได้');
          }
        },
        error: err => {
          this.toastService.error(err.error?.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
        }
      });
    }
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchKeyword.set(target.value);
  }

  onDepartmentChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedDepartment.set(target.value);
  }

  onStatusChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedStatus.set(target.value);
  }

  clearFilters(): void {
    this.searchKeyword.set('');
    this.selectedStatus.set('all');
    this.selectedDepartment.set('all');
  }

  openInspectModal(asset: Asset): void {
    this.selectedAsset = asset;
    this.isInspectModalOpen = true;
  }

  openEditModal(asset: Asset): void {
    this.selectedAsset = asset;
    this.isEditModalOpen = true;
  }

  openAddModal(): void {
    this.isAddModalOpen = true;
  }

  openRequisitionModal(asset: Asset): void {
    this.selectedAsset = asset;
    this.isRequisitionModalOpen = true;
  }

  onDataRefreshed(): void {
    this.assetService.loadAssets();
  }
}
