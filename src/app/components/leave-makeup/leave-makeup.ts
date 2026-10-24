import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { StudentContextService } from '../../services/student-context.service';

interface CourseSummary {
  id: number;
  name: string;
  subject: string;
  days_of_week?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  teacher_name?: string | null;
}

interface LeaveRecord {
  id: number;
  student_id: number | null;
  course_id: number | null;
  leave_date: string;
  leave_type: string;
  reason: string | null;
  status: string;
  course_name: string | null;
  student_name: string | null;
  requested_room_id: number | null;
  requested_room_code: string | null;
  requested_makeup_date: string | null;
  requested_makeup_start: string | null;
  requested_makeup_end: string | null;
  review_note: string | null;
  created_at: string;
}

interface MakeupRecord {
  id: number;
  leave_id: number | null;
  course_id: number;
  course_name: string | null;
  makeup_date: string;
  start_time: string;
  end_time: string;
  classroom: string | null;
  status: string;
  requested_by?: string;
  notes: string | null;
}

/** 家長可選的補課場次（補課教室的固定時段） */
interface MakeupOption {
  date: string;
  weekday: number;
  start_time: string;
  end_time: string;
  room_id: number;
  room_code: string;
  room_name: string;
  branch_name: string | null;
  capacity: number;
  booked: number;
  seats_left: number;
  full: boolean;
}

/** 日曆上一格 = 一堂課（課程 + 日期） */
interface CalendarChip {
  courseId: number;
  courseName: string;
  time: string;
  date: string;
  leave: LeaveRecord | null;
  makeup: MakeupRecord | null;
  past: boolean;
}

interface CalendarDay {
  iso: string;
  dayNum: number;
  weekday: string;
  isToday: boolean;
  chips: CalendarChip[];
}

const LEAVE_TYPES: { value: string; label: string }[] = [
  { value: 'sick', label: '病假' },
  { value: 'personal', label: '事假' },
  { value: 'other', label: '其他' },
];

const STATUS_MAP: Record<string, { label: string; cls: string; icon: string; iconCls: string }> = {
  pending: {
    label: '待審核',
    cls: 'bg-orange-100 text-orange-700',
    icon: 'pending',
    iconCls: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
  },
  approved: {
    label: '已核准',
    cls: 'bg-green-100 text-green-700',
    icon: 'check_circle',
    iconCls: 'bg-green-100 dark:bg-green-900/30 text-green-600',
  },
  rejected: {
    label: '已駁回',
    cls: 'bg-red-100 text-red-700',
    icon: 'cancel',
    iconCls: 'bg-red-100 dark:bg-red-900/30 text-red-600',
  },
};

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

@Component({
  selector: 'app-leave-makeup',
  imports: [RouterLink, FormsModule],
  templateUrl: './leave-makeup.html',
  styleUrl: './leave-makeup.scss',
})
export class LeaveMakeup implements OnInit, OnDestroy {
  readonly leaveTypes = LEAVE_TYPES;
  readonly weekdays = ['一', '二', '三', '四', '五', '六', '日'];

  loading = signal(true);
  saving = signal(false);
  formOpen = signal(false);
  rulesOpen = signal(false);

  courses = signal<CourseSummary[]>([]);
  applications = signal<LeaveRecord[]>([]);
  makeups = signal<MakeupRecord[]>([]);
  rules = signal<string>('');
  /** 同一門課可補課的未來場次（家長必選一個） */
  makeupOptions = signal<MakeupOption[]>([]);
  optionsLoading = signal(false);

  errorMsg = signal('');
  successMsg = signal('');

  /** 目前顯示的那一週（週一） */
  weekStart = signal<Date>(this.mondayOf(new Date()));

  /** 沒有設定上課星期的課程 → 不會出現在日曆 */
  unscheduled = computed(() =>
    this.courses().filter((c) => this.parseDays(c.days_of_week).size === 0),
  );

  /** 日曆資料（課程 × 本週日期 × 請假/補課狀態） */
  weekGrid = computed<CalendarDay[]>(() => {
    const start = this.weekStart();
    const today = this.todayIso();
    const courses = this.courses();
    const apps = this.applications();
    const makeups = this.makeups();

    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const d = this.addDays(start, i);
      const iso = this.isoOf(d);
      const dow = d.getDay() === 0 ? 7 : d.getDay();
      const chips: CalendarChip[] = [];

      for (const c of courses) {
        if (!this.occursOn(c, dow, iso)) continue;
        const leave = apps.find((a) => a.course_id === c.id && a.leave_date === iso) ?? null;
        const makeup = leave ? (makeups.find((m) => m.leave_id === leave.id) ?? null) : null;
        chips.push({
          courseId: c.id,
          courseName: (c.name || '').trim(),
          time: this.timeRange(c),
          date: iso,
          leave,
          makeup,
          past: iso < today,
        });
      }

      chips.sort((a, b) => a.time.localeCompare(b.time));
      days.push({
        iso,
        dayNum: d.getDate(),
        weekday: WEEKDAY_LABELS[d.getDay()],
        isToday: iso === today,
        chips,
      });
    }
    return days;
  });

  /** 本週是否至少有一堂課 */
  weekHasClass = computed(() => this.weekGrid().some((d) => d.chips.length > 0));

  // 表單欄位
  courseId: number | null = null;
  leaveDate = '';
  leaveType = 'personal';
  reason = '';
  // 家長選定的補課場次（補課教室 + 日期 + 時段）
  makeupRoomId: number | null = null;
  makeupDate = '';
  makeupStart = '';
  makeupEnd = '';

  private unsub: (() => void) | null = null;

  constructor(
    private api: ApiService,
    public ctx: StudentContextService,
  ) {}

  async ngOnInit() {
    window.scrollTo(0, 0);
    this.leaveDate = this.todayIso();
    await this.ctx.loadStudents();
    await this.loadAll();
    this.unsub = this.ctx.onStudentChange(() => this.loadAll());
  }

  ngOnDestroy() {
    this.unsub?.();
  }

  // ---------- 日期工具 ----------

  private isoOf(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private todayIso(): string {
    return this.isoOf(new Date());
  }

  /** 取該日期所屬那一週的週一 */
  private mondayOf(d: Date): Date {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dow = x.getDay() === 0 ? 7 : x.getDay();
    x.setDate(x.getDate() - (dow - 1));
    return x;
  }

  private addDays(d: Date, n: number): Date {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() + n);
    return x;
  }

  /** "1,3,5" → {1,3,5}；0 視為週日（7） */
  private parseDays(raw?: string | null): Set<number> {
    const out = new Set<number>();
    if (!raw) return out;
    for (const part of String(raw).replace(/[、;]/g, ',').split(',')) {
      const n = Number(part.trim());
      if (!Number.isFinite(n) || n < 0 || n > 7) continue;
      out.add(n === 0 ? 7 : n);
    }
    return out;
  }

  private occursOn(c: CourseSummary, dow: number, iso: string): boolean {
    if (!this.parseDays(c.days_of_week).has(dow)) return false;
    if (c.start_date && iso < c.start_date) return false;
    if (c.end_date && iso > c.end_date) return false;
    return true;
  }

  /** 課程時間 "1800"/"2000" → "18:00-20:00" */
  private fmtTime(raw?: string | null): string {
    if (!raw) return '';
    const s = String(raw).trim();
    if (/^\d{4}$/.test(s)) return `${s.slice(0, 2)}:${s.slice(2)}`;
    return s;
  }

  timeRange(c: CourseSummary): string {
    const a = this.fmtTime(c.start_time);
    const b = this.fmtTime(c.end_time);
    return a && b ? `${a}-${b}` : a || b || '';
  }

  // ---------- 週切換 ----------

  shiftWeek(n: number) {
    this.weekStart.set(this.addDays(this.weekStart(), n * 7));
  }

  goThisWeek() {
    this.weekStart.set(this.mondayOf(new Date()));
  }

  weekLabel(): string {
    const s = this.weekStart();
    const e = this.addDays(s, 6);
    return `${s.getMonth() + 1}/${s.getDate()} - ${e.getMonth() + 1}/${e.getDate()}`;
  }

  // ---------- 日曆互動 ----------

  /** 點日曆上的課 → 帶入表單，並載入同課程可補課的場次 */
  pickClass(chip: CalendarChip) {
    if (chip.past) return;
    if (chip.leave && chip.leave.status !== 'rejected') return;

    this.courseId = chip.courseId;
    this.leaveDate = chip.date;
    this.clearMakeup();
    this.errorMsg.set('');
    this.successMsg.set('');
    this.formOpen.set(true);
    void this.loadMakeupOptions();

    setTimeout(() => {
      document.getElementById('leave-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  }

  chipClass(chip: CalendarChip): string {
    if (chip.makeup) return 'bg-accent-gold/20 text-accent-gold ring-1 ring-accent-gold/40';
    if (chip.leave?.status === 'approved') {
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    }
    if (chip.leave?.status === 'pending') {
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    }
    if (chip.leave?.status === 'rejected') {
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    }
    if (chip.past) return 'bg-gray-100 text-gray-300 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed';
    if (this.courseId === chip.courseId && this.leaveDate === chip.date) {
      return 'bg-primary text-white shadow-sm';
    }
    return 'bg-primary/10 text-primary hover:bg-primary/20';
  }

  isPicked(chip: CalendarChip): boolean {
    return this.courseId === chip.courseId && this.leaveDate === chip.date;
  }

  unscheduledNames(): string {
    return this.unscheduled()
      .map((c) => (c.name || '').trim())
      .join('、');
  }

  selectedCourseName(): string {
    const c = this.courses().find((x) => x.id === this.courseId);
    return c ? (c.name || '').trim() : '';
  }

  // ---------- 補課場次 ----------

  private parseIso(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  /** 表單換課程 / 換請假日期 → 重新載入可補課場次 */
  onCourseOrDateChange() {
    this.clearMakeup();
    void this.loadMakeupOptions();
  }

  /** 載入「請假日期之後」可補課的教室場次（後端已依學生分校過濾） */
  async loadMakeupOptions() {
    const courseId = this.courseId;
    if (courseId === null || !this.leaveDate) {
      this.makeupOptions.set([]);
      return;
    }
    this.optionsLoading.set(true);
    try {
      const dateFrom = this.isoOf(this.addDays(this.parseIso(this.leaveDate), 1));
      const opts = await lastValueFrom(
        this.api.get<MakeupOption[]>('/leave/makeup-options', {
          course_id: courseId,
          date_from: dateFrom,
          ...this.ctx.param,
        }),
      );
      const list = opts ?? [];
      this.makeupOptions.set(list);
      // 原本選的場次若已不存在或已額滿，就清掉選擇
      const picked = this.pickedOption();
      if (this.makeupDate && (!picked || picked.full)) {
        this.clearMakeup();
      }
    } catch {
      this.makeupOptions.set([]);
    } finally {
      this.optionsLoading.set(false);
    }
  }

  pickMakeupOption(o: MakeupOption) {
    if (this.optionFull(o)) {
      this.errorMsg.set('這個時段已經額滿，請選其他時段');
      return;
    }
    this.makeupRoomId = o.room_id;
    this.makeupDate = o.date;
    this.makeupStart = o.start_time;
    this.makeupEnd = o.end_time;
    this.errorMsg.set('');
  }

  isMakeupPicked(o: MakeupOption): boolean {
    return (
      this.makeupRoomId === o.room_id &&
      this.makeupDate === o.date &&
      this.makeupStart === o.start_time
    );
  }

  /** 目前選定的場次（找不到回 null） */
  pickedOption(): MakeupOption | null {
    return (
      this.makeupOptions().find(
        (o) =>
          o.room_id === this.makeupRoomId &&
          o.date === this.makeupDate &&
          o.start_time === this.makeupStart,
      ) ?? null
    );
  }

  clearMakeup() {
    this.makeupRoomId = null;
    this.makeupDate = '';
    this.makeupStart = '';
    this.makeupEnd = '';
  }

  /** 補課場次是否已滿（後端硬性阻擋，前端只負責不讓點） */
  optionFull(o: MakeupOption): boolean {
    return o.full === true || o.seats_left <= 0;
  }

  optionSeats(o: MakeupOption): string {
    return o.seats_left > 0 ? `剩 ${o.seats_left} / ${o.capacity} 位` : '已滿';
  }

  /** 送出前的摘要：請 11月1日 (六) → 補 11月7日 (五) 補A 14:00-16:00 */
  makeupSummary(): string {
    if (!this.makeupDate) return '';
    const room = this.pickedOption()?.room_name ?? '';
    const time = this.makeupStart
      ? ` ${this.makeupStart}${this.makeupEnd ? '-' + this.makeupEnd : ''}`
      : '';
    return `補 ${this.formatDate(this.makeupDate)} ${room}${time}`.replace(/\s+/g, ' ').trim();
  }

  // ---------- API ----------

  /** 送出時帶上 student_id（多學生 / 家長帳號才需要） */
  private get qs(): string {
    const id = this.ctx.param['student_id'];
    return id ? `?student_id=${id}` : '';
  }

  async loadAll() {
    this.loading.set(true);
    this.errorMsg.set('');
    try {
      const [courses, apps, makeups, rules] = await Promise.all([
        lastValueFrom(this.api.get<CourseSummary[]>('/student/courses', this.ctx.param)),
        lastValueFrom(
          this.api.get<{ total: number; applications: LeaveRecord[] }>(
            '/leave/applications',
            this.ctx.param,
          ),
        ),
        lastValueFrom(this.api.get<MakeupRecord[]>('/leave/makeup', this.ctx.param)),
        lastValueFrom(this.api.get<{ rules: string }>('/leave/rules')).catch(() => ({ rules: '' })),
      ]);
      this.courses.set(courses ?? []);
      this.applications.set(apps?.applications ?? []);
      this.makeups.set(makeups ?? []);
      this.rules.set(rules?.rules ?? '');
      if (this.courseId === null && (courses ?? []).length > 0) {
        this.courseId = courses[0].id;
      }
    } catch (e) {
      this.errorMsg.set(this.msgOf(e, '載入請假資料失敗，請稍後再試'));
    } finally {
      this.loading.set(false);
    }
  }

  toggleForm() {
    this.formOpen.update((v) => !v);
    this.errorMsg.set('');
    this.successMsg.set('');
    if (this.formOpen()) {
      void this.loadMakeupOptions();
    }
  }

  async submit() {
    this.errorMsg.set('');
    this.successMsg.set('');

    if (this.courseId === null) {
      this.errorMsg.set('請選擇要請假的課程');
      return;
    }
    if (!this.leaveDate) {
      this.errorMsg.set('請選擇請假日期');
      return;
    }
    if (this.leaveDate < this.todayIso()) {
      this.errorMsg.set('請假日期不可為過去日期');
      return;
    }
    if (
      this.makeupRoomId === null ||
      !this.makeupDate ||
      !this.makeupStart ||
      !this.makeupEnd
    ) {
      this.errorMsg.set('請選擇補課教室與時段（請假日期之後）');
      return;
    }

    this.saving.set(true);
    try {
      await lastValueFrom(
        this.api.post<LeaveRecord>(`/leave/applications${this.qs}`, {
          course_id: this.courseId,
          leave_date: this.leaveDate,
          leave_type: this.leaveType,
          reason: this.reason.trim() || null,
          requested_room_id: this.makeupRoomId,
          requested_makeup_date: this.makeupDate,
          requested_makeup_start: this.makeupStart,
          requested_makeup_end: this.makeupEnd,
        }),
      );
      this.successMsg.set('請假與補課申請已送出，等待老師一次核准');
      this.reason = '';
      this.clearMakeup();
      this.formOpen.set(false);
      await this.loadAll();
    } catch (e) {
      this.errorMsg.set(this.msgOf(e, '送出失敗，請稍後再試'));
    } finally {
      this.saving.set(false);
    }
  }

  async cancel(record: LeaveRecord) {
    if (!confirm(`確定要取消 ${this.formatDate(record.leave_date)} 的請假申請嗎？`)) {
      return;
    }
    this.errorMsg.set('');
    this.successMsg.set('');
    try {
      await lastValueFrom(this.api.delete(`/leave/applications/${record.id}${this.qs}`));
      this.successMsg.set('已取消請假申請');
      await this.loadAll();
    } catch (e) {
      this.errorMsg.set(this.msgOf(e, '取消失敗，請稍後再試'));
    }
  }

  typeLabel(type: string): string {
    return LEAVE_TYPES.find((t) => t.value === type)?.label ?? type;
  }

  statusOf(status: string) {
    return STATUS_MAP[status] ?? STATUS_MAP['pending'];
  }

  /** "2026-11-15" → "11月15日 (日)" */
  formatDate(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return iso;
    const day = WEEKDAY_LABELS[new Date(y, m - 1, d).getDay()];
    return `${m}月${d}日 (${day})`;
  }

  courseSchedule(c: CourseSummary): string {
    const days = [...this.parseDays(c.days_of_week)].sort().join('、');
    const time = this.timeRange(c);
    return [days ? `週${days}` : '', time].filter(Boolean).join(' ');
  }

  private msgOf(e: unknown, fallback: string): string {
    const err = e as { error?: { message?: string; detail?: string }; message?: string };
    return err?.error?.message || err?.error?.detail || err?.message || fallback;
  }
}
