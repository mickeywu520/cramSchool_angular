import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ApiService } from '../../../services/api.service';

interface Teacher {
  id: number;
  name: string;
  subject: string;
  title: string;
  motto: string;
  description: string;
  photo_url: string;
  life_photo_url: string;
  branch_id: number | null;
  display_order: number;
  is_active: boolean;
}

interface Branch {
  id: number;
  name: string;
}

@Component({
  selector: 'app-admin-teachers',
  imports: [FormsModule, NgClass],
  templateUrl: './teachers.html',
  styleUrl: './teachers.scss',
})
export class AdminTeachers implements OnInit {
  teachers = signal<Teacher[]>([]);
  branches = signal<Branch[]>([]);
  loading = signal(false);

  showForm = signal(false);
  isNew = signal(false);
  editingTeacher = signal<Teacher | null>(null);
  formData = signal<Partial<Teacher>>({});
  photoPreview = signal<string | null>(null);
  lifePhotoPreview = signal<string | null>(null);
  photoFile = signal<File | null>(null);
  lifePhotoFile = signal<File | null>(null);

  subjectOptions = ['國文', '英文', '數學', '自然', '社會'];

  async loadBranches() {
    try {
      const res: any = await this.api.get('/admin/branches').toPromise();
      this.branches.set(res || []);
    } catch {}
  }

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadTeachers();
    this.loadBranches();
  }

  loadTeachers() {
    this.loading.set(true);
    this.api.get<{ total: number; teachers: Teacher[] }>('/teachers').subscribe({
      next: (data) => {
        this.teachers.set(data.teachers || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openNewForm() {
    this.isNew.set(true);
    this.formData.set({ name: '', subject: '數學', title: '', motto: '', description: '', photo_url: '', life_photo_url: '', branch_id: null, display_order: this.teachers().length, is_active: true });
    this.photoPreview.set(null);
    this.lifePhotoPreview.set(null);
    this.photoFile.set(null);
    this.lifePhotoFile.set(null);
    this.showForm.set(true);
  }

  openEditForm(teacher: Teacher) {
    this.isNew.set(false);
    this.editingTeacher.set(teacher);
    this.formData.set({ ...teacher });
    this.photoPreview.set(teacher.photo_url);
    this.lifePhotoPreview.set(teacher.life_photo_url);
    this.photoFile.set(null);
    this.lifePhotoFile.set(null);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingTeacher.set(null);
    this.formData.set({});
    this.photoPreview.set(null);
    this.lifePhotoPreview.set(null);
    this.photoFile.set(null);
    this.lifePhotoFile.set(null);
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.photoFile.set(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.photoPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onLifePhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.lifePhotoFile.set(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.lifePhotoPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  save() {
    const data = this.formData();
    if (!data.name || !data.subject) return;

    const doSave = (photoUrl?: string, lifePhotoUrl?: string) => {
      const body: Record<string, unknown> = {};

      if (this.isNew() || data.name) body['name'] = data.name;
      if (this.isNew() || data.subject) body['subject'] = data.subject;
      if (data.title !== undefined) body['title'] = data.title;
      if (data.motto !== undefined) body['motto'] = data.motto;
      if (data.description !== undefined) body['description'] = data.description;
      if (data.display_order !== undefined) body['display_order'] = data.display_order;
      if (data.is_active !== undefined) body['is_active'] = data.is_active;
      if (photoUrl) body['photo_url'] = photoUrl;
      if (lifePhotoUrl) body['life_photo_url'] = lifePhotoUrl;

      if (this.isNew()) {
        body['display_order'] = data.display_order ?? this.teachers().length;
        body['is_active'] = data.is_active ?? true;
        this.api.post<Teacher>('/teachers', body).subscribe({
          next: () => { this.loadTeachers(); this.closeForm(); },
        });
      } else {
        const editing = this.editingTeacher();
        if (editing) {
          this.api.put<Teacher>(`/teachers/${editing.id}`, body).subscribe({
            next: () => { this.loadTeachers(); this.closeForm(); },
          });
        }
      }
    };

    const photoFile = this.photoFile();
    const lifeFile = this.lifePhotoFile();

    if (photoFile || lifeFile) {
      Promise.all([
        photoFile ? this.api.upload<{ url: string }>('/upload/image/teachers', photoFile).toPromise() : Promise.resolve(null),
        lifeFile ? this.api.upload<{ url: string }>('/upload/image/teachers', lifeFile).toPromise() : Promise.resolve(null),
      ]).then(([photoResult, lifeResult]) => {
        doSave(photoResult?.url, lifeResult?.url);
      });
    } else {
      doSave();
    }
  }

  deleteTeacher(teacher: Teacher) {
    if (confirm(`確定要刪除「${teacher.name}」老師嗎？`)) {
      this.api.delete(`/teachers/${teacher.id}`).subscribe({
        next: () => this.loadTeachers(),
      });
    }
  }

  toggleActive(teacher: Teacher) {
    this.api.put(`/teachers/${teacher.id}`, { is_active: !teacher.is_active }).subscribe({
      next: () => this.loadTeachers(),
    });
  }

  moveUp(index: number) {
    if (index === 0) return;
    this.swap(index - 1, index);
  }

  moveDown(index: number) {
    if (index === this.teachers().length - 1) return;
    this.swap(index, index + 1);
  }

  private swap(from: number, to: number) {
    const arr = [...this.teachers()];
    [arr[from], arr[to]] = [arr[to], arr[from]];
    arr.forEach((t, i) => {
      this.api.put(`/teachers/${t.id}`, { display_order: i }).subscribe();
    });
    this.loadTeachers();
  }
}