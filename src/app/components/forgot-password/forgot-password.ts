import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  imports: [RouterLink, FormsModule],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  identifier = signal('');
  message = signal('');
  error = signal('');
  loading = signal(false);

  constructor(private api: ApiService) {}

  async submit() {
    this.error.set('');
    this.message.set('');

    const identifier = this.identifier().trim();
    if (!identifier) {
      this.error.set('請輸入信箱或帳號名稱');
      return;
    }

    this.loading.set(true);
    try {
      const res = await lastValueFrom(
        this.api.post<{ message?: string }>('/auth/forgot-password', { email: identifier })
      );
      this.message.set(res.message || '若此信箱或帳號存在，我們已發送重設密碼連結');
    } catch (err: any) {
      this.error.set(err.error?.error?.message || err.error?.detail || '發送失敗，請稍後再試');
    } finally {
      this.loading.set(false);
    }
  }
}