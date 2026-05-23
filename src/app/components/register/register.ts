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

  regEmail = signal('');
  regPassword = signal('');
  regConfirm = signal('');
  regError = signal('');

  constructor(
    private router: Router,
    private auth: AuthService,
  ) {}

  setActiveTab(tab: 'login' | 'register') {
    this.activeTab.set(tab);
    this.loginError.set('');
    this.regError.set('');
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  goToRegisterDetails() {
    this.regError.set('');
    const email = this.regEmail().trim();
    const password = this.regPassword();
    const confirm = this.regConfirm();

    if (!email || !password || !confirm) {
      this.regError.set('請填寫所有欄位');
      return;
    }
    if (password.length < 6) {
      this.regError.set('密碼至少 6 個字元');
      return;
    }
    if (password !== confirm) {
      this.regError.set('兩次輸入的密碼不一致');
      return;
    }

    this.router.navigate(['/register-details'], {
      state: { email, password },
    });
  }

  handleLogin() {
    this.loginError.set('');
    const email = this.loginEmail().trim();
    const password = this.loginPassword();

    if (!email || !password) {
      this.loginError.set('請輸入帳號和密碼');
      return;
    }

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
