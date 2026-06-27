import { Component, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { lastValueFrom } from 'rxjs';

interface StudentInfo {
  id: number;
  student_name: string;
  followup_status: string;
}

interface Course {
  id: number;
  name: string;
  category: string;
  grade_level: string;
  subject: string;
}

interface Enrollment {
  id: number;
  student_id: number;
  student_name: string;
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
  studentSearch = signal('');
  showStudentDropdown = signal(false);
  copySourceCourseId = signal<number | null>(null);
  copying = signal(false);

  sortedCourses = computed(() => {
    const gradeOrder: Record<string, number> = {
      '七年級': 7, '八年級': 8, '九年級': 9,
      '高一': 10, '高二': 11, '高三': 12,
    };
    return [...this.courses()].sort((a, b) => {
      const ga = gradeOrder[a.grade_level] ?? 99;
      const gb = gradeOrder[b.grade_level] ?? 99;
      return ga - gb;
    });
  });

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
      const allStudents = await lastValueFrom(
        this.api.get<StudentInfo[]>('/admin/students')
      );
      const enrolledIds = new Set(this.enrollments().map(e => e.student_id));
      this.allStudents.set(allStudents.filter(s => !enrolledIds.has(s.id) && s.followup_status === '在籍'));
    } catch {}
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
    const names = this.enrollments().map(e => e.student_name).join('\r\n');
    const blob = new Blob(['\uFEFF學生姓名\r\n' + names], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const course = this.courses().find(c => c.id === this.selectedCourseId());
    a.download = `${course?.name || '選課'}_學生名單.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
