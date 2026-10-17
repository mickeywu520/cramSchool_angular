import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { lastValueFrom } from 'rxjs';

interface AccountStudent {
  id: number;
  student_name: string;
  id_number: string | null;
  grade: string | null;
  followup_status: string | null;
  active_course_count: number;
  active_courses: string[];
}

interface AccountItem {
  id: number;
  account_type: 'parent' | 'student';
  login_id: string;
  display_name: string;
  username: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  students: AccountStudent[];
}

@Component({
  selector: 'app-admin-accounts',
  imports: [FormsModule, CommonModule],
  templateUrl: './accounts.html',
})
export class AdminAccounts implements OnInit {
  accounts = signal<AccountItem[]>([]);
  loading = signal(false);
  error = signal('');
  success = signal('');

  search = signal('');
  accountType = signal<'' | 'parent' | 'student'>('');
  expanded = signal<Set<number>>(new Set());
  deleting = signal(false);

  typeFilters: { value: '' | 'parent' | 'student'; label: string }[] = [
    { value: '', label: '全部' },
    { value: 'parent', label: '家長' },
    { value: 'student', label: '學生' },
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadAccounts();
  }

  async loadAccounts() {
    this.loading.set(true);
    this.error.set('');
    this.success.set('');
    try {
      const params: Record<string, any> = {};
      if (this.search().trim()) params['search'] = this.search().trim();
      if (this.accountType()) params['account_type'] = this.accountType();
      const res = await lastValueFrom(
        this.api.get<AccountItem[]>('/admin/accounts', params)
      );
      this.accounts.set(res);
    } catch {
      this.error.set('無法載入帳號資料');
    } finally {
      this.loading.set(false);
    }
  }

  setType(type: '' | 'parent' | 'student') {
    this.accountType.set(type);
    this.loadAccounts();
  }

  toggleExpand(id: number) {
    this.expanded.update(set => {
      const next = new Set(set);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  isExpanded(id: number) {
    return this.expanded().has(id);
  }

  typeLabel(type: string) {
    return type === 'parent' ? '家長' : '學生';
  }

  async remove(account: AccountItem) {
    const who = account.display_name || account.login_id;
    const kids = account.students.length;
    const msg = kids > 0
      ? `確定永久刪除「${who}」及其 ${kids} 位學生嗎？\n學生的出勤、聯絡簿、成績與選課也會一併刪除，且無法復原。`
      : `確定永久刪除「${who}」嗎？此操作無法復原。`;
    if (!confirm(msg)) return;

    this.deleting.set(true);
    this.error.set('');
    this.success.set('');
    try {
      const res: any = await lastValueFrom(
        this.api.delete(`/admin/accounts/${account.id}`)
      );
      this.success.set(res.message || '帳號已刪除');
      await this.loadAccounts();
    } catch (err: any) {
      const detail = err.error?.error;
      if (detail?.code === 'STUDENT_STILL_ENROLLED' && Array.isArray(detail.details)) {
        const lines = detail.details.map(
          (d: any) => `・${d.student_name}：${(d.courses || []).join('、')}`
        );
        this.error.set(`${detail.message || '學生仍在課程中'}\n${lines.join('\n')}`);
      } else {
        this.error.set(detail?.message || '刪除失敗');
      }
    } finally {
      this.deleting.set(false);
    }
  }
}
