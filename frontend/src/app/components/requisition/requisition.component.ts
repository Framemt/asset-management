import { Component, computed, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AssetService } from '../../services/asset.service';
import { ToastService } from '../../services/toast.service';
import { Asset } from '../../models/asset.model';
import { ModalRequisitionComponent } from '../modal-requisition/modal-requisition.component';

@Component({
  selector: 'app-requisition',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ModalRequisitionComponent],
  templateUrl: './requisition.component.html',
  styleUrl: './requisition.component.scss'
})
export class RequisitionComponent implements OnInit {
  readonly searchKeyword = signal('');
  readonly filterMode = signal<'unassigned' | 'all'>('unassigned');

  isModalOpen = false;
  selectedAsset: Asset | null = null;

  unassignedAssets = computed(() => {
    return this.assetService.allAssets().filter(a => 
      a.status === 'ใช้งาน' && (!a.assetNumber || a.assignedPersonnelName.includes('ยังไม่ได้ระบุ'))
    );
  });

  allAvailableAssets = computed(() => {
    return this.assetService.allAssets().filter(a => a.status === 'ใช้งาน');
  });

  displayedAssets = computed(() => {
    let list = this.filterMode() === 'unassigned' ? this.unassignedAssets() : this.allAvailableAssets();
    const kw = this.searchKeyword().trim().toLowerCase();
    if (!kw) return list;

    return list.filter(a => 
      (a.name && a.name.toLowerCase().includes(kw)) ||
      (a.brand && a.brand.toLowerCase().includes(kw)) ||
      (a.model && a.model.toLowerCase().includes(kw)) ||
      (a.serialNumber && a.serialNumber.toLowerCase().includes(kw))
    );
  });

  constructor(
    public assetService: AssetService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.assetService.loadAssets();
  }

  @HostListener('window:keydown', ['$event'])
  onGlobalKeydown(e: KeyboardEvent): void {
    if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
      e.preventDefault();
      const el = document.getElementById('requisitionSearchInput');
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

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchKeyword.set(target.value);
  }

  setFilterMode(mode: 'unassigned' | 'all'): void {
    this.filterMode.set(mode);
  }

  openRequisition(asset: Asset): void {
    this.selectedAsset = asset;
    this.isModalOpen = true;
  }

  onRequisitionCompleted(): void {
    this.toastService.success('บันทึกการเบิกจ่ายครุภัณฑ์สำเร็จ');
    this.assetService.loadAssets();
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && !target.src.includes('fallback-asset.svg')) {
      target.src = 'fallback-asset.svg';
    }
  }
}
