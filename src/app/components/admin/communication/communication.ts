import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { lastValueFrom } from 'rxjs';

interface Branch {
  id: number; name: string;
}

interface Course {
  id: number; name: string; category: string; grade_level: string; subject: string;
  branch_id: number | null; branch_name?: string;
  day_of_week?: number; days_of_week?: string;
}

interface StudentRow {
  student_id: number;
  student_name: string;
  arrival_time: string;
  departure_time: string;
  progress: string;
  homework: string;
  exam_scope: string;
  announcements: string;
  handout_status: string;
  homework_material: string;
  homework_workbook: string;
  vocab: string;
  exam_score: number | null;
  custom_scores: Record<string, number>;
  tutoring_attendance: boolean;
  reschedule_date: string;
  notes: string;
  parent_feedback: string;
  parent_signed: boolean;
}

interface ExamColumn {
  name: string;
  display_order: number;
}

interface SessionData {
  id: number;
  course_id: number;
  entry_date: string;
  tutoring_threshold: number | null;
  class_progress: string;
  class_homework: string;
  class_exam_scope: string;
  class_announcements: string;
  exam_columns: ExamColumn[];
  students: StudentRowResponse[];
}

interface StudentRowResponse {
  student_id: number;
  student_name: string;
  arrival_time: string | null;
  departure_time: string | null;
  progress: string | null;
  homework: string | null;
  exam_scope: string | null;
  announcements: string | null;
  handout_status: string | null;
  homework_material: string | null;
  homework_workbook: string | null;
  vocab: string | null;
  exam_score: number | null;
  custom_scores: Record<string, number>;
  tutoring_attendance: boolean;
  reschedule_date: string | null;
  notes: string | null;
  parent_feedback: string | null;
  parent_signed: boolean;
}

type ViewMode = 'list' | 'editor';

@Component({
  selector: 'app-admin-communication',
  imports: [FormsModule, CommonModule],
  templateUrl: './communication.html',
  styleUrl: './communication.scss',
})
export class AdminCommunication implements OnInit, OnDestroy {
  viewMode = signal<ViewMode>('list');

  branches = signal<Branch[]>([]);
  selectedBranchId = signal<number | null>(null);
  courses = signal<Course[]>([]);
  filterDate = signal(new Date().toISOString().slice(0, 10));

  selectedCourse = signal<Course | null>(null);
  sessionId: number | null = null;
  entryDate = signal(new Date().toISOString().slice(0, 10));
  tutoringThreshold = signal<number | null>(null);
  classProgress = signal('');
  classHomework = signal('');
  classExamScope = signal('');
  classAnnouncements = signal('');
  examColumns = signal<ExamColumn[]>([]);
  students = signal<StudentRow[]>([]);
  newColumnName = signal('');
  templateMode = signal<'default' | 'english' | 'math'>('default');
  handoutOptions = ['完成', '未完成', '遲交', '未帶', '請假', '調課 (交換)'];
  homeworkMaterialOptions = ['完成', '未完成', '遲交', '未帶', '請假'];
  homeworkWorkbookOptions = ['完成', '未完成', '無計算過程', '未帶', '請假'];
  vocabOptions = ['優異', '普通', '待加強', '請假'];
  draftTimer: any = null;

  saving = signal(false);
  loading = signal(false);
  success = signal('');
  error = signal('');

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadBranches();
    this.loadCourses();
  }

  ngOnDestroy() {
    this.stopDraftTimer();
  }

  async loadBranches() {
    try {
      const res = await lastValueFrom(
        this.api.get<{ id: number; name: string }[]>('/admin/branches')
      );
      this.branches.set(res);
    } catch {}
  }

  async loadCourses() {
    this.loading.set(true);
    try {
      const params: Record<string, any> = {};
      if (this.selectedBranchId()) params['branch_id'] = this.selectedBranchId();
      const res = await lastValueFrom(
        this.api.get<Course[]>('/admin/courses', params)
      );
      this.courses.set(res);
    } catch {
      this.error.set('無法載入課程列表');
    } finally {
      this.loading.set(false);
    }
  }

  filterByBranch(branchId: string) {
    this.selectedBranchId.set(branchId ? Number(branchId) : null);
    this.loadCourses();
  }

  onFilterDateChange() {
    // re-render filtered list
  }

  private getDayNumber(dateStr: string): number {
    const d = new Date(dateStr + 'T00:00:00');
    const jsDay = d.getDay();
    return jsDay === 0 ? 7 : jsDay;
  }

  getFilteredCourses() {
    const dayOfWeek = this.getDayNumber(this.filterDate());
    return this.courses().filter(c => {
      if (c.days_of_week) {
        const days = c.days_of_week.split(',').map(Number);
        return days.includes(dayOfWeek);
      }
      if (c.day_of_week) {
        return c.day_of_week === dayOfWeek;
      }
      return true;
    });
  }

  async selectCourse(course: Course) {
    this.selectedCourse.set(course);
    this.sessionId = null;
    this.entryDate.set(new Date().toISOString().slice(0, 10));
    this.resetClassFields();
    this.examColumns.set([]);
    this.students.set([]);
    this.error.set('');
    this.success.set('');

    await this.tryLoadExistingSession();
    this.viewMode.set('editor');
    this.startDraftTimer();
  }

  private resetClassFields() {
    this.tutoringThreshold.set(null);
    this.classProgress.set('');
    this.classHomework.set('');
    this.classExamScope.set('');
    this.classAnnouncements.set('');
  }

  async tryLoadExistingSession() {
    const course = this.selectedCourse();
    if (!course) return;
    this.loading.set(true);
    try {
      const sessions = await lastValueFrom(
        this.api.get<any[]>('/admin/communication-sessions', {
          course_id: course.id,
        })
      ) as any[];
      const today = this.entryDate();
      const match = sessions.find((s: any) => s.entry_date === today);
      if (match) {
        await this.loadSession(match.id);
      } else {
        await this.loadStudentsList();
      }
    } catch {
      await this.loadStudentsList();
    } finally {
      this.loading.set(false);
    }
  }

  async loadSession(id: number) {
    try {
      const data = await lastValueFrom(
        this.api.get<SessionData>(`/admin/communication-sessions/${id}`)
      );
      this.sessionId = data.id;
      this.tutoringThreshold.set(data.tutoring_threshold);
      this.classProgress.set(data.class_progress || '');
      this.classHomework.set(data.class_homework || '');
      this.classExamScope.set(data.class_exam_scope || '');
      this.classAnnouncements.set(data.class_announcements || '');
      this.examColumns.set(data.exam_columns || []);
      this.entryDate.set(data.entry_date);
      this.students.set(data.students.map(s => ({
        student_id: s.student_id,
        student_name: s.student_name,
        arrival_time: s.arrival_time || '',
        departure_time: s.departure_time || '',
        progress: s.progress || '',
        homework: s.homework || '',
        exam_scope: s.exam_scope || '',
        announcements: s.announcements || '',
        handout_status: s.handout_status || '',
        homework_material: s.homework_material || '',
        homework_workbook: s.homework_workbook || '',
        vocab: s.vocab || '優異',
        exam_score: s.exam_score,
        custom_scores: s.custom_scores || {},
        tutoring_attendance: s.tutoring_attendance,
        reschedule_date: s.reschedule_date || '',
        notes: s.notes || '',
        parent_feedback: s.parent_feedback || '',
        parent_signed: s.parent_signed,
      })));
    } catch {
      this.error.set('無法載入聯絡簿記錄');
    }
  }

  async loadStudentsList() {
    const course = this.selectedCourse();
    if (!course) return;
    try {
      const list = await lastValueFrom(
        this.api.get<any[]>('/admin/students', { course_id: course.id })
      );
      this.students.set(list.map(s => ({
        student_id: s.id,
        student_name: s.student_name,
        arrival_time: '',
        departure_time: '',
        progress: '',
        homework: '',
        exam_scope: '',
        announcements: '',
        handout_status: '完成',
        homework_material: '',
        homework_workbook: '',
        vocab: '優異',
        exam_score: null,
        custom_scores: {},
        tutoring_attendance: false,
        reschedule_date: '',
        notes: '',
        parent_feedback: '',
        parent_signed: false,
      })));
    } catch {
      this.error.set('無法載入學生列表');
      this.students.set([]);
    }
  }

  onChangeDate() {
    if (this.selectedCourse()) {
      this.tryLoadExistingSession();
    }
  }

  goBack() {
    this.stopDraftTimer();
    this.viewMode.set('list');
    this.selectedCourse.set(null);
    this.sessionId = null;
    this.error.set('');
    this.success.set('');
  }

  recalcTutoring() {
    const threshold = this.tutoringThreshold();
    this.students.update(list =>
      list.map(s => ({
        ...s,
        tutoring_attendance: s.exam_score != null && threshold != null
          ? s.exam_score < threshold
          : false,
      }))
    );
  }

  onExamScoreChange() {
    this.recalcTutoring();
  }

  onExamScoreKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== 'ArrowDown') return;
    event.preventDefault();

    const current = event.target as HTMLInputElement;
    const studentList = this.students();
    const columns = this.examColumns();
    const numStudents = studentList.length;
    const numCols = 1 + columns.length; // exam_score + custom columns
    if (numStudents === 0 || numCols === 0) return;

    const allInputs = document.querySelectorAll<HTMLInputElement>('.exam-score-input');
    const currentIdx = Array.from(allInputs).indexOf(current);
    if (currentIdx === -1) return;

    // DOM order: group by student, each student has exam_score + custom cols
    // So currentIdx = row * numCols + col
    const col = currentIdx % numCols;
    const row = Math.floor(currentIdx / numCols);

    // Next position: same column, next row
    let nextRow = row + 1;
    let nextCol = col;
    if (nextRow >= numStudents) {
      // Finished this column, move to next column, first student
      nextRow = 0;
      nextCol = (col + 1) % numCols;
    }

    const nextInputIdx = nextRow * numCols + nextCol;
    const nextInput = allInputs[nextInputIdx];
    nextInput?.focus();
    nextInput?.select();
  }

  onThresholdChange() {
    this.recalcTutoring();
  }

  private lastSynced: Record<string, string> = {};

  syncToStudents(field: string, value: string) {
    const prev = this.lastSynced[field] ?? '';
    this.lastSynced[field] = value;
    this.students.update(list =>
      list.map(s => {
        const cur = (s as any)[field] as string;
        if (!cur || cur === prev) {
          return { ...s, [field]: value };
        }
        return s;
      })
    );
  }

  addExamColumn() {
    const name = this.newColumnName().trim();
    if (!name) return;
    const existing = this.examColumns();
    if (existing.some(c => c.name === name)) {
      this.error.set('欄位名稱已存在');
      return;
    }
    this.examColumns.update(list => [
      ...list,
      { name, display_order: list.length },
    ]);
    this.students.update(list =>
      list.map(s => ({ ...s, custom_scores: { ...s.custom_scores, [name]: 0 } }))
    );
    this.newColumnName.set('');
    this.error.set('');
  }

  removeExamColumn(index: number) {
    const col = this.examColumns()[index];
    if (!col) return;
    this.examColumns.update(list => list.filter((_, i) => i !== index));
    this.students.update(list =>
      list.map(s => {
        const cs = { ...s.custom_scores };
        delete cs[col.name];
        return { ...s, custom_scores: cs };
      })
    );
  }

  async save() {
    const course = this.selectedCourse();
    if (!course) return;
    this.error.set('');
    this.success.set('');
    this.saving.set(true);

    try {
      const payload = this.buildPayload();

      if (this.sessionId) {
        await lastValueFrom(
          this.api.put(`/admin/communication-sessions/${this.sessionId}`, payload)
        );
      } else {
        const created = await lastValueFrom(
          this.api.post<any>('/admin/communication-sessions', payload)
        );
        this.sessionId = created.id;
      }
      this.success.set('聯絡簿記錄已儲存！');
    } catch (err: any) {
      this.error.set(err.error?.detail || '儲存失敗，請稍後再試');
    } finally {
      this.saving.set(false);
    }
  }

  async deleteSession() {
    if (!this.sessionId) return;
    if (!confirm('確定刪除此聯絡簿記錄？所有學生的資料將一併刪除。')) return;
    try {
      await lastValueFrom(
        this.api.delete(`/admin/communication-sessions/${this.sessionId}`)
      );
      this.success.set('已刪除');
      this.goBack();
    } catch {
      this.error.set('刪除失敗');
    }
  }

  startDraftTimer() {
    this.stopDraftTimer();
    this.draftTimer = setInterval(() => {
      if (this.selectedCourse()) {
        this.saveDraft();
      }
    }, 30000);
  }

  stopDraftTimer() {
    if (this.draftTimer) {
      clearInterval(this.draftTimer);
      this.draftTimer = null;
    }
  }

  async saveDraft() {
    if (!this.selectedCourse() || this.saving()) return;
    this.saving.set(true);
    try {
      const payload = this.buildPayload();
      if (this.sessionId) {
        await lastValueFrom(this.api.put(`/admin/communication-sessions/${this.sessionId}`, payload));
      } else {
        const created = await lastValueFrom(this.api.post<any>('/admin/communication-sessions', payload));
        this.sessionId = created.id;
      }
    } catch {
      // silent
    } finally {
      this.saving.set(false);
    }
  }

  private buildPayload() {
    const course = this.selectedCourse()!;
    return {
      course_id: course.id,
      entry_date: this.entryDate(),
      tutoring_threshold: this.tutoringThreshold(),
      class_progress: this.classProgress() || null,
      class_homework: this.classHomework() || null,
      class_exam_scope: this.classExamScope() || null,
      class_announcements: this.classAnnouncements() || null,
      exam_columns: this.examColumns().map((c, i) => ({ name: c.name, display_order: i })),
      students: this.students().map(s => ({
        student_id: s.student_id,
        arrival_time: s.arrival_time || null,
        departure_time: s.departure_time || null,
        progress: s.progress || null,
        homework: s.homework || null,
        exam_scope: s.exam_scope || null,
        announcements: s.announcements || null,
        handout_status: s.handout_status || null,
        homework_material: s.homework_material || null,
        homework_workbook: s.homework_workbook || null,
        vocab: s.vocab || null,
        exam_score: s.exam_score,
        custom_scores: s.custom_scores,
        tutoring_attendance: s.tutoring_attendance,
        reschedule_date: s.reschedule_date || null,
        notes: s.notes || null,
      })),
    };
  }

  trackByStudent(index: number, s: StudentRow): number {
    return s.student_id;
  }
}
