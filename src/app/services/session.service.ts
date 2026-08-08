import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class SessionService {
  expired = signal(false);

  constructor(private router: Router) {}

  showExpired() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    this.expired.set(true);
  }

  dismiss() {
    this.expired.set(false);
  }

  goLogin() {
    this.expired.set(false);
    this.router.navigate(['/register']);
  }
}
