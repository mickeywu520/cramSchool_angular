import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';

export interface UserInfo {
  id: number;
  email: string;
  role: string;
  student_id?: number | null;
  student_name?: string | null;
  teacher_id?: number | null;
  teacher_name?: string | null;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserInfo;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  currentUser = signal<UserInfo | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    const stored = localStorage.getItem('current_user');
    if (stored) {
      try {
        this.currentUser.set(JSON.parse(stored));
      } catch { }
    }
  }

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('refresh_token', res.refresh_token);
          localStorage.setItem('current_user', JSON.stringify(res.user));
          this.currentUser.set(res.user);
        }),
      );
  }

  refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      this.logout();
      throw new Error('No refresh token');
    }
    return this.http
      .post<{ access_token: string; refresh_token: string }>(`${this.apiUrl}/auth/refresh`, { refresh_token: refreshToken })
      .pipe(
        tap((res) => {
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('refresh_token', res.refresh_token);
        }),
      );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    this.currentUser.set(null);
    this.router.navigate(['/register']);
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  get isAdmin(): boolean {
    const user = this.currentUser();
    return !!user && user.role === 'admin';
  }
}
