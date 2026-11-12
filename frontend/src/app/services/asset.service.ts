import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Asset, AssetStatus } from '../models/asset.model';
import { AuthService } from './auth.service';
import { getApiBaseUrl } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private get apiBase(): string {
    return `${getApiBaseUrl()}/assets`;
  }

  private assetsSignal = signal<Asset[]>([]);
  readonly allAssets = this.assetsSignal.asReadonly();

  // Scoped assets: Admin sees all; User sees own department
  readonly scopedAssets = computed(() => {
    const assets = this.assetsSignal();
    const currentUser = this.authService.currentUser();
    if (!currentUser) return [];
    if (currentUser.role === 'admin') {
      return assets;
    }
    return assets.filter(a => a.department === currentUser.department);
  });

  // Active & Damaged assets
  readonly activeAndDamagedScopedAssets = computed(() => {
    return this.scopedAssets().filter(a => a.status !== 'จำหน่าย');
  });

  // Disposed assets
  readonly disposedScopedAssets = computed(() => {
    return this.scopedAssets().filter(a => a.status === 'จำหน่าย');
  });

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    if (this.authService.token()) {
      this.loadAssets();
    }
  }

  loadAssets(): void {
    if (!this.authService.token()) {
      return;
    }
    this.http.get<{ success: boolean; assets: Asset[] }>(this.apiBase).subscribe({
      next: res => {
        if (res && res.assets) {
          this.assetsSignal.set(res.assets);
        }
      },
      error: err => {
        console.error('Error fetching assets from database:', err);
      }
    });
  }

  checkSerialDuplicate(serial: string, excludeId?: string): Observable<{ isDuplicate: boolean }> {
    return this.http.get<{ isDuplicate: boolean }>(`${this.apiBase}/check-serial`, {
      params: {
        serial,
        excludeId: excludeId || ''
      }
    });
  }

  addAsset(data: any): Observable<{ success: boolean; message: string; asset?: Asset }> {
    return this.http.post<{ success: boolean; message: string; asset?: Asset }>(this.apiBase, data).pipe(
      tap(res => {
        if (res.success && res.asset) {
          this.assetsSignal.set([res.asset, ...this.assetsSignal()]);
        }
      })
    );
  }

  updateAsset(id: string, data: any): Observable<{ success: boolean; message: string; asset?: Asset }> {
    return this.http.put<{ success: boolean; message: string; asset?: Asset }>(`${this.apiBase}/${id}`, data).pipe(
      tap(res => {
        if (res.success && res.asset) {
          this.assetsSignal.set(this.assetsSignal().map(a => a.id === id ? res.asset! : a));
        }
      })
    );
  }

  verifyStatus(id: string, status: AssetStatus, notes?: string, disposedReason?: string): Observable<{ success: boolean; message: string; asset?: Asset }> {
    return this.http.patch<{ success: boolean; message: string; asset?: Asset }>(`${this.apiBase}/${id}/status`, {
      status,
      notes,
      disposedReason
    }).pipe(
      tap(res => {
        if (res.success && res.asset) {
          this.assetsSignal.set(this.assetsSignal().map(a => a.id === id ? res.asset! : a));
        }
      })
    );
  }

  requisitionAsset(id: string, payload: any): Observable<{ success: boolean; message: string; asset?: Asset }> {
    return this.http.post<{ success: boolean; message: string; asset?: Asset }>(`${this.apiBase}/${id}/requisition`, payload).pipe(
      tap(res => {
        if (res.success && res.asset) {
          this.assetsSignal.set(this.assetsSignal().map(a => a.id === id ? res.asset! : a));
        }
      })
    );
  }

  requisition(id: string, payload: any): Observable<{ success: boolean; message: string; asset?: Asset }> {
    return this.requisitionAsset(id, payload);
  }

  uploadImage(imageBase64: string, filename?: string): Observable<{ success: boolean; message: string; url: string }> {
    return this.http.post<{ success: boolean; message: string; url: string }>(`${getApiBaseUrl()}/upload`, { imageBase64, filename });
  }

  deleteAsset(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiBase}/${id}`).pipe(
      tap(res => {
        if (res.success) {
          this.assetsSignal.set(this.assetsSignal().filter(a => a.id !== id));
        }
      })
    );
  }
}
