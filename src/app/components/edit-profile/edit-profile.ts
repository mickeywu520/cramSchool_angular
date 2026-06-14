import { Component, signal, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { lastValueFrom } from 'rxjs';

interface StudentData {
  id: number;
  student_name: string;
  gender: string;
  birth_date: string;
  school: string;
  grade: string;
  class_name?: string;
  parent_name: string;
  parent_title?: string;
  phone: string;
  parent2_name?: string;
  parent2_title?: string;
  parent2_phone?: string;
  home_phone?: string;
  id_number?: string;
  interested_subjects?: string[];
  avatar_url?: string;
  student_number?: string;
  email: string;
}

const AVATAR_COLORS = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
  '#2196F3', '#0097A7', '#009688', '#4CAF50', '#8BC34A',
  '#FF9800', '#FF5722', '#795548', '#607D8B',
];

@Component({
  selector: 'app-edit-profile',
  imports: [RouterLink, CommonModule, FormsModule, KeyValuePipe],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.scss',
})
export class EditProfile implements OnInit {
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal('');

  student = signal<StudentData | null>(null);

  studentName = signal('');
  gender = signal('');
  birthDate = signal('');
  school = signal('');
  grade = signal('');
  className = signal('');
  parentName = signal('');
  parentTitle = signal('');
  phone = signal('');
  parent2Name = signal('');
  parent2Title = signal('');
  parent2Phone = signal('');
  homePhone = signal('');
  idNumber = signal('');
  subjects = signal<Record<string, boolean>>({
    '數學科': false,
    '英文科': false,
    '理化科': false,
    '國文科': false,
  });

  gradeOptions = [
    '國小五年級', '國小六年級',
    '國中一年級', '國中二年級', '國中三年級',
    '高中一年級', '高中二年級', '高中三年級',
  ];

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  async loadProfile() {
    this.loading.set(true);
    try {
      const data = await lastValueFrom(
        this.api.get<StudentData>('/student/me')
      );
      this.student.set(data);
      this.studentName.set(data.student_name);
      this.gender.set(data.gender);
      this.birthDate.set(data.birth_date);
      this.school.set(data.school);
      this.grade.set(data.grade);
      this.className.set(data.class_name || '');
      this.parentName.set(data.parent_name);
      this.parentTitle.set(data.parent_title || '');
      this.phone.set(data.phone);
      this.parent2Name.set(data.parent2_name || '');
      this.parent2Title.set(data.parent2_title || '');
      this.parent2Phone.set(data.parent2_phone || '');
      this.homePhone.set(data.home_phone || '');
      this.idNumber.set(data.id_number || '');
      const subs: Record<string, boolean> = {};
      const subjects = data.interested_subjects || [];
      for (const key of ['數學科', '英文科', '理化科', '國文科']) {
        subs[key] = subjects.includes(key);
      }
      this.subjects.set(subs);
    } catch {
      this.error.set('載入資料失敗');
    } finally {
      this.loading.set(false);
    }
  }

  async save() {
    this.error.set('');
    this.success.set('');

    if (!this.studentName() || !this.gender() || !this.school() || !this.grade() || !this.parentName() || !this.phone()) {
      this.error.set('請填寫所有必填欄位');
      return;
    }

    this.saving.set(true);
    try {
      const selectedSubjects = Object.entries(this.subjects())
        .filter(([, v]) => v)
        .map(([k]) => k);

      await lastValueFrom(
        this.api.put('/student/me', {
          student_name: this.studentName(),
          gender: this.gender(),
          birth_date: this.birthDate() || null,
          school: this.school(),
          grade: this.grade(),
          class_name: this.className() || null,
          parent_name: this.parentName(),
          parent_title: this.parentTitle() || null,
          phone: this.phone(),
          parent2_name: this.parent2Name() || null,
          parent2_title: this.parent2Title() || null,
          parent2_phone: this.parent2Phone() || null,
          home_phone: this.homePhone() || null,
          id_number: this.idNumber() || null,
          interested_subjects: selectedSubjects,
        })
      );
      this.success.set('資料更新成功');
    } catch (err: any) {
      this.error.set(err.error?.error?.message || err.error?.detail || '更新失敗，請稍後再試');
    } finally {
      this.saving.set(false);
    }
  }

  getInitial(name: string): string {
    return name?.charAt(0) || '?';
  }

  getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  toggleSubject(subject: string) {
    this.subjects.update(d => ({ ...d, [subject]: !d[subject] }));
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
