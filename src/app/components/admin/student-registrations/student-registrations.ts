import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { lastValueFrom } from 'rxjs';

interface Registration {
  id: number;
  student_name: string;
  gender: string;
  birth_date: string;
  school: string;
  grade: string;
  class_name: string | null;
  parent_name: string;
  parent_title: string | null;
  phone: string;
  parent2_name: string | null;
  parent2_title: string | null;
  parent2_phone: string | null;
  home_phone: string | null;
  id_number: string | null;
  followup_status: string;
  email: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: '待聯繫', label: '待聯繫' },
  { value: '在籍', label: '在籍' },
  { value: '離籍', label: '離籍' },
];

@Component({
  selector: 'app-admin-student-registrations',
  imports: [FormsModule, CommonModule],
  templateUrl: './student-registrations.html',
  styleUrl: './student-registrations.scss',
})
export class AdminStudentRegistrations implements OnInit {
  loading = signal(false);
  students = signal<Registration[]>([]);
  search = signal('');
  filterStatus = signal('待聯繫');
  filterGrade = signal('');
  filterSchool = signal('');
  savingId = signal<number | null>(null);
  statusOptions = STATUS_OPTIONS;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      const params: Record<string, any> = {};
      if (this.search()) params['search'] = this.search();
      if (this.filterStatus()) params['followup_status'] = this.filterStatus();
      if (this.filterGrade()) params['grade'] = this.filterGrade();
      if (this.filterSchool()) params['school'] = this.filterSchool();
      const res = await lastValueFrom(
        this.api.get<Registration[]>('/admin/student-registrations', params)
      );
      this.students.set(res);
    } catch {
      this.students.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async updateStatus(studentId: number, status: string) {
    this.savingId.set(studentId);
    try {
      await lastValueFrom(
        this.api.put(`/admin/student-registrations/${studentId}/followup`, {
          followup_status: status,
        })
      );
      this.students.update(list =>
        list.map(s => (s.id === studentId ? { ...s, followup_status: status } : s))
      );
    } catch {}
    finally {
      this.savingId.set(null);
    }
  }

  formatDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('zh-TW', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  }
}
