import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { lastValueFrom } from 'rxjs';

interface Teacher {
  id: number;
  name: string;
}

interface Course {
  id: number;
  name: string;
  category: string;
  subject: string;
  teacher_id: number | null;
  teacher_name: string | null;
  grade_level: string | null;
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  school_year: string | null;
  semester: string | null;
  is_active: boolean;
  display_order: number;
}

@Component({
  selector: 'app-admin-courses',
  imports: [FormsModule, CommonModule],
  templateUrl: './courses.html',
})
export class AdminCourses implements OnInit {
  DAY_NAMES = ['', '一', '二', '三', '四', '五', '六', '日'];
  CATEGORIES = ['小學部', '國中部', '高中部'];
  GRADE_LEVELS = ['小四', '小五', '小六', '國七', '國八', '國九', '高一', '高二', '高三'];
  SUBJECTS = ['數學', '英文', '國文', '理化', '生物', '社會', '物理', '化學', '數B', '自然'];
  courses = signal<Course[]>([]);
  teachers = signal<Teacher[]>([]);
  loading = signal(false);
  submitting = signal(false);
  error = signal('');
  success = signal('');

  // Filters
  filterCategory = signal('');
  filterGradeLevel = signal('');
  filterSubject = signal('');

  // Modal
  showModal = signal(false);
  editMode = signal(false);
  form: any = {};

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadCourses();
    this.loadTeachers();
  }

  async loadCourses() {
    this.loading.set(true);
    this.error.set('');
    try {
      const params: Record<string, string> = {};
      if (this.filterCategory()) params['category'] = this.filterCategory();
      if (this.filterGradeLevel()) params['grade_level'] = this.filterGradeLevel();
      if (this.filterSubject()) params['subject'] = this.filterSubject();
      const res = await lastValueFrom(
        this.api.get<Course[]>('/admin/courses', params)
      );
      this.courses.set(res);
    } catch {
      this.error.set('無法載入課程');
    } finally {
      this.loading.set(false);
    }
  }

  async loadTeachers() {
    try {
      const res = await lastValueFrom(
        this.api.get<{ teachers: Teacher[] }>('/admin/course-filters')
      );
      this.teachers.set(res.teachers || []);
    } catch {}
  }

  applyFilters() {
    this.loadCourses();
  }

  clearFilters() {
    this.filterCategory.set('');
    this.filterGradeLevel.set('');
    this.filterSubject.set('');
    this.loadCourses();
  }

  openCreate() {
    this.editMode.set(false);
    this.form = {
      name: '', category: '小學部', subject: '數學', teacher_id: null,
      grade_level: '國七', day_of_week: 1, start_time: '1830', end_time: '2130',
      location: '中和', school_year: '115', semester: '上',
      is_active: true, display_order: 0,
    };
    this.showModal.set(true);
  }

  openEdit(course: Course) {
    this.editMode.set(true);
    this.form = { ...course };
    this.showModal.set(true);
  }

  async save() {
    this.submitting.set(true);
    this.error.set('');
    this.success.set('');
    try {
      if (this.editMode()) {
        await lastValueFrom(
          this.api.put(`/admin/courses/${this.form.id}`, this.form)
        );
        this.success.set('課程已更新');
      } else {
        await lastValueFrom(
          this.api.post('/admin/courses', this.form)
        );
        this.success.set('課程已建立');
      }
      this.showModal.set(false);
      this.loadCourses();
    } catch (err: any) {
      this.error.set(err.error?.detail || '操作失敗');
    } finally {
      this.submitting.set(false);
    }
  }

  async deleteCourse(course: Course) {
    if (!confirm(`確定刪除「${course.name}」？`)) return;
    try {
      await lastValueFrom(
        this.api.delete(`/admin/courses/${course.id}`)
      );
      this.success.set('課程已刪除');
      this.loadCourses();
    } catch (err: any) {
      this.error.set(err.error?.detail || '刪除失敗');
    }
  }

  dayName(d: number | null): string {
    return d ? this.DAY_NAMES[d] || '' : '';
  }

  numberFromEvent(value: string): number | null {
    return value ? Number(value) : null;
  }
}
