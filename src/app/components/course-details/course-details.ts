import { Component, signal, computed, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { lastValueFrom } from 'rxjs';

interface CourseItem {
  id: number;
  name: string;
  category: string;
  subject: string;
  teacher_name: string | null;
  description: string | null;
  schedule: string | null;
  grade_level: string | null;
  day_of_week: number | null;
  days_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  tutoring_day_of_week: number | null;
  tutoring_days_of_week: string | null;
  tutoring_start_time: string | null;
  tutoring_end_time: string | null;
  tutoring_location: string | null;
  branch_name: string | null;
  is_early_bird: boolean;
  early_bird_discount: string | null;
  price: number | null;
}

const DAY_NAMES = ['', '一', '二', '三', '四', '五', '六', '日'];

const GRADE_ORDER: Record<string, number> = {
  '小四': 1, '小五': 2, '小六': 3,
  '國七': 4, '國八': 5, '國九': 6,
  '高一': 7, '高二': 8, '高三': 9,
};

const SUBJECT_ICONS: Record<string, string> = {
  '數學': 'calculate',
  '英文': 'language',
  '國文': 'history_edu',
  '自然': 'biotech',
  '理化': 'science',
  '生物': 'eco',
  '物理': 'science',
  '化學': 'science',
  '社會': 'public',
  '數B': 'calculate',
  '作文': 'edit_note',
};

@Component({
  selector: 'app-course-details',
  imports: [RouterLink, CommonModule],
  templateUrl: './course-details.html',
  styleUrl: './course-details.scss',
})
export class CourseDetails implements OnInit {
  activeTab = signal<'elementary' | 'junior' | 'senior'>('elementary');
  selectedGrade = signal('');
  courses = signal<CourseItem[]>([]);
  loading = signal(false);

  gradeOptions = computed(() => {
    const grades = new Set<string>();
    for (const c of this.courses()) {
      if (c.grade_level) grades.add(c.grade_level);
    }
    return Array.from(grades).sort((a, b) => (GRADE_ORDER[a] ?? 99) - (GRADE_ORDER[b] ?? 99));
  });

  filteredCourses = computed(() => {
    const sel = this.selectedGrade();
    if (!sel) return this.courses();
    return this.courses().filter(c => c.grade_level === sel);
  });

  private tabCategory: Record<string, string> = {
    elementary: '小學部',
    junior: '國中部',
    senior: '高中部',
  };

  private tabColors: Record<string, string> = {
    elementary: 'bg-accent-gold',
    junior: 'bg-primary',
    senior: 'bg-[#D9B44A]',
  };

  private tabTitles: Record<string, string> = {
    elementary: '國小部精選課程',
    junior: '國中部專業課程',
    senior: '高中部進階課程',
  };

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit() {
    window.scrollTo(0, 0);
    this.route.queryParams.subscribe((params) => {
      const tab = params['tab'];
      if (tab === 'elementary' || tab === 'junior' || tab === 'senior') {
        this.activeTab.set(tab);
      }
      this.selectedGrade.set('');
      this.loadCourses();
    });
  }

  setTab(tab: 'elementary' | 'junior' | 'senior') {
    this.activeTab.set(tab);
    this.selectedGrade.set('');
    this.loadCourses();
  }

  selectGrade(grade: string) {
    this.selectedGrade.set(grade);
  }

  async loadCourses() {
    const category = this.tabCategory[this.activeTab()];
    if (!category) return;
    this.loading.set(true);
    try {
      const res = await lastValueFrom(
        this.api.get<{ courses: CourseItem[] }>('/courses', { category })
      );
      this.courses.set(res.courses || []);
    } catch {
      this.courses.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  getIcon(subject: string): string {
    return SUBJECT_ICONS[subject] || 'school';
  }

  getTabColor(): string {
    return this.tabColors[this.activeTab()];
  }

  getTabTitle(): string {
    return this.tabTitles[this.activeTab()];
  }

  formatSchedule(c: CourseItem): string {
    const fromFields = this.formatTimeFromFields(c);
    if (fromFields) return fromFields;
    return c.schedule || '';
  }

  formatWeekdays(c: CourseItem): string {
    const days = c.days_of_week
      ? c.days_of_week.split(',').map(Number).filter(n => !isNaN(n))
      : c.day_of_week != null ? [c.day_of_week] : [];
    const dayStr = days.map(d => DAY_NAMES[d] ?? '').filter(Boolean).join('、');
    if (dayStr) return dayStr;
    const m = (c.schedule || '').match(/(日|一|二|三|四|五|六)(、|日|一|二|三|四|五|六)*/);
    return m ? m[0] : '待安排';
  }

  formatTimeRange(c: CourseItem): string {
    const timeStr = [c.start_time, c.end_time].filter(Boolean).join('~');
    if (timeStr) return timeStr;
    const m = (c.schedule || '').match(/(\d{1,2}[:：]?\d{0,2}\s*[-~]\s*\d{1,2}[:：]?\d{0,2})/);
    return m ? m[1] : '待安排';
  }

  private formatTimeFromFields(c: CourseItem): string {
    const days = c.days_of_week
      ? c.days_of_week.split(',').map(Number).filter(n => !isNaN(n))
      : c.day_of_week != null ? [c.day_of_week] : [];
    const dayStr = days.map(d => DAY_NAMES[d] ?? '').filter(Boolean).join('、');
    const timeStr = [c.start_time, c.end_time].filter(Boolean).join('~');
    return [dayStr, timeStr].filter(Boolean).join(' ');
  }

  formatTime(t: string | null): string {
    if (!t) return '';
    const [h, m] = t.split(':');
    if (h == null) return t;
    return `${Number(h) > 12 ? Number(h) - 12 : Number(h)}:${m ?? '00'}${Number(h) >= 12 ? 'PM' : 'AM'}`;
  }

  formatTutoringSchedule(c: CourseItem): string {
    const days = c.tutoring_days_of_week
      ? c.tutoring_days_of_week.split(',').map(Number).filter(n => !isNaN(n))
      : c.tutoring_day_of_week != null ? [c.tutoring_day_of_week] : [];
    const dayStr = days.map(d => DAY_NAMES[d] ?? '').filter(Boolean).join('、');
    const timeStr = [c.tutoring_start_time, c.tutoring_end_time].filter(Boolean).join('~');
    return [dayStr, timeStr].filter(Boolean).join(' ');
  }

  groupedByGrade(): { grade: string; courses: CourseItem[] }[] {
    const groups = new Map<string, CourseItem[]>();
    for (const c of this.filteredCourses()) {
      const g = c.grade_level || '其他';
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(c);
    }
    return Array.from(groups.entries())
      .sort((a, b) => (GRADE_ORDER[a[0]] ?? 99) - (GRADE_ORDER[b[0]] ?? 99))
      .map(([grade, courses]) => ({
        grade,
        courses: courses.sort((x, y) => (GRADE_ORDER[x.grade_level ?? ''] ?? 99) - (GRADE_ORDER[y.grade_level ?? ''] ?? 99)),
      }));
  }
}
