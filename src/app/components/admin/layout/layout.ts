import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { PendingLeaveService } from '../../../services/pending-leave.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class AdminLayout implements OnInit, OnDestroy {
  sidebarOpen = signal(true);
  appVersion = environment.version;

  menuItems = [
    { path: '/admin/banners', icon: 'view_carousel', label: 'Banner 輪播管理' },
    { path: '/admin/about-cards', icon: 'dashboard_customize', label: '關於我們卡片' },
    { path: '/admin/teachers', icon: 'group', label: '師資介紹管理' },
    { path: '/admin/honors', icon: 'emoji_events', label: '歷年榜單管理' },
    { path: '/admin/branches', icon: 'business', label: '分校管理' },
    { path: '/admin/courses', icon: 'calendar_month', label: '課程管理' },
    { path: '/admin/enrollments', icon: 'assignment_ind', label: '選課管理' },
    { path: '/admin/student-registrations', icon: 'person_add', label: '報名註冊管理' },
    { path: '/admin/accounts', icon: 'manage_accounts', label: '家長/學生帳號管理' },
    { path: '/admin/communication', icon: 'menu_book', label: '數位聯絡簿' },
    { path: '/admin/leaves', icon: 'event_busy', label: '請假審核' },
    { path: '/admin/users', icon: 'admin_panel_settings', label: '內部帳號管理' },
  ];

  private navSub: Subscription | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    public auth: AuthService,
    public router: Router,
    public pendingLeaves: PendingLeaveService,
  ) {}

  ngOnInit() {
    this.pendingLeaves.refresh();
    // 換頁時重抓，紅點才會跟著最新狀態
    this.navSub = this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) this.pendingLeaves.refresh();
    });
    // 停在同一個頁面時，每 60 秒更新一次（有新申請就會自己跳出來）
    this.timer = setInterval(() => this.pendingLeaves.refresh(), 60_000);
  }

  ngOnDestroy() {
    this.navSub?.unsubscribe();
    if (this.timer) clearInterval(this.timer);
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  logout() {
    this.auth.logout();
  }
}
