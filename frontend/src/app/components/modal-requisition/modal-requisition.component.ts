import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Asset } from '../../models/asset.model';
import { Personnel } from '../../models/personnel.model';
import { AssetService } from '../../services/asset.service';
import { PersonnelService } from '../../services/personnel.service';

@Component({
  selector: 'app-modal-requisition',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-requisition.component.html',
  styleUrl: './modal-requisition.component.scss'
})
export class ModalRequisitionComponent {
  @Input() isOpen = false;
  @Input() asset: Asset | null = null;
  @Output() closeEvent = new EventEmitter<void>();
  @Output() closed = this.closeEvent;
  @Output() completedEvent = new EventEmitter<void>();
  @Output() requisitionDone = this.completedEvent;

  selectedPersonnel: Personnel | null = null;
  searchPersonnelKeyword = '';
  filteredPersonnel: Personnel[] = [];

  assetNumber = '';
  location = 'อาคารสถาบันคอมพิวเตอร์ ม.รามคำแหง';
  room = 'ห้อง 302';
  errorMessage = '';

  constructor(
    private assetService: AssetService,
    private personnelService: PersonnelService
  ) {}

  ngOnChanges(): void {
    if (this.isOpen && this.asset) {
      this.filteredPersonnel = this.personnelService.activePersonnel();
      this.selectedPersonnel = null;
      this.searchPersonnelKeyword = '';
      this.assetNumber = this.asset.assetNumber || this.getRandomAssetNumber();
      this.location = this.asset.location || 'อาคารศูนย์สารสนเทศ';
      this.room = this.asset.room || 'ห้อง 402';
      this.errorMessage = '';
    }
  }

  filterPersonnel(): void {
    const kw = this.searchPersonnelKeyword.trim().toLowerCase();
    const list = this.personnelService.activePersonnel();
    if (!kw) {
      this.filteredPersonnel = list;
    } else {
      this.filteredPersonnel = list.filter(p => 
        p.name.toLowerCase().includes(kw) ||
        p.position.toLowerCase().includes(kw) ||
        p.department.toLowerCase().includes(kw) ||
        p.room.toLowerCase().includes(kw)
      );
    }
  }

  selectPersonnel(person: Personnel): void {
    this.selectedPersonnel = person;
    this.room = person.room;
    this.location = 'อาคารสถาบันคอมพิวเตอร์ ม.รามคำแหง';
  }

  generateAssetNumber(): void {
    this.assetNumber = this.getRandomAssetNumber();
  }

  private getRandomAssetNumber(): string {
    const year = '67';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    return `มร.สค.6601-001-${randNum}/${year}`;
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

  submitRequisition(): void {
    if (!this.asset || !this.selectedPersonnel) {
      this.errorMessage = 'กรุณาเลือกเจ้าหน้าที่ผู้เบิก';
      return;
    }

    if (!this.assetNumber.trim()) {
      this.errorMessage = 'กรุณาระบุเลขครุภัณฑ์';
      return;
    }

    this.assetService.requisitionAsset(this.asset.id, {
      assignedPersonnelId: this.selectedPersonnel.id,
      assignedPersonnelName: this.selectedPersonnel.name,
      department: this.selectedPersonnel.department,
      assetNumber: this.assetNumber,
      location: this.location,
      room: this.room
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.completedEvent.emit();
          this.close();
        } else {
          this.errorMessage = res.message;
        }
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message || 'ไม่สามารถเบิกครุภัณฑ์ได้';
      }
    });
  }
}
