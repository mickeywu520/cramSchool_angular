import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { lastValueFrom } from 'rxjs';

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
  allStudents = signal<{ id: number; student_name: string }[]>([]);
  loading = signal(false);
  error = signal('');
  success = signal('');

  selectedCourseId = signal<number | null>(null);
  addStudentId = signal<number | null>(null);

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
      this.enrollments.set(res.filter(e => e.status === 'active'));
    } catch {
      this.error.set('無法載入選課資料');
    } finally {
      this.loading.set(false);
    }
  }

  async loadAvailableStudents(courseId: number) {
    try {
      const allStudents = await lastValueFrom(
        this.api.get<{ id: number; student_name: string }[]>('/admin/students')
      );
      const enrolledIds = new Set(this.enrollments().map(e => e.student_id));
      this.allStudents.set(allStudents.filter(s => !enrolledIds.has(s.id)));
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
      await this.selectCourse(this.selectedCourseId()!);
    } catch (err: any) {
      this.error.set(err.error?.detail || '選課失敗');
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
}
