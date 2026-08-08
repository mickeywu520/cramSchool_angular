import { Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';
import { lastValueFrom } from 'rxjs';

export interface StudentRef {
  id: number;
  student_name: string;
  grade?: string;
  school?: string;
  avatar_url?: string | null;
}

const STORAGE_KEY = 'selected_student_id';

@Injectable({ providedIn: 'root' })
export class StudentContextService {
  students = signal<StudentRef[]>([]);
  selectedId = signal<number | null>(null);
  loaded = false;
  private listeners: (() => void)[] = [];

  constructor(private api: ApiService) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const n = Number(stored);
      if (Number.isInteger(n) && n > 0) {
        this.selectedId.set(n);
      }
    }
  }

  /** 目前使用者可存取的全部學生 */
  async loadStudents(): Promise<StudentRef[]> {
    if (this.loaded) {
      return this.students();
    }
    try {
      const list = await lastValueFrom(this.api.get<StudentRef[]>('/student/mine'));
      this.students.set(list || []);
      this.loaded = true;
      if (list && list.length > 0 && !list.some(s => s.id === this.selectedId())) {
        this.select(list[0].id, false);
      }
    } catch {
      this.students.set([]);
    }
    return this.students();
  }

  /** 使用者未關聯任何學生時為 true（例如以 email 登入的家長尚未綁定小孩） */
  get noStudents(): boolean {
    return this.loaded && this.students().length === 0;
  }

  /** 多學生時才顯示切換器 */
  get showSwitcher(): boolean {
    return this.students().length > 1;
  }

  get currentStudent(): StudentRef | null {
    return this.students().find(s => s.id === this.selectedId()) || null;
  }

  select(studentId: number, persist = true) {
    this.selectedId.set(studentId);
    if (persist) {
      localStorage.setItem(STORAGE_KEY, String(studentId));
    }
    this.listeners.forEach(fn => fn());
  }

  /** 切換選定學生後，頁面註冊此回呼重新載入資料；回傳取消訂閱函式 */
  onStudentChange(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      const i = this.listeners.indexOf(fn);
      if (i >= 0) this.listeners.splice(i, 1);
    };
  }

  /** 帶到 API query param 的學生 id（僅有多學生時才傳，避免單一學生被遮罩） */
  get param(): Record<string, number | null> {
    return this.showSwitcher ? { student_id: this.selectedId() } : {};
  }

  reset() {
    this.loaded = false;
    this.students.set([]);
    localStorage.removeItem(STORAGE_KEY);
    this.selectedId.set(null);
    this.listeners = [];
  }
}
