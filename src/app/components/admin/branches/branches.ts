import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { lastValueFrom } from 'rxjs';

interface Branch {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  display_order: number;
}

@Component({
  selector: 'app-admin-branches',
  imports: [FormsModule],
  templateUrl: './branches.html',
})
export class AdminBranches implements OnInit {
  branches = signal<Branch[]>([]);
  loading = signal(false);
  submitting = signal(false);
  error = signal('');
  success = signal('');

  showModal = signal(false);
  editMode = signal(false);
  form: any = {};

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadBranches();
  }

  async loadBranches() {
    this.loading.set(true);
    try {
      const res = await lastValueFrom(
        this.api.get<Branch[]>('/admin/branches')
      );
      this.branches.set(res);
    } catch {
      this.error.set('無法載入分校資料');
    } finally {
      this.loading.set(false);
    }
  }

  openCreate() {
    this.editMode.set(false);
    this.form = { name: '', phone: '', address: '', is_active: true, display_order: this.branches().length };
    this.showModal.set(true);
  }

  openEdit(branch: Branch) {
    this.editMode.set(true);
    this.form = { ...branch };
    this.showModal.set(true);
  }

  async save() {
    if (!this.form.name) return;
    this.submitting.set(true);
    this.error.set('');
    this.success.set('');
    try {
      if (this.editMode()) {
        await lastValueFrom(
          this.api.put(`/admin/branches/${this.form.id}`, this.form)
        );
        this.success.set('分校已更新');
      } else {
        await lastValueFrom(
          this.api.post('/admin/branches', this.form)
        );
        this.success.set('分校已建立');
      }
      this.showModal.set(false);
      this.loadBranches();
    } catch (err: any) {
      this.error.set(err.error?.detail || '操作失敗');
    } finally {
      this.submitting.set(false);
    }
  }

  async deleteBranch(branch: Branch) {
    if (!confirm(`確定刪除「${branch.name}」？`)) return;
    try {
      await lastValueFrom(
        this.api.delete(`/admin/branches/${branch.id}`)
      );
      this.success.set('分校已刪除');
      this.loadBranches();
    } catch (err: any) {
      this.error.set(err.error?.detail || '刪除失敗');
    }
  }

  async toggleActive(branch: Branch) {
    try {
      await lastValueFrom(
        this.api.put(`/admin/branches/${branch.id}`, { is_active: !branch.is_active })
      );
      this.loadBranches();
    } catch {}
  }
}
