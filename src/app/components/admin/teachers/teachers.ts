import { Component, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Teacher {
  id: number;
  name: string;
  subject: string;
  title: string;
  motto: string;
  description: string;
  photo_url: string;
  life_photo_url: string;
  display_order: number;
  is_active: boolean;
}

@Component({
  selector: 'app-admin-teachers',
  imports: [FormsModule],
  templateUrl: './teachers.html',
  styleUrl: './teachers.scss',
})
export class AdminTeachers implements OnInit {
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cdr.detectChanges();
  }

  // TODO: [API對接] 替換為 GET /api/homepage/teachers 取得資料
  // 目前為 hard-coded dummy 資料供 UI 展示（13位老師）
  teachers = signal<Teacher[]>([
    { id: 1, name: '程昊', subject: '數學', title: '資深數學講師', motto: '陪伴孩子成長的數學領航員', description: '數學不是背公式，是學邏輯。', photo_url: '/teachers/程昊_photo.jpg', life_photo_url: '/teachers/程昊_life.jpg', display_order: 0, is_active: true },
    { id: 2, name: '秦清', subject: '國文', title: '國文科講師', motto: '把複雜的事情簡單化', description: '國文是文化的根基。', photo_url: '/teachers/秦清_photo.jpg', life_photo_url: '/teachers/秦清_life.jpg', display_order: 1, is_active: true },
    { id: 3, name: 'Eva', subject: '英文', title: '英文科講師', motto: '把英文變得簡單好理解', description: '語言是打開世界的鑰匙。', photo_url: '/teachers/Eva_photo.jpg', life_photo_url: '/teachers/Eva_life.jpg', display_order: 2, is_active: true },
    { id: 4, name: '段諭', subject: '理化', title: '理化科講師', motto: '教育是傳承', description: '科學讓世界更美好。', photo_url: '/teachers/段諭_photo.jpg', life_photo_url: '/teachers/段諭_life.jpg', display_order: 3, is_active: true },
    { id: 5, name: 'Howard', subject: '英文', title: '外籍英文講師', motto: 'English is fun!', description: '讓孩子愛上英文。', photo_url: '/teachers/Howard_photo.jpg', life_photo_url: '/teachers/Howard_life.jpg', display_order: 4, is_active: true },
    { id: 6, name: '伯壎', subject: '數學', title: '數學科講師', motto: '數學讓思維更清晰', description: '用心教學，耐心引導。', photo_url: '/teachers/伯壎_photo.jpg', life_photo_url: '/teachers/伯壎_life.jpg', display_order: 5, is_active: true },
    { id: 7, name: '張丞', subject: '理化', title: '理化科講師', motto: '探索科學的奧秘', description: '動手做實驗，理解科學。', photo_url: '/teachers/張丞_photo.jpg', life_photo_url: '/teachers/張丞_life.jpg', display_order: 6, is_active: true },
    { id: 8, name: '張羽', subject: '數學', title: '數學科講師', motto: '數學是訓練邏輯的最佳工具', description: '因材施教，啟發思考。', photo_url: '/teachers/張羽_photo.jpg', life_photo_url: '/teachers/張羽_life.jpg', display_order: 7, is_active: true },
    { id: 9, name: '彤妤', subject: '國文', title: '國文科講師', motto: '文學豐富人生', description: '閱讀與寫作並重。', photo_url: '/teachers/彤妤_photo.jpg', life_photo_url: '/teachers/彤妤_life.jpg', display_order: 8, is_active: true },
    { id: 10, name: '李暘', subject: '英文', title: '英文科講師', motto: '語言無國界', description: '活潑教學，快樂學習。', photo_url: '/teachers/李暘_photo.jpg', life_photo_url: '/teachers/李暘_life.jpg', display_order: 9, is_active: true },
    { id: 11, name: '李詠', subject: '數學', title: '數學科講師', motto: '解題的樂趣', description: '一步步引導學生思考。', photo_url: '/teachers/李詠_photo.jpg', life_photo_url: '/teachers/李詠_life.jpg', display_order: 10, is_active: true },
    { id: 12, name: '王御', subject: '理化', title: '理化科講師', motto: '科學即生活', description: '從生活中學科學。', photo_url: '/teachers/王御_photo.jpg', life_photo_url: '/teachers/王御_life.jpg', display_order: 11, is_active: true },
    { id: 13, name: '翟雨時', subject: '國文', title: '國文科講師', motto: '文字的力量', description: '培養孩子的文學素養。', photo_url: '/teachers/翟雨時_photo.jpg', life_photo_url: '/teachers/翟雨時_life.jpg', display_order: 12, is_active: true },
  ]);

  showForm = signal(false);
  isNew = signal(false);
  editingTeacher = signal<Teacher | null>(null);
  formData = signal<Partial<Teacher>>({});
  photoPreview = signal<string | null>(null);
  lifePhotoPreview = signal<string | null>(null);

  subjectOptions = ['數學', '英文', '理化', '國文', '作文'];

  openNewForm() {
    this.isNew.set(true);
    this.formData.set({ name: '', subject: '數學', title: '', motto: '', description: '', photo_url: '', life_photo_url: '', display_order: this.teachers().length, is_active: true });
    this.photoPreview.set(null);
    this.lifePhotoPreview.set(null);
    this.showForm.set(true);
  }

  openEditForm(teacher: Teacher) {
    this.isNew.set(false);
    this.editingTeacher.set(teacher);
    this.formData.set({ ...teacher });
    this.photoPreview.set(teacher.photo_url);
    this.lifePhotoPreview.set(teacher.life_photo_url);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingTeacher.set(null);
    this.formData.set({});
    this.photoPreview.set(null);
    this.lifePhotoPreview.set(null);
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.photoPreview.set(result);
        this.formData.update(d => ({ ...d, photo_url: result }));
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  onLifePhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.lifePhotoPreview.set(result);
        this.formData.update(d => ({ ...d, life_photo_url: result }));
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  save() {
    const data = this.formData();
    if (!data.name || !data.subject) return;

    if (this.isNew()) {
      const newTeacher: Teacher = {
        id: Date.now(),
        name: data.name || '',
        subject: data.subject || '數學',
        title: data.title || '',
        motto: data.motto || '',
        description: data.description || '',
        photo_url: data.photo_url || '',
        life_photo_url: data.life_photo_url || '',
        display_order: data.display_order || 0,
        is_active: data.is_active ?? true,
      };
      this.teachers.update(list => [...list, newTeacher]);
    } else {
      const editing = this.editingTeacher();
      if (editing) {
        this.teachers.update(list =>
          list.map(t => t.id === editing.id ? { ...t, ...data } as Teacher : t)
        );
      }
    }
    this.closeForm();
  }

  deleteTeacher(teacher: Teacher) {
    if (confirm(`確定要刪除「${teacher.name}」老師嗎？`)) {
      this.teachers.update(list => list.filter(t => t.id !== teacher.id));
    }
  }

  toggleActive(teacher: Teacher) {
    this.teachers.update(list =>
      list.map(t => t.id === teacher.id ? { ...t, is_active: !t.is_active } : t)
    );
  }

  moveUp(index: number) {
    if (index === 0) return;
    this.teachers.update(list => {
      const arr = [...list];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr.map((t, i) => ({ ...t, display_order: i }));
    });
  }

  moveDown(index: number) {
    if (index === this.teachers().length - 1) return;
    this.teachers.update(list => {
      const arr = [...list];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr.map((t, i) => ({ ...t, display_order: i }));
    });
  }
}