import { Component, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { lastValueFrom } from 'rxjs';

interface StudentForm {
  studentName: string;
  gender: string;
  birthDate: string;
  school: string;
  grade: string;
  className: string;
  idNumber: string;
}

@Component({
  selector: 'app-register-details',
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './register-details.html',
  styleUrl: './register-details.scss',
})
export class RegisterDetails implements OnInit {
  loading = signal(false);
  error = signal('');

  email = '';
  password = '';

  students = signal<StudentForm[]>([
    this.emptyStudent(),
  ]);

  parentName = signal('');
  parentTitle = signal('');
  phone = signal('');
  parent2Name = signal('');
  parent2Title = signal('');
  parent2Phone = signal('');
  homePhone = signal('');

  parentTitleOptions = ['爸爸', '媽媽', '爺爺', '奶奶', '其他'];

  gradeOptions = [
    '國小一年級', '國小二年級', '國小三年級', '國小四年級',
    '國小五年級', '國小六年級',
    '國中一年級', '國中二年級', '國中三年級',
    '高中一年級', '高中二年級', '高中三年級',
  ];

  constructor(
    private router: Router,
    private api: ApiService,
    private auth: AuthService,
  ) {}

  private emptyStudent(): StudentForm {
    return {
      studentName: '',
      gender: '',
      birthDate: '',
      school: '',
      grade: '',
      className: '',
      idNumber: '',
    };
  }

  ngOnInit() {
    const state = history.state as { email?: string; password?: string };
    if (!state?.email || !state?.password) {
      this.router.navigate(['/register']);
      return;
    }
    this.email = state.email;
    this.password = state.password;
  }

  get canAddStudent(): boolean {
    return this.students().length < 3;
  }

  addStudent() {
    if (!this.canAddStudent) return;
    this.students.update(list => [...list, this.emptyStudent()]);
  }

  removeStudent(index: number) {
    this.students.update(list => list.filter((_, i) => i !== index));
  }

  updateStudentField(index: number, field: keyof StudentForm, value: string) {
    this.students.update(list =>
      list.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  async submit() {
    this.error.set('');

    if (!this.parentName() || !this.phone()) {
      this.error.set('請填寫家長姓名與聯絡電話');
      return;
    }

    const list = this.students();
    for (const s of list) {
      if (!s.studentName || !s.gender || !s.birthDate || !s.school || !s.grade) {
        this.error.set('請填寫所有學生的必填欄位');
        return;
      }
    }

    this.loading.set(true);

    try {
      const students = list.map(s => ({
        student_name: s.studentName,
        gender: s.gender,
        birth_date: s.birthDate,
        school: s.school,
        grade: s.grade,
        class_name: s.className || null,
        id_number: s.idNumber || null,
      }));

      await lastValueFrom(
        this.api.post('/auth/register', {
          email: this.email,
          password: this.password,
          parent_name: this.parentName(),
          parent_title: this.parentTitle() || null,
          phone: this.phone(),
          parent2_name: this.parent2Name() || null,
          parent2_title: this.parent2Title() || null,
          parent2_phone: this.parent2Phone() || null,
          home_phone: this.homePhone() || null,
          students,
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
}
