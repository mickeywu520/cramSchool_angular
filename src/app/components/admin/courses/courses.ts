import { Component, signal, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { lastValueFrom } from 'rxjs';

interface Teacher {
  id: number;
  name: string;
}

interface Branch {
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
  days_of_week: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  branch_id: number | null;
  branch_name: string | null;
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
  GRADE_LEVEL_MAP: Record<string, string[]> = {
    '小學部': ['小四', '小五', '小六'],
    '國中部': ['國七', '國八', '國九'],
    '高中部': ['高一', '高二', '高三'],
  };
  SUBJECT_MAP: Record<string, string[]> = {
    '小學部': ['數學', '英文', '國文', '自然'],
    '國中部': ['數學', '英文', '國文', '理化', '生物', '社會'],
    '高中部': ['數學', '英文', '國文', '物理', '化學', '數B', '自然', '社會'],
  };
  GRADE_SUBJECT_MAP: Record<string, string[]> = {
    '小四': ['數學'],
    '小五': ['數學'],
    '小六': ['數學', '英文', '國文'],
    '國七': ['數學', '英文', '生物'],
    '國八': ['數學', '英文', '理化'],
    '國九': ['數學', '英文', '理化', '國文', '社會'],
    '高一': ['數學', '英文', '物理', '化學'],
    '高二': ['數學', '英文', '數B', '物理', '化學'],
    '高三': ['數學', '英文', '數B', '自然'],
  };
  GRADE_LEVELS = [...this.GRADE_LEVEL_MAP['小學部'], ...this.GRADE_LEVEL_MAP['國中部'], ...this.GRADE_LEVEL_MAP['高中部']];
  SUBJECTS = [...new Set(Object.values(this.SUBJECT_MAP).flat())];
  courses = signal<Course[]>([]);
  teachers = signal<Teacher[]>([]);
  branches = signal<Branch[]>([]);
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
  dragX = 0;
  dragY = 0;
  dragging = false;
  dragStartX = 0;
  dragStartY = 0;
  dragMouseX = 0;
  dragMouseY = 0;

  currentGradeLevels = signal<string[]>(this.GRADE_LEVEL_MAP['小學部']);
  currentSubjects = signal<string[]>(this.SUBJECT_MAP['小學部']);

  onCategoryChange() {
    const cat = this.form.category;
    const grades = this.GRADE_LEVEL_MAP[cat] || this.GRADE_LEVELS;
    const subjects = this.SUBJECT_MAP[cat] || this.SUBJECTS;
    this.currentGradeLevels.set(grades);
    this.currentSubjects.set(subjects);
    if (!grades.includes(this.form.grade_level)) {
      this.form.grade_level = grades[0] || '';
    }
    if (grades.length && !subjects.includes(this.form.subject)) {
      this.form.subject = subjects[0] || '';
    }
    this.autoName();
  }

  onGradeLevelChange() {
    this.autoName();
  }

  onSubjectChange() {
    this.autoName();
  }

  autoName() {
    const parts = [this.form.category, this.form.grade_level, this.form.subject].filter(Boolean);
    this.form.name = parts.join(' ');
  }

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
        this.api.get<{ teachers: Teacher[]; branches: Branch[] }>('/admin/course-filters')
      );
      this.teachers.set(res.teachers || []);
      this.branches.set(res.branches || []);
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
    const sy = String(new Date().getFullYear() - 1911);
    this.form = {
      name: '', category: '小學部', subject: '數學', teacher_id: null,
      grade_level: '小四', day_of_week: 1, days_of_week: '1',
      start_date: '', end_date: '',
      start_time: '18:30', end_time: '21:30',
      location: '', branch_id: null, school_year: sy, semester: '上',
      is_active: true, display_order: 0,
    };
    this.dragX = 0; this.dragY = 0;
    this.onCategoryChange();
    this.showModal.set(true);
  }

  openEdit(course: Course) {
    this.editMode.set(true);
    this.form = {
      ...course,
      start_time: this.toTimeDisplay(course.start_time),
      end_time: this.toTimeDisplay(course.end_time),
    };
    this.dragX = 0; this.dragY = 0;
    this.showModal.set(true);
  }

  get modalTransform(): string {
    return `translate(calc(-50% + ${this.dragX}px), calc(-50% + ${this.dragY}px))`;
  }

  startDrag(e: MouseEvent) {
    this.dragging = true;
    this.dragStartX = this.dragX;
    this.dragStartY = this.dragY;
    this.dragMouseX = e.clientX;
    this.dragMouseY = e.clientY;
    e.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onDrag(e: MouseEvent) {
    if (!this.dragging) return;
    this.dragX = this.dragStartX + (e.clientX - this.dragMouseX);
    this.dragY = this.dragStartY + (e.clientY - this.dragMouseY);
  }

  @HostListener('document:mouseup')
  stopDrag() {
    this.dragging = false;
  }

  async save() {
    this.submitting.set(true);
    this.error.set('');
    this.success.set('');
    try {
      const payload = {
        ...this.form,
        start_time: this.toTimeStorage(this.form.start_time),
        end_time: this.toTimeStorage(this.form.end_time),
      };
      if (this.editMode()) {
        await lastValueFrom(
          this.api.put(`/admin/courses/${this.form.id}`, payload)
        );
        this.success.set('課程已更新');
      } else {
        await lastValueFrom(
          this.api.post('/admin/courses', payload)
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

  daysLabel(days: string | null): string {
    if (!days) return '';
    return days.split(',').map(d => this.DAY_NAMES[Number(d)] || '').filter(Boolean).join(', ');
  }

  checkedDays(): number[] {
    const d = this.form.days_of_week;
    return d ? d.split(',').map(Number) : (this.form.day_of_week ? [this.form.day_of_week] : []);
  }

  toggleDay(day: number) {
    let days = this.checkedDays();
    if (days.includes(day)) {
      days = days.filter(d => d !== day);
    } else {
      days = [...days, day].sort();
    }
    this.form.days_of_week = days.length ? days.join(',') : null;
    this.form.day_of_week = days.length ? days[0] : null;
  }

  numberFromEvent(value: string): number | null {
    return value ? Number(value) : null;
  }

  formatTime(t: string | null): string {
    if (!t) return '';
    return t.length === 4 ? t.slice(0, 2) + ':' + t.slice(2) : t;
  }

  toTimeDisplay(t: string | null): string {
    if (!t) return '';
    return t.length === 4 ? t.slice(0, 2) + ':' + t.slice(2) : t;
  }

  toTimeStorage(t: string | null): string | null {
    if (!t) return null;
    return t.replace(':', '');
  }

  getFilterGradeLevels(): string[] {
    const cat = this.filterCategory();
    return cat ? (this.GRADE_LEVEL_MAP[cat] || []) : this.GRADE_LEVELS;
  }

  getFilterSubjects(): string[] {
    const grade = this.filterGradeLevel();
    if (grade) return this.GRADE_SUBJECT_MAP[grade] || [];
    const cat = this.filterCategory();
    return cat ? (this.SUBJECT_MAP[cat] || []) : this.SUBJECTS;
  }

  onFilterGradeLevelChange() {
    const current = this.filterSubject();
    const available = this.getFilterSubjects();
    if (current && !available.includes(current)) {
      this.filterSubject.set('');
    }
  }
}
