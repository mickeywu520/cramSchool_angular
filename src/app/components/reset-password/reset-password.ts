import { Component, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  imports: [RouterLink, FormsModule],
  templateUrl: './reset-password.html',
})
export class ResetPassword implements OnInit {
  token = '';
  newPassword = signal('');
  confirmPassword = signal('');
  message = signal('');
  error = signal('');
  loading = signal(false);
  success = signal(false);
  showPassword = signal(false);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
  ) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      this.token = params.get('token') ?? '';
      if (!this.token) {
        this.error.set('缺少重設參數，請重新申請重設密碼');
      }
    });
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  async submit() {
    this.error.set('');
    this.message.set('');

    const newPassword = this.newPassword();
    const confirm = this.confirmPassword();

    if (!newPassword || !confirm) {
      this.error.set('請填寫所有欄位');
      return;
    }
    if (newPassword.length < 6) {
      this.error.set('密碼至少 6 個字元');
      return;
    }
    if (newPassword !== confirm) {
      this.error.set('兩次輸入的密碼不一致');
      return;
    }

    this.loading.set(true);
    try {
      const res = await lastValueFrom(
        this.api.post<{ message?: string }>('/auth/reset-password', {
          token: this.token,
          new_password: newPassword,
        })
      );
      this.success.set(true);
      this.message.set(res.message || '密碼重設成功，請重新登入');
    } catch (err: any) {
      this.error.set(err.error?.error?.message || err.error?.detail || '重設失敗，請重新申請');
    } finally {
      this.loading.set(false);
    }
  }

  goLogin() {
    this.router.navigate(['/register']);
  }
}