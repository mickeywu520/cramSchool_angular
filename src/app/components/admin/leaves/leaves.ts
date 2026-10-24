import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { PendingLeaveService } from '../../../services/pending-leave.service';

interface LeaveRow {
  id: number;
  student_id: number | null;
  course_id: number | null;
  leave_date: string;
  leave_type: string;
  reason: string | null;
  status: string;
  course_name: string | null;
  student_name: string | null;
  requested_room_id: number | null;
  requested_room_code: string | null;
  requested_makeup_date: string | null;
  requested_makeup_start: string | null;
  requested_makeup_end: string | null;
  review_note: string | null;
  created_at: string;
}

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

const LEAVE_TYPES: Record<string, string> = { sick: '病假', personal: '事假', other: '其他' };

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: '待審核', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  approved: { label: '已核准', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  rejected: { label: '已駁回', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

@Component({
  selector: 'app-admin-leaves',
  imports: [FormsModule],
  templateUrl: './leaves.html',
  styleUrl: './leaves.scss',
})
export class AdminLeaves implements OnInit {
  leaves = signal<LeaveRow[]>([]);
  loading = signal(false);
  filter = signal<Filter>('pending');
  errorMsg = signal('');
  successMsg = signal('');

  // 排補課 Modal
  makeupOpen = signal(false);
  makeupTarget = signal<LeaveRow | null>(null);
  makeupSaving = signal(false);
  makeupError = signal('');
  makeupDate = '';
  makeupStart = '18:00';
  makeupEnd = '20:00';
  makeupClassroom = '';
  makeupNotes = '';

  // 駁回 Modal（原因必填，會顯示給家長）
  rejectOpen = signal(false);
  rejectTarget = signal<LeaveRow | null>(null);
  rejectReason = '';
  rejectSaving = signal(false);
  rejectError = signal('');

  readonly filters: { value: Filter; label: string }[] = [
    { value: 'pending', label: '待審核' },
    { value: 'approved', label: '已核准' },
    { value: 'rejected', label: '已駁回' },
    { value: 'all', label: '全部' },
  ];

  constructor(
    private api: ApiService,
    private pendingLeaves: PendingLeaveService,
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.errorMsg.set('');
    this.api.get<{ total: number; applications: LeaveRow[] }>('/leave/pending', { _: Date.now() }).subscribe({
      next: (data) => {
        this.leaves.set(data.applications || []);
        this.loading.set(false);
        // 側邊欄紅點與清單保持同步
        this.pendingLeaves.count.set(data.total ?? (data.applications || []).length);
      },
      error: (e) => {
        this.errorMsg.set(this.msgOf(e, '載入請假清單失敗'));
        this.loading.set(false);
      },
    });
  }

  filtered(): LeaveRow[] {
    const f = this.filter();
    return f === 'all' ? this.leaves() : this.leaves().filter((l) => l.status === f);
  }

  countOf(f: Filter): number {
    return f === 'all' ? this.leaves().length : this.leaves().filter((l) => l.status === f).length;
  }

  typeLabel(type: string): string {
    return LEAVE_TYPES[type] ?? type;
  }

  statusOf(status: string) {
    return STATUS_MAP[status] ?? STATUS_MAP['pending'];
  }

  /** "2026-11-15" → "11月15日 (日)" */
  formatDate(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return iso;
    const day = '日一二三四五六'[new Date(y, m - 1, d).getDay()];
    return `${m}月${d}日 (${day})`;
  }

  /** 家長希望的補課教室與時段（給表格顯示） */
  requestedMakeup(row: LeaveRow): string {
    if (!row.requested_makeup_date) return '';
    const room = row.requested_room_code ? ` · ${row.requested_room_code}` : '';
    const time = row.requested_makeup_start
      ? `${row.requested_makeup_start}${row.requested_makeup_end ? '-' + row.requested_makeup_end : ''}`
      : '';
    return `${this.formatDate(row.requested_makeup_date)}${room}${time ? ' ' + time : ''}`;
  }

  review(row: LeaveRow, status: 'approved' | 'rejected') {
    if (status === 'rejected') {
      this.openReject(row);
      return;
    }

    const makeup = row.requested_makeup_date
      ? `\n補課：${this.formatDate(row.requested_makeup_date)}${row.requested_room_code ? ' · ' + row.requested_room_code : ''} ${row.requested_makeup_start || ''}${row.requested_makeup_end ? '-' + row.requested_makeup_end : ''}`
      : '\n（家長未指定補課時段，核准後需自行排補課）';
    if (!confirm(`確定核准 ${row.student_name || '此學生'} 於 ${this.formatDate(row.leave_date)} 的請假嗎？${makeup}`)) {
      return;
    }
    this.errorMsg.set('');
    this.successMsg.set('');
    this.api.post<{ message?: string }>(`/leave/applications/${row.id}/review`, { status }).subscribe({
      next: (res) => {
        // 就地更新，保留在清單上
        this.leaves.update((list) => list.map((l) => (l.id === row.id ? { ...l, status } : l)));
        this.successMsg.set(res?.message || `已核准 ${row.student_name || ''} 的請假申請`);
        // 側邊欄紅點即時更新
        this.pendingLeaves.refresh();
        this.filter.set('approved');
      },
      error: (e) => this.errorMsg.set(this.msgOf(e, '核准失敗')),
    });
  }

  openReject(row: LeaveRow) {
    this.rejectTarget.set(row);
    this.rejectReason = '';
    this.rejectError.set('');
    this.rejectOpen.set(true);
  }

  closeReject() {
    this.rejectOpen.set(false);
    this.rejectTarget.set(null);
  }

  submitReject() {
    const target = this.rejectTarget();
    if (!target) return;

    const reason = this.rejectReason.trim();
    this.rejectError.set('');
    if (!reason) {
      this.rejectError.set('請填寫駁回原因，家長會看到這段說明');
      return;
    }

    this.rejectSaving.set(true);
    this.api
      .post<{ message?: string }>(`/leave/applications/${target.id}/review`, {
        status: 'rejected',
        reason,
      })
      .subscribe({
        next: (res) => {
          this.rejectSaving.set(false);
          this.leaves.update((list) =>
            list.map((l) => (l.id === target.id ? { ...l, status: 'rejected', review_note: reason } : l)),
          );
          this.successMsg.set(res?.message || `已駁回 ${target.student_name || ''} 的請假申請`);
          this.pendingLeaves.refresh();
          this.closeReject();
        },
        error: (e) => {
          this.rejectSaving.set(false);
          this.rejectError.set(this.msgOf(e, '駁回失敗'));
        },
      });
  }

  openMakeup(row: LeaveRow) {
    if (row.course_id === null) {
      this.errorMsg.set('此請假申請沒有指定課程，無法排補課');
      return;
    }
    this.makeupTarget.set(row);
    this.makeupDate = row.leave_date;
    this.makeupStart = '18:00';
    this.makeupEnd = '20:00';
    this.makeupClassroom = '';
    this.makeupNotes = '';
    this.makeupError.set('');
    this.makeupOpen.set(true);
  }

  closeMakeup() {
    this.makeupOpen.set(false);
    this.makeupTarget.set(null);
  }

  saveMakeup() {
    const target = this.makeupTarget();
    if (!target) return;

    this.makeupError.set('');
    if (!this.makeupDate) {
      this.makeupError.set('請選擇補課日期');
      return;
    }
    if (!this.makeupStart || !this.makeupEnd) {
      this.makeupError.set('請填寫補課起訖時間');
      return;
    }
    if (this.makeupEnd <= this.makeupStart) {
      this.makeupError.set('結束時間必須晚於開始時間');
      return;
    }

    this.makeupSaving.set(true);
    this.api
      .post('/leave/makeup', {
        leave_id: target.id,
        student_id: target.student_id,
        course_id: target.course_id,
        makeup_date: this.makeupDate,
        start_time: this.makeupStart,
        end_time: this.makeupEnd,
        classroom: this.makeupClassroom.trim() || null,
        notes: this.makeupNotes.trim() || null,
      })
      .subscribe({
        next: () => {
          this.makeupSaving.set(false);
          this.successMsg.set(`已為 ${target.student_name || '學生'} 安排補課`);
          this.closeMakeup();
        },
        error: (e) => {
          this.makeupSaving.set(false);
          this.makeupError.set(this.msgOf(e, '排補課失敗'));
        },
      });
  }

  private msgOf(e: unknown, fallback: string): string {
    const err = e as { error?: { message?: string; detail?: string }; message?: string };
    return err?.error?.message || err?.error?.detail || err?.message || fallback;
  }
}
