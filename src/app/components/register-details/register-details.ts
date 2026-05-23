import { Component, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-register-details',
  imports: [RouterLink, FormsModule, CommonModule, KeyValuePipe],
  templateUrl: './register-details.html',
  styleUrl: './register-details.scss',
})
export class RegisterDetails implements OnInit {
  loading = signal(false);
  error = signal('');

  email = '';
  password = '';

  studentName = signal('');
  gender = signal('');
  birthDate = signal('');
  school = signal('');
  grade = signal('');
  className = signal('');
  parentName = signal('');
  phone = signal('');
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
    private router: Router,
    private api: ApiService,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    const state = history.state as { email?: string; password?: string };
    if (!state?.email || !state?.password) {
      this.router.navigate(['/register']);
      return;
    }
    this.email = state.email;
    this.password = state.password;
  }

  async submit() {
    this.error.set('');

    if (!this.studentName() || !this.gender() || !this.birthDate() || !this.school() || !this.grade() || !this.parentName() || !this.phone()) {
      this.error.set('請填寫所有必填欄位');
      return;
    }

    this.loading.set(true);
    const selectedSubjects = Object.entries(this.subjects())
      .filter(([, v]) => v)
      .map(([k]) => k);

    try {
      await lastValueFrom(
        this.api.post('/auth/register', {
          email: this.email,
          password: this.password,
          student_name: this.studentName(),
          gender: this.gender(),
          birth_date: this.birthDate(),
          school: this.school(),
          grade: this.grade(),
          class_name: this.className() || null,
          parent_name: this.parentName(),
          phone: this.phone(),
          parent2_phone: this.parent2Phone() || null,
          home_phone: this.homePhone() || null,
          id_number: this.idNumber() || null,
          interested_subjects: selectedSubjects,
        })
      );

      // Auto-login after successful registration
      await lastValueFrom(
        this.auth.login(this.email, this.password)
      );
      this.router.navigate(['/student']);
    } catch (err: any) {
      this.error.set(err.error?.error?.message || err.error?.detail || '註冊失敗，請稍後再試');
    } finally {
      this.loading.set(false);
    }
  }

  toggleSubject(subject: string) {
    this.subjects.update(d => ({ ...d, [subject]: !d[subject] }));
  }
}
