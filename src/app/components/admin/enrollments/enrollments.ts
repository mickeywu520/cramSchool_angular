import { Component, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { lastValueFrom } from 'rxjs';

interface StudentInfo {
  id: number;
  student_name: string;
  grade: string;
  followup_status: string;
  remark: string | null;
}

interface Course {
  id: number;
  name: string;
  category: string;
  grade_level: string;
  subject: string;
  school_year: string | null;
  semester: string | null;
  is_teaching: boolean;
}

interface Enrollment {
  id: number;
  student_id: number;
  student_name: string;
  school: string;
  remark: string | null;
  course_id: number;
  course_name: string;
  status: string;
  enrolled_at: string | null;
}

@Component({
  selector: 'app-admin-enrollments',
  imports: [FormsModule, CommonModule],
  templateUrl: './enrollments.html',
})
export class AdminEnrollments implements OnInit {
  courses = signal<Course[]>([]);
  enrollments = signal<Enrollment[]>([]);
  allStudents = signal<StudentInfo[]>([]);
  loading = signal(false);
  error = signal('');
  success = signal('');

  selectedCourseId = signal<number | null>(null);
  addStudentId = signal<number | null>(null);
  selectedAddIds = signal<number[]>([]);
  batchAdding = signal(false);
  studentSearch = signal('');
  filterGrade = signal('');
  showStudentDropdown = signal(false);
  copySourceCourseId = signal<number | null>(null);
  copying = signal(false);

  gradeOptions = ['全部', '小四', '小五', '小六', '國七', '國八', '國九', '高一', '高二', '高三'];

  sortedCourses = computed(() => {
    const gradeOrder: Record<string, number> = {
      '小四': 1, '小五': 2, '小六': 3,
      '國七': 4, '國八': 5, '國九': 6,
      '高一': 7, '高二': 8, '高三': 9,
    };
    return [...this.courses()]
      .filter(c => c.is_teaching)
      .sort((a, b) => {
        const sy = Number(a.school_year) - Number(b.school_year);
        if (sy !== 0) return sy;
        const semA = (a.semester || '').includes('下') ? 0 : 1;
        const semB = (b.semester || '').includes('下') ? 0 : 1;
        if (semA !== semB) return semA - semB;
        const ga = gradeOrder[a.grade_level] ?? 99;
        const gb = gradeOrder[b.grade_level] ?? 99;
        return ga - gb;
      });
  });

  displayName(s: StudentInfo | { student_name: string; remark?: string | null }): string {
    const name = s.student_name;
    const remark = (s as any).remark;
    return remark ? `${name}（${remark}）` : name;
  }

  filteredStudents = computed(() => {
    const search = this.studentSearch().trim().toLowerCase();
    return this.allStudents().filter(s =>
      !search || s.student_name.toLowerCase().includes(search)
    );
  });

  constructor(private api: ApiService) {}

  numberFromEvent(value: string): number | null {
    return value ? Number(value) : null;
  }

  ngOnInit() {
    this.loadCourses();
  }

  async loadCourses() {
    try {
      const res = await lastValueFrom(
        this.api.get<Course[]>('/admin/courses')
      );
      this.courses.set(res);
    } catch {}
  }

  async selectCourse(courseId: number | null) {
    if (!courseId) return;
    this.selectedCourseId.set(courseId);
    this.loadEnrollments(courseId);
    this.loadAvailableStudents(courseId);
  }

  async loadEnrollments(courseId: number) {
    this.loading.set(true);
    try {
      const res = await lastValueFrom(
        this.api.get<Enrollment[]>('/admin/enrollments', { course_id: courseId })
      );
      const active = res.filter(e => e.status === 'active');
      active.sort((a, b) => {
        if (!a.enrolled_at) return -1;
        if (!b.enrolled_at) return 1;
        return a.enrolled_at.localeCompare(b.enrolled_at);
      });
      this.enrollments.set(active);
    } catch {
      this.error.set('無法載入選課資料');
    } finally {
      this.loading.set(false);
    }
  }

  async loadAvailableStudents(courseId: number) {
    try {
      const params: Record<string, any> = {};
      const grade = this.filterGrade();
      if (grade) params['grade_level'] = grade;
      const allStudents = await lastValueFrom(
        this.api.get<StudentInfo[]>('/admin/students', params)
      );
      const enrolledIds = new Set(this.enrollments().map(e => e.student_id));
      this.allStudents.set(allStudents.filter(s => !enrolledIds.has(s.id) && s.followup_status === '在籍'));
    } catch {}
  }

  onGradeFilterChange() {
    if (this.selectedCourseId()) {
      this.loadAvailableStudents(this.selectedCourseId()!);
    }
  }

  setTimeoutDropdownClose() {
    setTimeout(() => {
      this.showStudentDropdown.set(false);
    }, 150);
  }

  async addStudent() {
    if (!this.addStudentId() || !this.selectedCourseId()) return;
    try {
      const res: any = await lastValueFrom(
        this.api.post('/admin/enrollments', {
          student_id: this.addStudentId(),
          course_id: this.selectedCourseId(),
        })
      );
      this.success.set(res.message || '選課成功');
      this.addStudentId.set(null);
      this.studentSearch.set('');
      this.showStudentDropdown.set(false);
      await this.selectCourse(this.selectedCourseId()!);
    } catch (err: any) {
      this.error.set(err.error?.detail || '選課失敗');
    }
  }

  toggleAddSelect(id: number) {
    this.selectedAddIds.update(list =>
      list.includes(id) ? list.filter(i => i !== id) : [...list, id]
    );
  }

  async batchAddStudents() {
    const ids = this.selectedAddIds();
    if (ids.length === 0 || !this.selectedCourseId()) return;
    this.batchAdding.set(true);
    this.error.set('');
    try {
      const res: any = await lastValueFrom(
        this.api.post('/admin/enrollments/batch', {
          student_ids: ids,
          course_id: this.selectedCourseId(),
        })
      );
      this.success.set(res.message || `已加入 ${ids.length} 名學生`);
      this.selectedAddIds.set([]);
      this.studentSearch.set('');
      await this.selectCourse(this.selectedCourseId()!);
    } catch (err: any) {
      this.error.set(err.error?.detail || '批次選課失敗');
    } finally {
      this.batchAdding.set(false);
    }
  }

  onSelectAllStudents() {
    const list = this.filteredStudents();
    const selected = this.selectedAddIds();
    const allSelected = list.length > 0 && list.every(s => selected.includes(s.id));
    if (allSelected) {
      this.selectedAddIds.set(selected.filter(id => !list.some(s => s.id === id)));
    } else {
      const merged = new Set([...selected, ...list.map(s => s.id)]);
      this.selectedAddIds.set(Array.from(merged));
    }
  }

  selectStudent(id: number, name: string) {
    this.addStudentId.set(id);
    this.studentSearch.set(name);
    this.showStudentDropdown.set(false);
  }

  async batchCopyStudents() {
    if (!this.copySourceCourseId() || !this.selectedCourseId()) return;
    this.copying.set(true);
    try {
      const res: any = await lastValueFrom(
        this.api.post('/admin/enrollments/batch-copy', {
          source_course_id: this.copySourceCourseId(),
          target_course_id: this.selectedCourseId(),
        })
      );
      this.success.set(res.message || '複製完成');
      this.copySourceCourseId.set(null);
      await this.selectCourse(this.selectedCourseId()!);
    } catch (err: any) {
      this.error.set(err.error?.detail || '複製失敗');
    } finally {
      this.copying.set(false);
    }
  }

  async removeEnrollment(enrollment: Enrollment) {
    if (!confirm(`確定將 ${enrollment.student_name} 從 ${enrollment.course_name} 移除？`)) return;
    try {
      await lastValueFrom(
        this.api.delete(`/admin/enrollments/${enrollment.id}`)
      );
      this.success.set('已取消選課');
      await this.selectCourse(this.selectedCourseId()!);
    } catch (err: any) {
      this.error.set(err.error?.detail || '操作失敗');
    }
  }

  exportToExcel() {
    const headers = '學生姓名,學校';
    const rows = this.enrollments().map(e => `${e.student_name},${e.school || ''}`);
    const csv = '\uFEFF' + headers + '\r\n' + rows.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const course = this.courses().find(c => c.id === this.selectedCourseId());
    a.download = `${course?.name || '選課'}_學生名單.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
