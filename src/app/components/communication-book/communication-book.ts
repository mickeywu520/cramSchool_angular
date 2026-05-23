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

interface HomeworkItem {
  id: number;
  subject: string;
  content: string;
  due_date?: string;
  is_completed: boolean;
}

interface ReminderItem {
  id: number;
  content: string;
  priority: string;
}

interface ParentFeedback {
  feedback?: string;
  is_signed: boolean;
  signed_at?: string;
}

interface CommunicationEntry {
  id: number;
  entry_date: string;
  focus_score?: number;
  interaction_score?: number;
  homework_completion?: string;
  teacher_comment?: string;
  teacher_name?: string;
  homework: HomeworkItem[];
  reminders: ReminderItem[];
  parent_feedback?: ParentFeedback;
}

interface WeeklyEntrySummary {
  id: number;
  entry_date: string;
  has_feedback: boolean;
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
  error = signal('');

  student = signal<StudentInfo | null>(null);
  entries = signal<CommunicationEntry[]>([]);
  weekEntries = signal<WeeklyEntrySummary[]>([]);
  weekStart = signal('');
  weekEnd = signal('');

  selectedDate = signal('');
  selectedEntry = signal<CommunicationEntry | null>(null);

  // Feedback
  feedbackText = signal('');
  isSigned = signal(false);
  submittingFeedback = signal(false);

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
          this.api.get<{ student: StudentInfo; entries: CommunicationEntry[] }>('/communication/entries', {
            date_from: today,
            date_to: today,
          })
        ),
        lastValueFrom(
          this.api.get<{ student: StudentInfo; week_start: string; week_end: string; entries: WeeklyEntrySummary[] }>('/communication/weekly')
        ),
      ]);

      this.student.set(entriesRes.student);
      this.entries.set(entriesRes.entries);
      this.selectedEntry.set(entriesRes.entries.length > 0 ? entriesRes.entries[0] : null);

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
        this.api.get<{ entries: CommunicationEntry[] }>('/communication/entries', {
          date_from: dateStr,
          date_to: dateStr,
        })
      );
      this.selectedEntry.set(res.entries.length > 0 ? res.entries[0] : null);
    } catch {
      this.selectedEntry.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  get dayNames() {
    return ['日', '一', '二', '三', '四', '五', '六'];
  }

  /** Parse YYYY-MM-DD to local Date (no timezone shift). */
  private localDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  /** Format a Date to YYYY-MM-DD in local time. */
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

  focusLabel(score: number): string {
    if (score >= 8) return '優異';
    if (score >= 5) return '良好';
    return '待加強';
  }

  async submitFeedback() {
    const entry = this.selectedEntry();
    if (!entry) return;

    this.submittingFeedback.set(true);
    try {
      await lastValueFrom(
        this.api.post(`/communication/entries/${entry.id}/feedback`, {
          feedback: this.feedbackText() || null,
          is_signed: this.isSigned(),
        })
      );
      await this.selectDate(this.selectedDate());
      this.isSigned.set(false);
    } catch {
      this.error.set('送出回饋失敗');
    } finally {
      this.submittingFeedback.set(false);
    }
  }
}
