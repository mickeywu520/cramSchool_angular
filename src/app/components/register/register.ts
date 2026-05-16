import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

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
  loading = signal(false);

  constructor(
    private router: Router,
    private auth: AuthService,
  ) {}

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

    // Map 'admin' shorthand to full email for backend API
    const apiEmail = email === 'admin' ? 'admin@cramschool.com' : email;

    this.loading.set(true);
    this.auth.login(apiEmail, password).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.user.role === 'admin') {
          this.router.navigate(['/admin/banners']);
        } else {
          this.router.navigate(['/student']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.loginError.set(err.error?.error?.message || '登入失敗，請檢查帳號密碼');
      },
    });
  }
}
