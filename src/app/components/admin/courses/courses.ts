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
  tutoring_day_of_week: number | null;
  tutoring_days_of_week: string | null;
  tutoring_start_time: string | null;
  tutoring_end_time: string | null;
  tutoring_location: string | null;
  branch_id: number | null;
  branch_name: string | null;
  school_year: string | null;
  semester: string | null;
  is_active: boolean;
  is_teaching: boolean;
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
  deleteTarget = signal<Course | null>(null);
  deleteStudents = signal<{ id: number; name: string }[]>([]);
  deleteLoading = signal(false);

  hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  startHour = '18';
  startMinute = '30';
  endHour = '21';
  endMinute = '30';
  tStartHour = '18';
  tStartMinute = '30';
  tEndHour = '21';
  tEndMinute = '30';

  currentGradeLevels = signal<string[]>(this.GRADE_LEVEL_MAP['小學部']);

  syncStartTime() {
    this.form.start_time = `${this.startHour}:${this.startMinute}`;
  }

  syncEndTime() {
    this.form.end_time = `${this.endHour}:${this.endMinute}`;
  }

  syncStartFromForm() {
    const t = this.form.start_time || '';
    if (t) {
      const parts = t.split(':');
      this.startHour = parts[0] || '18';
      this.startMinute = parts[1] === '30' ? '30' : '00';
    }
  }

  syncTStartTime() {
    this.form.tutoring_start_time = `${this.tStartHour}:${this.tStartMinute}`;
  }

  syncTEndTime() {
    this.form.tutoring_end_time = `${this.tEndHour}:${this.tEndMinute}`;
  }

  syncTStartFromForm() {
    const t = this.form.tutoring_start_time || '';
    if (t) {
      const parts = t.split(':');
      this.tStartHour = parts[0] || '18';
      this.tStartMinute = parts[1] === '30' ? '30' : '00';
    }
  }

  syncTEndFromForm() {
    const t = this.form.tutoring_end_time || '';
    if (t) {
      const parts = t.split(':');
      this.tEndHour = parts[0] || '21';
      this.tEndMinute = parts[1] === '30' ? '30' : '00';
    }
  }

  syncEndFromForm() {
    const t = this.form.end_time || '';
    if (t) {
      const parts = t.split(':');
      this.endHour = parts[0] || '21';
      this.endMinute = parts[1] === '30' ? '30' : '00';
    }
  }

  onCategoryChange() {
    const cat = this.form.category;
    const grades = this.GRADE_LEVEL_MAP[cat] || this.GRADE_LEVELS;
    this.currentGradeLevels.set(grades);
    if (!grades.includes(this.form.grade_level)) {
      this.form.grade_level = grades[0] || '';
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
    const sy = this.form.school_year || '';
    const sem = this.form.semester || '';
    const grade = this.form.grade_level || '';
    const subj = this.form.subject || '';
    this.form.name = `${sy}${sem} ${grade}${subj}`;
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

  // Batch selection
  selectedIds = signal<number[]>([]);

  toggleSelect(id: number) {
    this.selectedIds.update(list =>
      list.includes(id) ? list.filter(i => i !== id) : [...list, id]
    );
  }

  toggleAll(checked: boolean) {
    this.selectedIds.set(checked ? this.courses().map(c => c.id) : []);
  }

  clearSelection() {
    this.selectedIds.set([]);
  }

  async toggleTeaching(course: Course) {
    const newVal = !course.is_teaching;
    try {
      await lastValueFrom(
        this.api.put(`/admin/courses/${course.id}`, {
          is_teaching: newVal,
          is_active: newVal ? course.is_active : false,
        })
      );
      this.courses.update(list =>
        list.map(c => c.id === course.id ? { ...c, is_teaching: newVal, is_active: newVal ? c.is_active : false } : c)
      );
    } catch (err: any) {
      this.error.set(err.error?.detail || '操作失敗');
    }
  }

  async batchToggle(isTeaching: boolean) {
    const ids = this.selectedIds();
    if (ids.length === 0) return;
    try {
      await lastValueFrom(
        this.api.post('/admin/courses/batch-toggle', { course_ids: ids, is_teaching: isTeaching })
      );
      this.success.set(`已${isTeaching ? '開課' : '停課'} ${ids.length} 門課程`);
      this.selectedIds.set([]);
      this.loadCourses();
    } catch (err: any) {
      this.error.set(err.error?.detail || '操作失敗');
    }
  }

  openCreate() {
    this.editMode.set(false);
    const sy = String(new Date().getFullYear() - 1911);
    this.form = {
      name: '', category: '小學部', subject: '', teacher_id: null,
      grade_level: '小四', day_of_week: null, days_of_week: null,
      start_date: '', end_date: '',
      start_time: '18:30', end_time: '21:30',
      location: '', branch_id: null, school_year: sy, semester: '上',
      tutoring_day_of_week: null, tutoring_days_of_week: null,
      tutoring_start_time: '18:30', tutoring_end_time: '21:30',
      tutoring_location: '',
      is_active: true, is_teaching: true, display_order: 0,
    };
    this.startHour = '18'; this.startMinute = '30';
    this.endHour = '21'; this.endMinute = '30';
    this.tStartHour = '18'; this.tStartMinute = '30';
    this.tEndHour = '21'; this.tEndMinute = '30';
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
      tutoring_start_time: this.toTimeDisplay(course.tutoring_start_time),
      tutoring_end_time: this.toTimeDisplay(course.tutoring_end_time),
    };
    this.syncStartFromForm();
    this.syncEndFromForm();
    this.syncTStartFromForm();
    this.syncTEndFromForm();
    this.onCategoryChange();
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
        tutoring_start_time: this.toTimeStorage(this.form.tutoring_start_time),
        tutoring_end_time: this.toTimeStorage(this.form.tutoring_end_time),
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
    this.error.set('');
    if (course.is_teaching) {
      this.error.set('課程仍在開課期間，無法刪除。若要刪除，請先停課。');
      return;
    }
    try {
      const enrollments = await lastValueFrom(
        this.api.get<any[]>('/admin/enrollments', { course_id: String(course.id) })
      );
      const active = (enrollments || []).filter(e => e.status === 'active');
      this.deleteStudents.set(active.map(e => ({ id: e.student_id, name: e.student_name })));
      this.deleteTarget.set(course);
      this.deleteLoading.set(false);
    } catch {
      this.deleteStudents.set([]);
      this.deleteTarget.set(course);
      this.deleteLoading.set(false);
    }
  }

  async confirmDelete() {
    const course = this.deleteTarget();
    if (!course) return;
    this.deleteLoading.set(true);
    try {
      await lastValueFrom(
        this.api.delete(`/admin/courses/${course.id}`)
      );
      this.deleteTarget.set(null);
      this.deleteStudents.set([]);
      this.success.set('課程已刪除');
      this.loadCourses();
    } catch (err: any) {
      this.error.set(err.error?.detail || '刪除失敗');
      this.deleteTarget.set(null);
      this.deleteStudents.set([]);
    } finally {
      this.deleteLoading.set(false);
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

  checkedTutoringDays(): number[] {
    const d = this.form.tutoring_days_of_week;
    return d ? d.split(',').map(Number) : (this.form.tutoring_day_of_week ? [this.form.tutoring_day_of_week] : []);
  }

  toggleTutoringDay(day: number) {
    let days = this.checkedTutoringDays();
    if (days.includes(day)) {
      days = days.filter(d => d !== day);
    } else {
      days = [...days, day].sort();
    }
    this.form.tutoring_days_of_week = days.length ? days.join(',') : null;
    this.form.tutoring_day_of_week = days.length ? days[0] : null;
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
