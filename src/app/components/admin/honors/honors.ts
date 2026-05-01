import { Component, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cdr.detectChanges();
  }

  // TODO: [API對接] 替換為 GET /api/homepage/honors 取得資料
  // 目前為 hard-coded dummy 資料供 UI 展示（8筆範例）
  honors = signal<Honor[]>([
    { id: 1, student_name: '許O恩', school: '南山', department: '國立臺灣大學 電機工程學系', year: 114, exam_type: '學測', display_order: 0 },
    { id: 2, student_name: '林O翰', school: '南山', department: '國立臺灣大學 電機工程學系', year: 114, exam_type: '學測', display_order: 1 },
    { id: 3, student_name: '曾O容', school: '南山', department: '國立臺灣大學 物理治療學系', year: 114, exam_type: '學測', display_order: 2 },
    { id: 4, student_name: '陳O心', school: '南山', department: '國立臺灣大學 大氣科學系', year: 114, exam_type: '學測', display_order: 3 },
    { id: 5, student_name: '吳O昀', school: '南山', department: '國立臺灣大學 中國文學系', year: 114, exam_type: '學測', display_order: 4 },
    { id: 6, student_name: '王O涵', school: '南山', department: '國立臺灣大學 資訊管理學系', year: 114, exam_type: '學測', display_order: 5 },
    { id: 7, student_name: '黃O蓉', school: '南山', department: '臺北醫學大學 藥學系', year: 114, exam_type: '學測', display_order: 6 },
    { id: 8, student_name: '鄭O銘', school: '南山', department: '臺北醫學大學 醫學檢驗暨生物技術學系', year: 114, exam_type: '學測', display_order: 7 },
  ]);

  showForm = signal(false);
  isNew = signal(false);
  editingHonor = signal<Honor | null>(null);
  formData = signal<Partial<Honor>>({});
  maxHonors = 40;

  examTypeOptions = ['會考', '學測', '指考', '其他'];

  get canAdd() {
    return this.honors().length < this.maxHonors;
  }

  openNewForm() {
    if (!this.canAdd) return;
    this.isNew.set(true);
    this.formData.set({ student_name: '', school: '', department: '', year: 114, exam_type: '學測', display_order: this.honors().length });
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

    if (this.isNew()) {
      const newHonor: Honor = {
        id: Date.now(),
        student_name: data.student_name || '',
        school: data.school || '',
        department: data.department || '',
        year: data.year || 114,
        exam_type: data.exam_type || '學測',
        display_order: data.display_order || 0,
      };
      this.honors.update(list => [...list, newHonor]);
    } else {
      const editing = this.editingHonor();
      if (editing) {
        this.honors.update(list =>
          list.map(h => h.id === editing.id ? { ...h, ...data } as Honor : h)
        );
      }
    }
    this.closeForm();
  }

  deleteHonor(honor: Honor) {
    if (confirm(`確定要刪除「${honor.student_name}」的榜單紀錄嗎？`)) {
      this.honors.update(list => list.filter(h => h.id !== honor.id));
    }
  }

  moveUp(index: number) {
    if (index === 0) return;
    this.honors.update(list => {
      const arr = [...list];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr.map((h, i) => ({ ...h, display_order: i }));
    });
  }

  moveDown(index: number) {
    if (index === this.honors().length - 1) return;
    this.honors.update(list => {
      const arr = [...list];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr.map((h, i) => ({ ...h, display_order: i }));
    });
  }
}