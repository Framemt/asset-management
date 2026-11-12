import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetService } from '../../services/asset.service';
import { ToastService } from '../../services/toast.service';
import { DEPARTMENTS } from '../../models/department';

@Component({
  selector: 'app-modal-add-asset',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-add-asset.component.html',
  styleUrl: './modal-add-asset.component.scss'
})
export class ModalAddAssetComponent {
  @Input() isOpen = false;
  @Output() closeEvent = new EventEmitter<void>();
  @Output() closed = this.closeEvent;
  @Output() addedEvent = new EventEmitter<void>();
  @Output() assetAdded = this.addedEvent;

  name = '';
  brand = '';
  model = '';
  serialNumber = '';
  imageUrl = '';
  isUploading = false;
  uploadedFileName = '';
  department = DEPARTMENTS[0];
  location = 'คลังพัสดุสถาบันคอมพิวเตอร์ ม.รามคำแหง';
  isDuplicate = false;
  errorMessage = '';

  departmentList = DEPARTMENTS;
  defaultImage = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80';

  presetImages = {
    pc: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop&q=80',
    laptop: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=80',
    printer: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=80'
  };

  constructor(
    private assetService: AssetService,
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
    this.uploadedFileName = file.name;
    this.errorMessage = '';

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const rawBase64 = e.target.result as string;
      this.compressImage(rawBase64, 800, 0.85).then(compressedBase64 => {
        this.imageUrl = compressedBase64;
        this.isUploading = false;
        // Also send to backend backup
        this.assetService.uploadImage(compressedBase64, file.name).subscribe();
      }).catch(() => {
        this.imageUrl = rawBase64;
        this.isUploading = false;
      });
    };
    reader.onerror = () => {
      this.isUploading = false;
      this.errorMessage = 'ไม่สามารถอ่านไฟล์รูปภาพได้';
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imageUrl = '';
    this.uploadedFileName = '';
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

  checkSerial(): void {
    const s = this.serialNumber.trim();
    if (!s) {
      this.isDuplicate = false;
      this.errorMessage = '';
      return;
    }

    this.assetService.checkSerialDuplicate(s).subscribe({
      next: res => {
        this.isDuplicate = res.isDuplicate;
        if (this.isDuplicate) {
          this.errorMessage = `Serial Number "${s}" ซ้ำในระบบ Express DB!`;
        } else {
          this.errorMessage = '';
        }
      }
    });
  }

  close(): void {
    this.closeEvent.emit();
    this.resetForm();
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

  resetForm(): void {
    this.name = '';
    this.brand = '';
    this.model = '';
    this.serialNumber = '';
    this.imageUrl = '';
    this.uploadedFileName = '';
    this.isUploading = false;
    this.isDuplicate = false;
    this.errorMessage = '';
  }

  saveNewAsset(): void {
    if (!this.name.trim() || !this.brand.trim() || !this.model.trim() || !this.serialNumber.trim()) {
      this.errorMessage = 'กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน';
      return;
    }

    this.assetService.addAsset({
      name: this.name,
      brand: this.brand,
      model: this.model,
      serialNumber: this.serialNumber,
      image: this.imageUrl || this.defaultImage,
      department: this.department,
      location: this.location
    }).subscribe({
      next: res => {
        if (res.success) {
          this.toastService.success(`เพิ่มครุภัณฑ์ "${this.name}" เข้าสู่ระบบเรียบร้อยแล้ว`);
          this.addedEvent.emit();
          this.close();
        } else {
          this.errorMessage = res.message;
          this.toastService.error(res.message || 'ไม่สามารถเพิ่มครุภัณฑ์ได้');
        }
      },
      error: err => {
        this.errorMessage = err.error?.message || 'ไม่สามารถเพิ่มครุภัณฑ์ได้';
      }
    });
  }
}
