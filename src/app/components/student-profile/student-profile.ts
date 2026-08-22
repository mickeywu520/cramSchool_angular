import { Component, signal, OnInit, OnDestroy, ElementRef, AfterViewInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { StudentContextService } from '../../services/student-context.service';
import { StudentSwitcher } from '../student-switcher/student-switcher';
import { lastValueFrom } from 'rxjs';
import Chart from 'chart.js/auto';

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
  name: string;
  category: string;
  subject: string;
  teacher_name: string;
  schedule?: string;
  grade_level?: string;
  location?: string;
  branch_name?: string;
  start_date?: string;
  end_date?: string;
  days_of_week?: string;
  start_time?: string;
  end_time?: string;
}

const DAY_NAMES = ['', '一', '二', '三', '四', '五', '六', '日'];

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

interface ScorePoint {
  date: string;
  scores: Record<string, number>;
  average: number;
  class_average: number | null;
}

interface CourseScoreHistory {
  course_id: number;
  course_name: string;
  subject: string;
  points: ScorePoint[];
  average: number | null;
}

const AVATAR_COLORS = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
  '#2196F3', '#0097A7', '#009688', '#4CAF50', '#8BC34A',
  '#FF9800', '#FF5722', '#795548', '#607D8B',
];

@Component({
  selector: 'app-student-profile',
  imports: [RouterLink, CommonModule, StudentSwitcher],
  templateUrl: './student-profile.html',
  styleUrl: './student-profile.scss',
})
export class StudentProfile implements OnInit, AfterViewInit, OnDestroy {
  loading = signal(true);
  uploadingAvatar = signal(false);
  error = signal('');

  student = signal<StudentData | null>(null);
  progress = signal<ProgressData | null>(null);
  courses = signal<CourseSummary[]>([]);
  exams = signal<ExamScore[]>([]);
  homework = signal<HomeworkSummary[]>([]);
  announcements = signal<Announcement[]>([]);
  scoreHistory = signal<CourseScoreHistory[]>([]);
  private charts: Chart[] = [];
  private unsub: (() => void) | null = null;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    public ctx: StudentContextService,
    private router: Router,
    private el: ElementRef,
  ) {}

  ngOnInit() {
    this.init();
  }

  async init() {
    await this.ctx.loadStudents();
    if (this.ctx.noStudents) {
      this.loading.set(false);
      return;
    }
    this.unsub = this.ctx.onStudentChange(() => this.loadAll());
    await this.loadAll();
  }

  ngOnDestroy() {
    this.unsub?.();
    this.destroyCharts();
  }

  ngAfterViewInit() {
    this.renderCharts();
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
      const [studentRes, progressRes, coursesRes, examsRes, homeworkRes, announcementsRes, scoreHistoryRes] = await Promise.all([
        lastValueFrom(this.api.get<StudentData>('/student/me', this.ctx.param)),
        lastValueFrom(this.api.get<ProgressData>('/student/progress', this.ctx.param)),
        lastValueFrom(this.api.get<CourseSummary[]>('/student/courses', this.ctx.param)),
        lastValueFrom(this.api.get<ExamScore[]>('/student/exams', this.ctx.param)),
        lastValueFrom(this.api.get<HomeworkSummary[]>('/student/homework', this.ctx.param)),
        lastValueFrom(this.api.get<Announcement[]>('/announcements')),
        lastValueFrom(this.api.get<CourseScoreHistory[]>('/student/score-history', this.ctx.param)),
      ]);
      this.student.set(studentRes);
      this.progress.set(progressRes);
      this.courses.set(coursesRes);
      this.exams.set(examsRes);
      this.homework.set(homeworkRes);
      this.announcements.set(announcementsRes);
      this.scoreHistory.set(scoreHistoryRes || []);
    } catch {
      this.error.set('載入資料失敗');
    } finally {
      this.loading.set(false);
      setTimeout(() => this.renderCharts(), 0);
    }
  }

  private destroyCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  renderCharts() {
    this.destroyCharts();
    const host = this.el.nativeElement as HTMLElement;
    const canvas = host.querySelector<HTMLCanvasElement>('#score-chart');
    if (!canvas) return;
    canvas.style.height = '360px';
    canvas.style.maxHeight = '420px';

    const histories = this.scoreHistory();
    if (histories.length === 0) return;

    const allDates = Array.from(new Set(histories.flatMap(h => h.points.map(p => p.date)))).sort();

    const colors = [
      '#0E7490', '#D97706', '#16A34A', '#DC2626', '#7C3AED',
      '#DB2777', '#2563EB', '#65A30D', '#EA580C', '#0891B2',
    ];

    const datasets = histories.map((h, i) => {
      const color = colors[i % colors.length];
      const byDate = new Map(h.points.map(p => [p.date, p.class_average ?? p.average]));
      return {
        label: h.course_name,
        data: allDates.map(d => byDate.has(d) ? (byDate.get(d) ?? null) : null),
        borderColor: color,
        backgroundColor: color + '1A',
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.3,
        spanGaps: true,
      };
    });

    const tooltipLabels = new Map<string, { scores: Record<string, number>; average: number; class_average: number | null }>();
    for (const h of histories) {
      for (const p of h.points) {
        tooltipLabels.set(`${h.course_id}-${p.date}`, { scores: p.scores, average: p.average, class_average: p.class_average });
      }
    }

    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: allDates.map(d => d.slice(5)),
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { font: { size: 12, weight: 'bold' }, boxWidth: 16, padding: 12 },
          },
          title: {
            display: true,
            text: '各課程小考成績',
            font: { size: 14, weight: 'bold' },
          },
          tooltip: {
            callbacks: {
              title: (items) => {
                const idx = items[0]?.dataIndex ?? 0;
                return allDates[idx] ?? '';
              },
              label: (item) => {
                const h = histories[item.datasetIndex];
                const date = allDates[item.dataIndex];
                const info = tooltipLabels.get(`${h.course_id}-${date}`);
                const lines = info
                  ? [
                      ...Object.entries(info.scores).map(([k, v]) => `  ${k}: ${v}`),
                      `  全班平均: ${info.class_average != null ? info.class_average : '-'}`,
                    ].join('\n')
                  : '';
                return ` ${h.course_name}${lines ? '\n' + lines : ''}`;
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: '分數' },
          },
        },
      },
    });
    this.charts.push(chart);
  }

  async onAvatarUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingAvatar.set(true);
    try {
      const res = await lastValueFrom(
        this.api.upload<{ url: string }>('/student/avatar', file, this.ctx.param)
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

  formatSchedule(c: CourseSummary): string {
    const days = c.days_of_week
      ? c.days_of_week.split(',').map(Number).filter(n => !isNaN(n))
      : [];
    const dayStr = days.map(d => DAY_NAMES[d] ?? '').filter(Boolean).join('、');
    const timeStr = [c.start_time, c.end_time].filter(Boolean).join('~');
    const fromFields = [dayStr, timeStr].filter(Boolean).join(' ');
    if (fromFields) return fromFields;
    return c.schedule || '待安排';
  }

  formatWeekdays(c: CourseSummary): string {
    const days = c.days_of_week
      ? c.days_of_week.split(',').map(Number).filter(n => !isNaN(n))
      : [];
    const dayStr = days.map(d => DAY_NAMES[d] ?? '').filter(Boolean).join('、');
    if (dayStr) return dayStr;
    const m = (c.schedule || '').match(/(日|一|二|三|四|五|六)(、|日|一|二|三|四|五|六)*/);
    return m ? m[0] : '待安排';
  }

  formatTimeRange(c: CourseSummary): string {
    const timeStr = [c.start_time, c.end_time].filter(Boolean).join('~');
    if (timeStr) return timeStr;
    const m = (c.schedule || '').match(/(\d{1,2}[:：]?\d{0,2}\s*[-~]\s*\d{1,2}[:：]?\d{0,2})/);
    return m ? m[1] : '待安排';
  }

  get latestExamScore(): string {
    if (this.exams().length === 0) return '無資料';
    const sorted = [...this.exams()].sort((a, b) => b.id - a.id);
    return `${sorted[0].score}分`;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
