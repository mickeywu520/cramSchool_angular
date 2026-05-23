import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { lastValueFrom } from 'rxjs';

interface StudentData {
  id: number;
  student_name: string;
  gender: string;
  school: string;
  grade: string;
  class_name?: string;
  avatar_url?: string;
  student_number?: string;
  email: string;
}

interface SubjectProgress {
  subject: string;
  progress: number;
  total_lessons: number;
  completed_lessons: number;
}

interface ProgressData {
  overall_progress: number;
  subjects: SubjectProgress[];
}

interface CourseSummary {
  id: number;
  course_name: string;
  category: string;
  subject: string;
  teacher_name: string;
  schedule?: string;
  room?: string;
}

interface ExamScore {
  id: number;
  exam_name: string;
  subject: string;
  score: number;
  full_score: number;
}

interface HomeworkSummary {
  id: number;
  subject: string;
  content: string;
  due_date: string;
  is_completed: boolean;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

const AVATAR_COLORS = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
  '#2196F3', '#0097A7', '#009688', '#4CAF50', '#8BC34A',
  '#FF9800', '#FF5722', '#795548', '#607D8B',
];

@Component({
  selector: 'app-student-profile',
  imports: [RouterLink, CommonModule],
  templateUrl: './student-profile.html',
  styleUrl: './student-profile.scss',
})
export class StudentProfile implements OnInit {
  loading = signal(true);
  uploadingAvatar = signal(false);
  error = signal('');

  student = signal<StudentData | null>(null);
  progress = signal<ProgressData | null>(null);
  courses = signal<CourseSummary[]>([]);
  exams = signal<ExamScore[]>([]);
  homework = signal<HomeworkSummary[]>([]);
  announcements = signal<Announcement[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadAll();
  }

  getInitial(name: string): string {
    return name?.charAt(0) || '?';
  }

  getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  async loadAll() {
    this.loading.set(true);
    try {
      const [studentRes, progressRes, coursesRes, examsRes, homeworkRes, announcementsRes] = await Promise.all([
        lastValueFrom(this.api.get<StudentData>('/student/me')),
        lastValueFrom(this.api.get<ProgressData>('/student/progress')),
        lastValueFrom(this.api.get<CourseSummary[]>('/student/courses')),
        lastValueFrom(this.api.get<ExamScore[]>('/student/exams')),
        lastValueFrom(this.api.get<HomeworkSummary[]>('/student/homework')),
        lastValueFrom(this.api.get<Announcement[]>('/announcements')),
      ]);
      this.student.set(studentRes);
      this.progress.set(progressRes);
      this.courses.set(coursesRes);
      this.exams.set(examsRes);
      this.homework.set(homeworkRes);
      this.announcements.set(announcementsRes);
    } catch {
      this.error.set('載入資料失敗');
    } finally {
      this.loading.set(false);
    }
  }

  async onAvatarUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingAvatar.set(true);
    try {
      const res = await lastValueFrom(
        this.api.upload<{ url: string }>('/student/avatar', file)
      );
      this.student.update(s => s ? { ...s, avatar_url: res.url } : s);
    } catch {
      this.error.set('頭像上傳失敗');
    } finally {
      this.uploadingAvatar.set(false);
      input.value = '';
    }
  }

  get pendingHomeworkCount(): number {
    return this.homework().filter(h => !h.is_completed).length;
  }

  get latestExamScore(): string {
    if (this.exams().length === 0) return '無資料';
    const sorted = [...this.exams()].sort((a, b) => b.id - a.id);
    return `${sorted[0].score}分`;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
