import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Personnel } from '../models/personnel.model';
import { AuthService } from './auth.service';
import { getApiBaseUrl } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class PersonnelService {
  private get apiBase(): string {
    return `${getApiBaseUrl()}/personnel`;
  }

  private personnelSignal = signal<Personnel[]>([]);
  readonly allPersonnel = this.personnelSignal.asReadonly();

  readonly activePersonnel = computed(() => {
    return this.personnelSignal().filter(p => !p.isDeleted);
  });

  readonly deletedPersonnel = computed(() => {
    return this.personnelSignal().filter(p => p.isDeleted);
  });

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    if (this.authService.token()) {
      this.loadPersonnel();
    }
  }

  loadPersonnel(includeDeleted: boolean = true): void {
    if (!this.authService.token()) {
      return;
    }
    this.http.get<{ success: boolean; personnel: Personnel[] }>(this.apiBase, {
      params: { includeDeleted: includeDeleted ? 'true' : 'false' }
    }).subscribe({
      next: res => {
        if (res && res.personnel) {
          this.personnelSignal.set(res.personnel);
        }
      },
      error: err => {
        console.error('Error loading personnel from database:', err);
      }
    });
  }

  addPersonnel(data: Omit<Personnel, 'id' | 'isDeleted'>): Observable<{ success: boolean; message: string; personnel?: Personnel }> {
    return this.http.post<{ success: boolean; message: string; personnel?: Personnel }>(this.apiBase, data).pipe(
      tap(res => {
        if (res.success && res.personnel) {
          this.personnelSignal.set([res.personnel, ...this.personnelSignal()]);
        }
      })
    );
  }

  updatePersonnel(id: string, data: Partial<Personnel>): Observable<{ success: boolean; message: string; personnel?: Personnel }> {
    return this.http.put<{ success: boolean; message: string; personnel?: Personnel }>(`${this.apiBase}/${id}`, data).pipe(
      tap(res => {
        if (res.success && res.personnel) {
          this.personnelSignal.set(this.personnelSignal().map(p => p.id === id ? res.personnel! : p));
        }
      })
    );
  }

  softDeletePersonnel(id: string): Observable<{ success: boolean; message: string; personnel?: Personnel }> {
    return this.http.delete<{ success: boolean; message: string; personnel?: Personnel }>(`${this.apiBase}/${id}`).pipe(
      tap(res => {
        if (res.success && res.personnel) {
          this.personnelSignal.set(this.personnelSignal().map(p => p.id === id ? res.personnel! : p));
        }
      })
    );
  }

  restorePersonnel(id: string): Observable<{ success: boolean; message: string; personnel?: Personnel }> {
    return this.http.post<{ success: boolean; message: string; personnel?: Personnel }>(`${this.apiBase}/${id}/restore`, {}).pipe(
      tap(res => {
        if (res.success && res.personnel) {
          this.personnelSignal.set(this.personnelSignal().map(p => p.id === id ? res.personnel! : p));
        }
      })
    );
  }
}
