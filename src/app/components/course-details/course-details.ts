import { Component, signal, OnInit } from '@angular/core';
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
  is_early_bird: boolean;
  early_bird_discount: string | null;
  price: number | null;
}

const SUBJECT_ICONS: Record<string, string> = {
  '數學': 'calculate',
  '英文': 'language',
  '國文': 'history_edu',
  '自然': 'biotech',
  '理化': 'science',
  '生物': 'pet_products',
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
  courses = signal<CourseItem[]>([]);
  loading = signal(false);

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
      this.loadCourses();
    });
  }

  setTab(tab: 'elementary' | 'junior' | 'senior') {
    this.activeTab.set(tab);
    this.loadCourses();
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
    if (c.schedule) return c.schedule;
    return '';
  }
}
