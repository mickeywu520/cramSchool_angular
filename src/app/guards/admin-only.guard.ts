import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * 只給「內部帳號管理」用：maintainer / user / teacher 可以進後台，
 * 但不能管理其他後台帳號（後端 /admin/users 也只放 admin）。
 */
@Injectable({ providedIn: 'root' })
export class AdminOnlyGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  canActivate(): boolean {
    if (this.auth.isAdmin) return true;
    this.router.navigate(['/admin/banners']);
    return false;
  }
}
