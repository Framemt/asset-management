import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';
import { getApiBaseUrl } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'asset_jwt_token_v1';
  private readonly USER_KEY = 'asset_app_current_user_v1';

  private currentUserSignal = signal<User | null>(this.loadStoredUser());
  readonly currentUser = this.currentUserSignal.asReadonly();

  readonly tokenSignal = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));
  readonly token = this.tokenSignal.asReadonly();

  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null && !!this.tokenSignal());
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');
  readonly userDepartment = computed(() => this.currentUserSignal()?.department || '');

  private get apiBase(): string {
    return `${getApiBaseUrl()}/auth`;
  }

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.verifyToken();
  }

  private loadStoredUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Error parsing stored user', e);
      }
    }
    return null;
  }

  /**
   * Verify stored token with backend
   */
  verifyToken(): void {
    const token = this.tokenSignal();
    if (!token) return;

    this.http.get<{ success: boolean; user: User }>(`${this.apiBase}/me`).subscribe({
      next: res => {
        if (res && res.user) {
          this.currentUserSignal.set(res.user);
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        }
      },
      error: () => {
        this.logout();
      }
    });
  }

  /**
   * Login via Backend Express REST API
   */
  login(username: string, password: string): Observable<{ success: boolean; message: string; user: User; token: string }> {
    return this.http.post<{ success: boolean; message: string; user: User; token: string }>(
      `${this.apiBase}/login`,
      { username, password }
    ).pipe(
      tap(res => {
        if (res.success && res.token && res.user) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
          this.tokenSignal.set(res.token);
          this.currentUserSignal.set(res.user);
        }
      })
    );
  }

  /**
   * Sign out
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }
}
