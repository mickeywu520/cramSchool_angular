import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

interface Honor {
  id: number;
  student_name: string;
  school: string;
  department: string;
  year: number;
  exam_type: string;
  display_order: number;
}

@Component({
  selector: 'app-admin-honors',
  imports: [FormsModule],
  templateUrl: './honors.html',
  styleUrl: './honors.scss',
})
export class AdminHonors implements OnInit {
  honors = signal<Honor[]>([]);
  loading = signal(false);

  showForm = signal(false);
  isNew = signal(false);
  editingHonor = signal<Honor | null>(null);
  formData = signal<Partial<Honor>>({});
  maxHonors = 40;

  examTypeOptions = ['會考', '學測', '分科', '其他'];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadHonors();
  }

  get canAdd() {
    return this.honors().length < this.maxHonors;
  }

  loadHonors() {
    this.loading.set(true);
    this.api.get<{ total: number; honors: Honor[] }>('/honors').subscribe({
      next: (data) => {
        this.honors.set(data.honors || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openNewForm() {
    if (!this.canAdd) return;
    this.isNew.set(true);
    this.formData.set({ student_name: '', school: '', department: '', year: new Date().getFullYear() - 1911, exam_type: '學測', display_order: this.honors().length });
    this.showForm.set(true);
  }

  openEditForm(honor: Honor) {
    this.isNew.set(false);
    this.editingHonor.set(honor);
    this.formData.set({ ...honor });
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingHonor.set(null);
    this.formData.set({});
  }

  save() {
    const data = this.formData();
    if (!data.student_name || !data.school || !data.department) return;

    const body = {
      student_name: data.student_name,
      school: data.school,
      department: data.department,
      year: data.year ?? new Date().getFullYear() - 1911,
      exam_type: data.exam_type || '學測',
      display_order: data.display_order ?? this.honors().length,
    };

    if (this.isNew()) {
      this.api.post<Honor>('/honors', body).subscribe({
        next: () => { this.loadHonors(); this.closeForm(); },
      });
    } else {
      const editing = this.editingHonor();
      if (editing) {
        this.api.put<Honor>(`/honors/${editing.id}`, body).subscribe({
          next: () => { this.loadHonors(); this.closeForm(); },
        });
      }
    }
  }

  deleteHonor(honor: Honor) {
    if (confirm(`確定要刪除「${honor.student_name}」的榜單紀錄嗎？`)) {
      this.api.delete(`/honors/${honor.id}`).subscribe({
        next: () => this.loadHonors(),
      });
    }
  }

  moveUp(index: number) {
    if (index === 0) return;
    this.swap(index - 1, index);
  }

  moveDown(index: number) {
    if (index === this.honors().length - 1) return;
    this.swap(index, index + 1);
  }

  private swap(from: number, to: number) {
    const arr = [...this.honors()];
    [arr[from], arr[to]] = [arr[to], arr[from]];
    arr.forEach((h, i) => {
      this.api.put(`/honors/${h.id}`, { display_order: i }).subscribe();
    });
    this.loadHonors();
  }
}