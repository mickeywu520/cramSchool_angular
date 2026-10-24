import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

interface RoomSlot {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_today: boolean;
  today_booked: number;
  today_seats_left: number | null;
}

interface MakeupRoom {
  id: number;
  branch_id: number | null;
  branch_name: string | null;
  code: string;
  name: string | null;
  display_name: string;
  capacity: number;
  is_active: boolean;
  display_order: number;
  notes: string | null;
  slots: RoomSlot[];
  today_booked: number;
}

interface Branch {
  id: number;
  name: string;
  is_active: boolean;
}

const WEEKDAYS = [
  { value: 1, label: '週一' },
  { value: 2, label: '週二' },
  { value: 3, label: '週三' },
  { value: 4, label: '週四' },
  { value: 5, label: '週五' },
  { value: 6, label: '週六' },
  { value: 7, label: '週日' },
];

@Component({
  selector: 'app-admin-makeup-rooms',
  imports: [FormsModule],
  templateUrl: './makeup-rooms.html',
  styleUrl: './makeup-rooms.scss',
})
export class AdminMakeupRooms implements OnInit {
  readonly weekdays = WEEKDAYS;

  rooms = signal<MakeupRoom[]>([]);
  branches = signal<Branch[]>([]);
  loading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  /** 分校篩選（null = 全部） */
  branchFilter = signal<number | null>(null);

  /** 教室表單 Modal */
  roomOpen = signal(false);
  roomEditMode = signal(false);
  roomSaving = signal(false);
  roomError = signal('');
  roomForm: any = {};

  /** 時段表單 Modal */
  slotOpen = signal(false);
  slotEditMode = signal(false);
  slotSaving = signal(false);
  slotError = signal('');
  slotRoom = signal<MakeupRoom | null>(null);
  slotForm: any = {};

  /** 依分校篩選後的教室（後端已支援，這裡只做前端即時切換） */
  visibleRooms = computed(() => {
    const branchId = this.branchFilter();
    const all = this.rooms();
    return branchId === null ? all : all.filter((r) => r.branch_id === branchId);
  });

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadBranches();
    this.load();
  }

  load() {
    this.loading.set(true);
    this.errorMsg.set('');
    this.api.get<MakeupRoom[]>('/admin/makeup-rooms', { _: Date.now() }).subscribe({
      next: (data) => {
        this.rooms.set(data || []);
        this.loading.set(false);
      },
      error: (e) => {
        this.errorMsg.set(this.msgOf(e, '載入補課教室失敗'));
        this.loading.set(false);
      },
    });
  }

  loadBranches() {
    this.api.get<Branch[]>('/admin/branches').subscribe({
      next: (data) => this.branches.set(data || []),
      error: () => this.branches.set([]),
    });
  }

  weekdayLabel(day: number): string {
    return WEEKDAYS.find((w) => w.value === day)?.label ?? `週${day}`;
  }

  /** 教室今天總共排了幾人 */
  todayText(room: MakeupRoom): string {
    const todaySlots = room.slots.filter((s) => s.is_today);
    if (todaySlots.length === 0) return '今天沒有時段';
    return `今日已排 ${room.today_booked} / ${room.capacity} 人`;
  }

  slotSeatText(room: MakeupRoom, slot: RoomSlot): string {
    if (!slot.is_today) return '';
    const left = slot.today_seats_left ?? room.capacity - slot.today_booked;
    return left > 0 ? `剩 ${left} 位` : '已滿';
  }

  // ── 教室 CRUD ──

  openCreate() {
    this.roomEditMode.set(false);
    this.roomError.set('');
    this.roomForm = {
      branch_id: this.branchFilter() ?? this.branches()[0]?.id ?? null,
      code: '',
      name: '',
      capacity: 12,
      display_order: this.rooms().length,
      notes: '',
      is_active: true,
      slots: [{ day_of_week: 6, start_time: '14:00', end_time: '16:00' }],
    };
    this.roomOpen.set(true);
  }

  openEdit(room: MakeupRoom) {
    this.roomEditMode.set(true);
    this.roomError.set('');
    this.roomForm = {
      id: room.id,
      branch_id: room.branch_id,
      code: room.code,
      name: room.name ?? '',
      capacity: room.capacity,
      display_order: room.display_order,
      notes: room.notes ?? '',
      is_active: room.is_active,
    };
    this.roomOpen.set(true);
  }

  closeRoom() {
    this.roomOpen.set(false);
  }

  addFormSlot() {
    this.roomForm.slots = [
      ...(this.roomForm.slots || []),
      { day_of_week: 6, start_time: '14:00', end_time: '16:00' },
    ];
  }

  removeFormSlot(index: number) {
    this.roomForm.slots = (this.roomForm.slots || []).filter((_: unknown, i: number) => i !== index);
  }

  saveRoom() {
    const form = this.roomForm;
    this.roomError.set('');
    if (!form.code?.trim()) {
      this.roomError.set('請填寫教室編號（例：補A）');
      return;
    }
    if (!form.capacity || form.capacity < 1) {
      this.roomError.set('教室人數至少要 1 人');
      return;
    }
    for (const slot of form.slots || []) {
      if (!slot.start_time || !slot.end_time) {
        this.roomError.set('請填寫時段的開始與結束時間');
        return;
      }
      if (slot.end_time <= slot.start_time) {
        this.roomError.set('時段結束時間必須晚於開始時間');
        return;
      }
    }

    const payload: any = {
      branch_id: form.branch_id ?? null,
      code: form.code.trim(),
      name: form.name?.trim() || null,
      capacity: Number(form.capacity),
      display_order: Number(form.display_order) || 0,
      notes: form.notes?.trim() || null,
      is_active: form.is_active !== false,
    };
    if (!this.roomEditMode()) {
      payload.slots = form.slots || [];
    }

    this.roomSaving.set(true);
    const request = this.roomEditMode()
      ? this.api.put<MakeupRoom>(`/admin/makeup-rooms/${form.id}`, payload)
      : this.api.post<MakeupRoom>('/admin/makeup-rooms', payload);

    request.subscribe({
      next: () => {
        this.roomSaving.set(false);
        this.successMsg.set(this.roomEditMode() ? '教室已更新' : '教室已建立');
        this.closeRoom();
        this.load();
      },
      error: (e) => {
        this.roomSaving.set(false);
        this.roomError.set(this.msgOf(e, '儲存失敗'));
      },
    });
  }

  toggleRoom(room: MakeupRoom) {
    this.errorMsg.set('');
    this.api
      .put<MakeupRoom>(`/admin/makeup-rooms/${room.id}`, { is_active: !room.is_active })
      .subscribe({
        next: () => {
          this.successMsg.set(room.is_active ? '教室已停用' : '教室已啟用');
          this.load();
        },
        error: (e) => this.errorMsg.set(this.msgOf(e, '切換失敗')),
      });
  }

  deleteRoom(room: MakeupRoom) {
    if (!confirm(`確定刪除「${room.display_name}」？\n（若已有補課紀錄，系統會改為停用並保留歷史資料）`)) {
      return;
    }
    this.errorMsg.set('');
    this.api.delete<{ message?: string }>(`/admin/makeup-rooms/${room.id}`).subscribe({
      next: (res) => {
        this.successMsg.set(res?.message || '教室已刪除');
        this.load();
      },
      error: (e) => this.errorMsg.set(this.msgOf(e, '刪除失敗')),
    });
  }

  // ── 時段 CRUD ──

  openAddSlot(room: MakeupRoom) {
    this.slotEditMode.set(false);
    this.slotError.set('');
    this.slotRoom.set(room);
    this.slotForm = { day_of_week: 6, start_time: '14:00', end_time: '16:00', is_active: true };
    this.slotOpen.set(true);
  }

  openEditSlot(room: MakeupRoom, slot: RoomSlot) {
    this.slotEditMode.set(true);
    this.slotError.set('');
    this.slotRoom.set(room);
    this.slotForm = {
      id: slot.id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_active: slot.is_active,
    };
    this.slotOpen.set(true);
  }

  closeSlot() {
    this.slotOpen.set(false);
    this.slotRoom.set(null);
  }

  saveSlot() {
    const room = this.slotRoom();
    const form = this.slotForm;
    if (!room) return;
    this.slotError.set('');
    if (!form.start_time || !form.end_time) {
      this.slotError.set('請填寫開始與結束時間');
      return;
    }
    if (form.end_time <= form.start_time) {
      this.slotError.set('結束時間必須晚於開始時間');
      return;
    }

    const payload = {
      day_of_week: Number(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time,
      is_active: form.is_active !== false,
    };

    this.slotSaving.set(true);
    const request = this.slotEditMode()
      ? this.api.put<MakeupRoom>(`/admin/makeup-rooms/${room.id}/slots/${form.id}`, payload)
      : this.api.post<MakeupRoom>(`/admin/makeup-rooms/${room.id}/slots`, payload);

    request.subscribe({
      next: () => {
        this.slotSaving.set(false);
        this.successMsg.set(this.slotEditMode() ? '時段已更新' : '時段已新增');
        this.closeSlot();
        this.load();
      },
      error: (e) => {
        this.slotSaving.set(false);
        this.slotError.set(this.msgOf(e, '儲存時段失敗'));
      },
    });
  }

  deleteSlot(room: MakeupRoom, slot: RoomSlot) {
    if (!confirm(`確定刪除「${this.weekdayLabel(slot.day_of_week)} ${slot.start_time}-${slot.end_time}」？`)) {
      return;
    }
    this.errorMsg.set('');
    this.api
      .delete<{ message?: string }>(`/admin/makeup-rooms/${room.id}/slots/${slot.id}`)
      .subscribe({
        next: (res) => {
          this.successMsg.set(res?.message || '時段已刪除');
          this.load();
        },
        error: (e) => this.errorMsg.set(this.msgOf(e, '刪除時段失敗')),
      });
  }

  private msgOf(e: unknown, fallback: string): string {
    const err = e as { error?: { message?: string; detail?: string }; message?: string };
    return err?.error?.message || err?.error?.detail || err?.message || fallback;
  }
}
