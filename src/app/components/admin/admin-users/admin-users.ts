import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { lastValueFrom } from 'rxjs';

interface AdminUser {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

@Component({
  selector: 'app-admin-users',
  imports: [FormsModule],
  templateUrl: './admin-users.html',
})
export class AdminUsers implements OnInit {
  users = signal<AdminUser[]>([]);
  loading = signal(false);
  error = signal('');
  success = signal('');

  showForm = signal(false);
  isNew = signal(false);
  editingUser = signal<AdminUser | null>(null);
  formEmail = signal('');
  formPassword = signal('');
  formRole = signal('maintainer');
  formIsActive = signal(true);

  roleOptions = ['admin', 'maintainer', 'user'];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    this.loading.set(true);
    try {
      const res = await lastValueFrom(
        this.api.get<AdminUser[]>('/admin/users')
      );
      this.users.set(res);
    } catch {
      this.error.set('無法載入帳號資料');
    } finally {
      this.loading.set(false);
    }
  }

  openNewForm() {
    this.isNew.set(true);
    this.editingUser.set(null);
    this.formEmail.set('');
    this.formPassword.set('');
    this.formRole.set('maintainer');
    this.formIsActive.set(true);
    this.showForm.set(true);
  }

  openEditForm(user: AdminUser) {
    this.isNew.set(false);
    this.editingUser.set(user);
    this.formEmail.set(user.email);
    this.formPassword.set('');
    this.formRole.set(user.role);
    this.formIsActive.set(user.is_active);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingUser.set(null);
  }

  async save() {
    if (this.isNew()) {
      if (!this.formEmail() || !this.formPassword()) return;
      try {
        await lastValueFrom(
          this.api.post('/admin/users', {
            email: this.formEmail(),
            password: this.formPassword(),
            role: this.formRole(),
          })
        );
        this.success.set('帳號新增成功');
        this.closeForm();
        await this.loadUsers();
      } catch (err: any) {
        this.error.set(err.error?.detail || '新增失敗');
      }
    } else {
      const editing = this.editingUser();
      if (!editing) return;
      const body: Record<string, unknown> = {};
      if (this.formRole() !== editing.role) body['role'] = this.formRole();
      if (this.formIsActive() !== editing.is_active) body['is_active'] = this.formIsActive();
      if (Object.keys(body).length === 0) { this.closeForm(); return; }
      try {
        await lastValueFrom(
          this.api.put(`/admin/users/${editing.id}`, body)
        );
        this.success.set('帳號更新成功');
        this.closeForm();
        await this.loadUsers();
      } catch (err: any) {
        this.error.set(err.error?.detail || '更新失敗');
      }
    }
  }

  async deleteUser(user: AdminUser) {
    if (!confirm(`確定要刪除「${user.email}」嗎？`)) return;
    try {
      await lastValueFrom(
        this.api.delete(`/admin/users/${user.id}`)
      );
      this.success.set('帳號已刪除');
      await this.loadUsers();
    } catch (err: any) {
      this.error.set(err.error?.detail || '刪除失敗');
    }
  }

  async resetPassword(user: AdminUser) {
    const password = prompt('請輸入新密碼（至少 6 碼）');
    if (!password || password.length < 6) return;
    try {
      await lastValueFrom(
        this.api.put(`/admin/users/${user.id}/reset-password`, { password })
      );
      this.success.set('密碼已重設');
    } catch (err: any) {
      this.error.set(err.error?.detail || '密碼重設失敗');
    }
  }

  roleLabel(role: string): string {
    const map: Record<string, string> = { admin: '管理員', maintainer: '維護者', user: '使用者' };
    return map[role] || role;
  }
}
