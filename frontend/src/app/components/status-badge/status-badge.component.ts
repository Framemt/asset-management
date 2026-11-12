import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetStatus } from '../../models/asset.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss'
})
export class StatusBadgeComponent {
  @Input() status: AssetStatus | string = 'ใช้งาน';
}
