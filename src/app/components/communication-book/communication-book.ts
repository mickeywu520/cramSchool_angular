import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
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
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './communication-book.html',
  styleUrl: './communication-book.scss',
})
export class CommunicationBook implements OnInit {
  loading = signal(true);
  signing = signal(false);
  error = signal('');

  student = signal<StudentInfo | null>(null);
  entries = signal<SessionEntry[]>([]);
  weekEntries = signal<WeeklyEntrySummary[]>([]);
  weekStart = signal('');
  weekEnd = signal('');

  selectedDate = signal('');
  selectedEntries = signal<SessionEntry[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.selectedDate.set(new Date().toISOString().slice(0, 10));
    this.loadData();
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
          })
        ),
        lastValueFrom(
          this.api.get<{ student: StudentInfo; week_start: string; week_end: string; entries: WeeklyEntrySummary[] }>('/communication/weekly')
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
      await lastValueFrom(
        this.api.post(`/communication/entries/${entry.id}/feedback`, {
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

  getInitial(name: string): string {
    return name?.charAt(0) || '?';
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
