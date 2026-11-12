import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Asset } from '../../models/asset.model';
import { AssetService } from '../../services/asset.service';
import { PersonnelService } from '../../services/personnel.service';
import { ToastService } from '../../services/toast.service';
import { DEPARTMENTS } from '../../models/department';

@Component({
  selector: 'app-modal-edit-asset',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-edit-asset.component.html',
  styleUrl: './modal-edit-asset.component.scss'
})
export class ModalEditAssetComponent {
  @Input() isOpen = false;
  @Input() asset: Asset | null = null;
  @Output() closeEvent = new EventEmitter<void>();
  @Output() closed = this.closeEvent;
  @Output() updatedEvent = new EventEmitter<void>();
  @Output() assetUpdated = this.updatedEvent;

  editForm: Partial<Asset> | null = null;
  isUploading = false;
  errorMessage = '';
  departmentList = DEPARTMENTS;

  get activePersonnelList() {
    return this.personnelService.activePersonnel();
  }

  constructor(
    private assetService: AssetService,
    private personnelService: PersonnelService,
    private toastService: ToastService
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP, GIF)';
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const rawBase64 = e.target.result as string;
      this.compressImage(rawBase64, 800, 0.85).then(compressedBase64 => {
        if (this.editForm) {
          this.editForm.image = compressedBase64;
        }
        this.isUploading = false;
        this.assetService.uploadImage(compressedBase64, file.name).subscribe();
      }).catch(() => {
        if (this.editForm) {
          this.editForm.image = rawBase64;
        }
        this.isUploading = false;
      });
    };
    reader.onerror = () => {
      this.isUploading = false;
      this.errorMessage = 'ไม่สามารถอ่านไฟล์รูปภาพได้';
    };
    reader.readAsDataURL(file);
  }

  private compressImage(dataUrl: string, maxDim: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  ngOnChanges(): void {
    if (this.asset) {
      this.editForm = { ...this.asset };
      this.errorMessage = '';
    }
  }

  onSelectPersonnel(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const pId = select.value;
    if (!pId) return;

    const person = this.activePersonnelList.find(p => p.id === pId);
    if (person && this.editForm) {
      this.editForm.assignedPersonnelId = person.id;
      this.editForm.assignedPersonnelName = person.name;
      this.editForm.department = person.department;
      this.editForm.room = 'ห้อง ' + person.room;
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

  saveChanges(): void {
    if (!this.asset || !this.editForm) return;

    if (!this.editForm.name?.trim() || !this.editForm.brand?.trim() || !this.editForm.serialNumber?.trim()) {
      this.errorMessage = 'กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน';
      return;
    }

    this.assetService.updateAsset(this.asset.id, this.editForm).subscribe({
      next: res => {
        if (res.success) {
          this.toastService.success(`บันทึกการแก้ไข "${this.editForm?.name}" สำเร็จ`);
          this.updatedEvent.emit();
          this.close();
        } else {
          this.errorMessage = res.message;
          this.toastService.error(res.message || 'ไม่สามารถบันทึกข้อมูลได้');
        }
      },
      error: err => {
        this.errorMessage = err.error?.message || 'ไม่สามารถบันทึกข้อมูลได้';
      }
    });
  }
}
