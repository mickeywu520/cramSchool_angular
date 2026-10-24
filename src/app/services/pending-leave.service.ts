import { Injectable, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ApiService } from './api.service';

/**
 * 待審核請假筆數（後台側邊欄紅點用）。
 * 放在 service 裡，讓「請假審核」頁核准/駁回後能立刻更新側邊欄數字。
 */
@Injectable({ providedIn: 'root' })
export class PendingLeaveService {
  readonly count = signal(0);

  constructor(private api: ApiService) {}

  /** 重新抓取筆數；失敗時靜默歸零，不影響後台操作 */
  async refresh() {
    try {
      const res = await lastValueFrom(this.api.get<{ total: number }>('/leave/pending'));
      this.count.set(res?.total ?? 0);
    } catch {
      this.count.set(0);
    }
  }
}
