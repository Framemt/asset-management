import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Personnel } from '../../models/personnel.model';
import { PersonnelService } from '../../services/personnel.service';
import { ToastService } from '../../services/toast.service';
import { DEPARTMENTS } from '../../models/department';

@Component({
  selector: 'app-modal-personnel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-personnel.component.html',
  styleUrl: './modal-personnel.component.scss'
})
export class ModalPersonnelComponent {
  @Input() isOpen = false;
  @Input() personnel: Personnel | null = null;
  @Output() closeEvent = new EventEmitter<void>();
  @Output() closed = this.closeEvent;
  @Output() savedEvent = new EventEmitter<void>();
  @Output() saved = this.savedEvent;

  name = '';
  position = '';
  room = '';
  floor = 'ชั้น 1';
  department = DEPARTMENTS[0];
  errorMessage = '';

  departmentList = DEPARTMENTS;

  get isEditMode(): boolean {
    return this.personnel !== null;
  }

  constructor(
    private personnelService: PersonnelService,
    private toastService: ToastService
  ) {}

  ngOnChanges(): void {
    if (this.personnel) {
      this.name = this.personnel.name;
      this.position = this.personnel.position;
      this.room = this.personnel.room;
      this.floor = this.personnel.floor;
      this.department = this.personnel.department;
    } else {
      this.name = '';
      this.position = '';
      this.room = '';
      this.floor = 'ชั้น 1';
      this.department = DEPARTMENTS[0];
    }
    this.errorMessage = '';
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

  save(): void {
    if (!this.name.trim() || !this.position.trim() || !this.room.trim() || !this.floor.trim()) {
      this.errorMessage = 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง';
      return;
    }

    if (this.isEditMode && this.personnel) {
      this.personnelService.updatePersonnel(this.personnel.id, {
        name: this.name.trim(),
        position: this.position.trim(),
        room: this.room.trim(),
        floor: this.floor.trim(),
        department: this.department
      }).subscribe({
        next: () => {
          this.toastService.success(`แก้ไขข้อมูล "${this.name}" เรียบร้อยแล้ว`);
          this.savedEvent.emit();
          this.close();
        },
        error: err => {
          this.errorMessage = err.error?.message || 'ไม่สามารถแก้ไขได้';
          this.toastService.error(this.errorMessage);
        }
      });
    } else {
      this.personnelService.addPersonnel({
        name: this.name.trim(),
        position: this.position.trim(),
        room: this.room.trim(),
        floor: this.floor.trim(),
        department: this.department
      }).subscribe({
        next: () => {
          this.toastService.success(`เพิ่มข้อมูล "${this.name}" เข้าสู่ระบบเรียบร้อยแล้ว`);
          this.savedEvent.emit();
          this.close();
        },
        error: err => {
          this.errorMessage = err.error?.message || 'ไม่สามารถเพิ่มบุคลากรได้';
          this.toastService.error(this.errorMessage);
        }
      });
    }
  }
}
