import { Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { SessionService } from './session.service';
import { StudentContextService } from './student-context.service';
import { isTokenExpired } from '../utils/jwt';

export interface UserInfo {
  id: number;
  email?: string | null;
  role: string;
  auth_provider?: string | null;
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
    private session: SessionService,
    private studentCtx: StudentContextService,
  ) {
    const stored = localStorage.getItem('current_user');
    if (stored) {
      try {
        this.currentUser.set(JSON.parse(stored));
      } catch { }
    }

    // session 逾時時，同步清掉記憶體中的使用者狀態（避免畫面殘留已登入資訊）
    effect(() => {
      if (this.session.expired()) {
        this.currentUser.set(null);
        this.studentCtx.reset();
      }
    });
  }

  /**
   * App 啟動時呼叫（APP_INITIALIZER）：
   * - 家長/學生：access 過期時靜默換發（可續留 refresh 30 天）。
   * - 後台人員（admin/maintainer/user）：access 過期即視為逾時 → 直接登出（不續留）。
   */
  async initSession(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return; // 沒有任何 session，交給 guard 導向登入頁
    const accessToken = localStorage.getItem('access_token');
    if (accessToken && !isTokenExpired(accessToken, 60)) return; // access 仍有效，直接用
    if (this.isBackendUser) {
      // 後台人員：不主動續命，直接顯示逾時
      this.session.showExpired();
      return;
    }
    try {
      await firstValueFrom(this.refreshToken());
    } catch {
      this.session.showExpired();
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
          this.studentCtx.reset();
        }),
      );
  }

  refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      this.session.showExpired();
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
    this.studentCtx.reset();
    this.router.navigate(['/register']);
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  get isAdmin(): boolean {
    const user = this.currentUser();
    return !!user && user.role === 'admin';
  }

  /** 後台管理角色：admin / maintainer / user。這些角色不做靜默續命，過期即登出。 */
  get isBackendUser(): boolean {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'maintainer' || role === 'user';
  }

  /** 是否為「學生」以身分證字號登入（學生專屬帳號） */
  get isStudentAccount(): boolean {
    return this.currentUser()?.auth_provider === 'id_number';
  }
}
