import { Component, computed, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PersonnelService } from '../../services/personnel.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Personnel } from '../../models/personnel.model';
import { ModalPersonnelComponent } from '../modal-personnel/modal-personnel.component';
import { DEPARTMENTS } from '../../models/department';

@Component({
  selector: 'app-personnel-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalPersonnelComponent],
  templateUrl: './personnel-list.component.html',
  styleUrl: './personnel-list.component.scss'
})
export class PersonnelListComponent implements OnInit {
  readonly searchKeyword = signal('');
  readonly showDeleted = signal(false);
  readonly selectedDepartment = signal('all');
  readonly viewMode = signal<'table' | 'cards'>('table');

  departmentList = DEPARTMENTS;

  isPersonnelModalOpen = false;
  selectedPersonnel: Personnel | null = null;

  displayedPersonnel = computed(() => {
    let list = this.showDeleted() 
      ? this.personnelService.deletedPersonnel() 
      : this.personnelService.activePersonnel();

    const dept = this.selectedDepartment();
    if (dept !== 'all') {
      list = list.filter(p => p.department === dept);
    }

    const kw = this.searchKeyword().trim().toLowerCase();
    if (!kw) return list;

    return list.filter(p => 
      (p.name && p.name.toLowerCase().includes(kw)) ||
      (p.position && p.position.toLowerCase().includes(kw)) ||
      (p.room && p.room.toLowerCase().includes(kw)) ||
      (p.floor && p.floor.toLowerCase().includes(kw)) ||
      (p.department && p.department.toLowerCase().includes(kw))
    );
  });

  constructor(
    public personnelService: PersonnelService,
    public authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.personnelService.loadPersonnel(true);
  }

  @HostListener('window:keydown', ['$event'])
  onGlobalKeydown(e: KeyboardEvent): void {
    if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
      e.preventDefault();
      const el = document.getElementById('personnelSearchInput');
      if (el) el.focus();
    }
  }

  filterByDepartment(dept: string): void {
    this.selectedDepartment.set(dept);
  }

  toggleViewMode(mode: 'table' | 'cards'): void {
    this.viewMode.set(mode);
  }

  copyText(text: string, label: string, event: Event): void {
    event.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.toastService.success(`คัดลอก${label} "${text}" แล้ว`);
    });
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchKeyword.set(target.value);
  }

  toggleDeleted(): void {
    this.showDeleted.set(!this.showDeleted());
    if (this.showDeleted()) {
      this.toastService.info('เปิดดูคลังประวัติบุคลากรพ้นสภาพ');
    }
  }

  openAddModal(): void {
    this.selectedPersonnel = null;
    this.isPersonnelModalOpen = true;
  }

  openEditModal(p: Personnel): void {
    this.selectedPersonnel = p;
    this.isPersonnelModalOpen = true;
  }

  confirmSoftDelete(p: Personnel): void {
    const msg = `คุณต้องการลบข้อมูลเจ้าหน้าที่ "${p.name}" ออกจากหน้าเว็บใช่หรือไม่?\n\n(หมายเหตุ: ระบบจะทำ Soft Delete ซ่อนออกจากหน้าเว็บแต่ยังจัดเก็บข้อมูลไว้ในฐานข้อมูล)`;
    if (confirm(msg)) {
      this.personnelService.softDeletePersonnel(p.id).subscribe({
        next: () => {
          this.toastService.success(`ซ่อนข้อมูล "${p.name}" เรียบร้อย (Soft Delete)`);
          this.personnelService.loadPersonnel(true);
        },
        error: () => this.toastService.error('ไม่สามารถลบข้อมูลได้')
      });
    }
  }

  restorePersonnel(p: Personnel): void {
    if (confirm(`คุณต้องการกู้คืนข้อมูล "${p.name}" กลับสู่ระบบใช่หรือไม่?`)) {
      this.personnelService.restorePersonnel(p.id).subscribe({
        next: () => {
          this.toastService.success(`กู้คืนข้อมูล "${p.name}" สำเร็จ`);
          this.personnelService.loadPersonnel(true);
        },
        error: () => this.toastService.error('ไม่สามารถกู้คืนข้อมูลได้')
      });
    }
  }

  restore(p: Personnel): void {
    this.restorePersonnel(p);
  }

  onPersonnelSaved(): void {
    this.personnelService.loadPersonnel(true);
  }

  onSaved(): void {
    this.onPersonnelSaved();
  }
}
