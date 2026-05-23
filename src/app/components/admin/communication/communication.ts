import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { lastValueFrom } from 'rxjs';

interface StudentOption {
  id: number;
  student_name: string;
  grade: string;
  school: string;
}

interface HomeworkRow {
  subject: string;
  content: string;
  due_date: string;
}

interface ReminderRow {
  content: string;
  priority: 'high' | 'normal';
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

type Tab = 'create' | 'view';

@Component({
  selector: 'app-admin-communication',
  imports: [FormsModule, CommonModule],
  templateUrl: './communication.html',
  styleUrl: './communication.scss',
})
export class AdminCommunication implements OnInit {
  activeTab = signal<Tab>('create');

  students = signal<StudentOption[]>([]);
  loadingStudents = signal(false);
  submitting = signal(false);
  success = signal('');
  error = signal('');

  // Create form
  selectedStudentId = signal<number | null>(null);
  entryDate = signal(new Date().toISOString().slice(0, 10));
  focusScore = signal<number>(5);
  interactionScore = signal<number>(5);
  homeworkCompletion = signal<string>('已完成');
  teacherComment = signal('');
  homeworkList = signal<HomeworkRow[]>([]);
  reminderList = signal<ReminderRow[]>([]);
  completionOptions = ['已完成', '部分完成', '未完成'];

  // View tab
  viewStudentId = signal<number | null>(null);
  viewDate = signal(new Date().toISOString().slice(0, 10));
  viewEntry = signal<CommunicationEntry | null>(null);
  viewLoading = signal(false);
  viewStudentName = signal('');

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadStudents();
  }

  async loadStudents() {
    this.loadingStudents.set(true);
    try {
      const res = await lastValueFrom(
        this.api.get<StudentOption[]>('/admin/students')
      );
      this.students.set(res);
    } catch {
      this.error.set('無法載入學生列表');
    } finally {
      this.loadingStudents.set(false);
    }
  }

  switchTab(tab: Tab) {
    this.activeTab.set(tab);
    this.error.set('');
    this.success.set('');
  }

  // ── Create Tab ──

  addHomework() {
    this.homeworkList.update(list => [...list, { subject: '', content: '', due_date: '' }]);
  }

  removeHomework(index: number) {
    this.homeworkList.update(list => list.filter((_, i) => i !== index));
  }

  addReminder() {
    this.reminderList.update(list => [...list, { content: '', priority: 'normal' }]);
  }

  removeReminder(index: number) {
    this.reminderList.update(list => list.filter((_, i) => i !== index));
  }

  async submit() {
    this.error.set('');
    this.success.set('');

    if (!this.selectedStudentId()) {
      this.error.set('請選擇學生');
      return;
    }
    if (!this.entryDate()) {
      this.error.set('請選擇日期');
      return;
    }

    this.submitting.set(true);
    try {
      const homework = this.homeworkList()
        .filter(h => h.subject || h.content)
        .map(h => ({
          subject: h.subject,
          content: h.content,
          due_date: h.due_date || null,
        }));
      const reminders = this.reminderList()
        .filter(r => r.content)
        .map(r => ({
          content: r.content,
          priority: r.priority,
        }));

      await lastValueFrom(
        this.api.post('/communication/entries', {
          student_id: this.selectedStudentId(),
          teacher_id: 0,
          entry_date: this.entryDate(),
          focus_score: this.focusScore(),
          interaction_score: this.interactionScore(),
          homework_completion: this.homeworkCompletion(),
          teacher_comment: this.teacherComment() || null,
          homework,
          reminders,
        })
      );
      this.success.set('聯絡簿記錄已成功建立！');
      this.resetForm();
    } catch (err: any) {
      this.error.set(err.error?.detail || '建立失敗，請稍後再試');
    } finally {
      this.submitting.set(false);
    }
  }

  private resetForm() {
    this.selectedStudentId.set(null);
    this.entryDate.set(new Date().toISOString().slice(0, 10));
    this.focusScore.set(5);
    this.interactionScore.set(5);
    this.homeworkCompletion.set('已完成');
    this.teacherComment.set('');
    this.homeworkList.set([]);
    this.reminderList.set([]);
  }

  // ── View Tab ──

  async loadEntry() {
    this.error.set('');
    this.viewEntry.set(null);

    if (!this.viewStudentId()) {
      this.error.set('請選擇學生');
      return;
    }
    if (!this.viewDate()) {
      this.error.set('請選擇日期');
      return;
    }

    this.viewLoading.set(true);
    try {
      const res = await lastValueFrom(
        this.api.get<{ student: any; entries: CommunicationEntry[] }>('/admin/entries', {
          student_id: this.viewStudentId(),
          date_from: this.viewDate(),
          date_to: this.viewDate(),
        })
      );
      this.viewStudentName.set(res.student.student_name);
      this.viewEntry.set(res.entries.length > 0 ? res.entries[0] : null);
    } catch {
      this.error.set('查詢失敗，請稍後再試');
    } finally {
      this.viewLoading.set(false);
    }
  }

  focusLabel(score: number): string {
    if (score >= 8) return '優異';
    if (score >= 5) return '良好';
    return '待加強';
  }
}
