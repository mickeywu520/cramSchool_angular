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
  card_number: string | null;
  followup_status: string;
  remark: string | null;
  email: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: '待聯繫', label: '待聯繫' },
  { value: '在籍', label: '在籍' },
  { value: '離籍', label: '離籍' },
];

const GRADE_OPTIONS = [
  '小一', '小二', '小三', '小四', '小五', '小六',
  '國七', '國八', '國九',
  '高一', '高二', '高三',
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
  filterStatus = signal('');
  filterGrade = signal('');
  filterSchool = signal('');
  savingId = signal<number | null>(null);
  statusOptions = STATUS_OPTIONS;
  gradeOptions = GRADE_OPTIONS;
  selectedStudent = signal<Registration | null>(null);
  editRemark = signal('');
  editCardNumber = signal('');
  savingDetail = signal(false);
  detailSaved = signal('');

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

  async updateRemark(studentId: number, remark: string | null) {
    const value = (remark || '').trim() || null;
    this.savingId.set(studentId);
    try {
      await lastValueFrom(
        this.api.put(`/admin/student-registrations/${studentId}`, { remark: value })
      );
      this.students.update(list =>
        list.map(s => (s.id === studentId ? { ...s, remark: value } : s))
      );
    } catch {}
    finally {
      this.savingId.set(null);
    }
  }

  showDetail(s: Registration) {
    this.selectedStudent.set(s);
    this.editRemark.set(s.remark || '');
    this.editCardNumber.set(s.card_number || '');
    this.detailSaved.set('');
  }

  closeDetail() {
    this.selectedStudent.set(null);
  }

  async saveDetail() {
    const s = this.selectedStudent();
    if (!s) return;
    this.savingDetail.set(true);
    this.detailSaved.set('');
    try {
      const remark = this.editRemark().trim() || null;
      const cardNumber = this.editCardNumber().trim() || null;
      await lastValueFrom(
        this.api.put(`/admin/student-registrations/${s.id}`, {
          remark,
          card_number: cardNumber,
        })
      );
      this.students.update(list =>
        list.map(x => (x.id === s.id ? { ...x, remark, card_number: cardNumber } : x))
      );
      this.selectedStudent.update(sel => sel ? { ...sel, remark, card_number: cardNumber } : sel);
      this.detailSaved.set('已儲存');
    } catch (err: any) {
      this.detailSaved.set(err.error?.detail || '儲存失敗');
    } finally {
      this.savingDetail.set(false);
    }
  }

  formatDate(d: string): string {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('zh-TW', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  }

  exportToExcel() {
    const headers = '姓名,年級,學校,家長,電話,家長2/稱謂,家長2電話,註冊日期,跟進狀態';
    const rows = this.students().map(s => {
      const parent = `${s.parent_name}${s.parent_title ? '(' + s.parent_title + ')' : ''}`;
      const parent2 = `${s.parent2_name || '-'}${s.parent2_title ? '(' + s.parent2_title + ')' : ''}`;
      return [s.student_name, s.grade, s.school, parent, s.phone, parent2, s.parent2_phone || '', this.formatDate(s.created_at), s.followup_status].join(',');
    });
    const csv = '\uFEFF' + headers + '\r\n' + rows.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `報名註冊學生名單_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
