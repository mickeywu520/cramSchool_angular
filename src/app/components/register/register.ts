import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [RouterLink, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  activeTab = signal<'login' | 'register'>('login');
  showPassword = signal(false);
  loginEmail = signal('');
  loginPassword = signal('');
  loginError = signal('');

  constructor(private router: Router) {}

  setActiveTab(tab: 'login' | 'register') {
    this.activeTab.set(tab);
    this.loginError.set('');
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  goToRegisterDetails() {
    this.router.navigate(['/register-details']);
  }

  handleLogin() {
    this.loginError.set('');
    const email = this.loginEmail().trim();
    const password = this.loginPassword();

    if (!email || !password) {
      this.loginError.set('請輸入帳號和密碼');
      return;
    }

    // TODO: [API對接] 替換為後端登入 API 呼叫
    // 目前 hard-coded admin/admin，後續改為 POST /api/auth/login
    // 後端應回傳 JWT token + role，前端根據 role 判斷跳轉 admin 或 student
    if (email === 'admin' && password === 'admin') {
      sessionStorage.setItem('admin_logged_in', 'true');
      this.router.navigate(['/admin/banners']);
      return;
    }

    // TODO: [API對接] 一般使用者登入，替換為 API 呼叫後根據 role 跳轉
    this.router.navigate(['/student']);
  }
}
