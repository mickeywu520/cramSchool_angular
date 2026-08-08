import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { StudentContextService } from '../../services/student-context.service';
import { StudentSwitcher } from '../student-switcher/student-switcher';
import { lastValueFrom } from 'rxjs';

interface StudentInfo {
  id: number;
  student_name: string;
  grade: string;
  student_number?: string;
  avatar_url?: string;
}

interface SessionEntry {
  id: number;
  session_id: number;
  entry_date: string;
  course_name: string | null;
  tutor_name: string | null;
  class_progress: string | null;
  class_homework: string | null;
  class_exam_scope: string | null;
  class_announcements: string | null;
  arrival_time: string | null;
  departure_time: string | null;
  handout_status: string | null;
  homework_material: string | null;
  homework_workbook: string | null;
  exam_score: number | null;
  custom_scores: Record<string, number>;
  tutoring_attendance: boolean;
  notes: string | null;
  parent_signed: boolean;
  parent_signed_at: string | null;
}

interface WeeklyEntrySummary {
  id: number;
  entry_date: string;
  is_signed: boolean;
}

@Component({
  selector: 'app-communication-book',
  imports: [RouterLink, CommonModule, FormsModule, StudentSwitcher],
  templateUrl: './communication-book.html',
  styleUrl: './communication-book.scss',
})
export class CommunicationBook implements OnInit, OnDestroy {
  loading = signal(true);
  signing = signal(false);
  error = signal('');

  private unsub: (() => void) | null = null;

  student = signal<StudentInfo | null>(null);
  entries = signal<SessionEntry[]>([]);
  weekEntries = signal<WeeklyEntrySummary[]>([]);
  weekStart = signal('');
  weekEnd = signal('');

  selectedDate = signal('');
  selectedEntries = signal<SessionEntry[]>([]);

  constructor(public api: ApiService, public auth: AuthService, public ctx: StudentContextService, private router: Router) {}

  ngOnInit() {
    this.selectedDate.set(new Date().toISOString().slice(0, 10));
    this.init();
  }

  async init() {
    await this.ctx.loadStudents();
    if (this.ctx.noStudents) {
      this.loading.set(false);
      return;
    }
    this.unsub = this.ctx.onStudentChange(() => this.loadData());
    await this.loadData();
  }

  ngOnDestroy() {
    this.unsub?.();
  }

  async loadData() {
    this.loading.set(true);
    this.error.set('');
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [entriesRes, weeklyRes] = await Promise.all([
        lastValueFrom(
          this.api.get<{ student: StudentInfo; entries: SessionEntry[] }>('/communication/entries', {
            date_from: today,
            date_to: today,
            ...this.ctx.param,
          })
        ),
        lastValueFrom(
          this.api.get<{ student: StudentInfo; week_start: string; week_end: string; entries: WeeklyEntrySummary[] }>('/communication/weekly', this.ctx.param)
        ),
      ]);

      this.student.set(entriesRes.student);
      this.selectedEntries.set(entriesRes.entries);

      this.weekStart.set(weeklyRes.week_start);
      this.weekEnd.set(weeklyRes.week_end);
      this.weekEntries.set(weeklyRes.entries);
    } catch (err: any) {
      this.error.set('載入聯絡簿資料失敗，請稍後再試');
    } finally {
      this.loading.set(false);
    }
  }

  async selectDate(dateStr: string) {
    this.selectedDate.set(dateStr);
    this.loading.set(true);
    try {
      const res = await lastValueFrom(
        this.api.get<{ entries: SessionEntry[]; student: StudentInfo }>('/communication/entries', {
          date_from: dateStr,
          date_to: dateStr,
          ...this.ctx.param,
        })
      );
      this.selectedEntries.set(res.entries);
      this.student.set(res.student);
    } catch {
      this.selectedEntries.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async signEntry(entryId: number) {
    const entry = this.selectedEntries().find(e => e.id === entryId);
    if (!entry || entry.parent_signed) return;

    this.signing.set(true);
    try {
      const sid = this.ctx.param['student_id'];
      const qs = sid ? `?student_id=${sid}` : '';
      await lastValueFrom(
        this.api.post(`/communication/entries/${entry.id}/feedback${qs}`, {
          is_signed: true,
        })
      );
      await this.selectDate(this.selectedDate());
    } catch {
      this.error.set('簽署失敗，請稍後再試');
    } finally {
      this.signing.set(false);
    }
  }

  get dayNames() {
    return ['日', '一', '二', '三', '四', '五', '六'];
  }

  private localDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  private fmtLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  getWeekDates(): string[] {
    if (!this.weekStart()) return [];
    const start = this.localDate(this.weekStart());
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(this.fmtLocal(d));
    }
    return dates;
  }

  getWeekDayName(dateStr: string): string {
    return this.dayNames[this.localDate(dateStr).getDay()];
  }

  getWeekDayNum(dateStr: string): number {
    return this.localDate(dateStr).getDate();
  }

  getWeekEntrySummary(dateStr: string): WeeklyEntrySummary | undefined {
    return this.weekEntries().find(e => e.entry_date === dateStr);
  }

  isToday(dateStr: string): boolean {
    return dateStr === this.fmtLocal(new Date());
  }

  isSelected(dateStr: string): boolean {
    return dateStr === this.selectedDate();
  }

  formatDate(dateStr: string): string {
    const d = this.localDate(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }

  /** 考試分數 = 個人所有分數（主分數 + 自訂欄位）的平均 */
  examAverage(entry: SessionEntry): number | null {
    const scores: number[] = [];
    if (entry.exam_score != null) scores.push(entry.exam_score);
    for (const v of Object.values(entry.custom_scores || {})) {
      if (v != null && !isNaN(v)) scores.push(v);
    }
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
  }

  /** 每筆成績（主分數 + 各自訂欄位） */
  examScores(entry: SessionEntry): { label: string; score: number }[] {
    const list: { label: string; score: number }[] = [];
    if (entry.exam_score != null) {
      list.push({ label: '主分數', score: entry.exam_score });
    }
    const custom = entry.custom_scores || {};
    const keys = Object.keys(custom).sort();
    for (const k of keys) {
      const v = custom[k];
      if (v != null && !isNaN(v)) {
        list.push({ label: k, score: v });
      }
    }
    return list;
  }

  getInitial(name: string): string {
    return name?.charAt(0) || '?';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  private avatarColors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#0097A7', '#009688', '#4CAF50', '#8BC34A',
    '#FF9800', '#FF5722', '#795548', '#607D8B',
  ];

  getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return this.avatarColors[Math.abs(hash) % this.avatarColors.length];
  }
}
