import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class AdminLayout {
  sidebarOpen = signal(true);

  menuItems = [
    { path: '/admin/banners', icon: 'view_carousel', label: 'Banner 輪播管理' },
    { path: '/admin/about-cards', icon: 'dashboard_customize', label: '關於我們卡片' },
    { path: '/admin/teachers', icon: 'group', label: '師資介紹管理' },
    { path: '/admin/honors', icon: 'emoji_events', label: '歷年榜單管理' },
    { path: '/admin/branches', icon: 'business', label: '分校管理' },
    { path: '/admin/courses', icon: 'calendar_month', label: '課程管理' },
    { path: '/admin/enrollments', icon: 'assignment_ind', label: '選課管理' },
    { path: '/admin/student-registrations', icon: 'person_add', label: '報名註冊管理' },
    { path: '/admin/communication', icon: 'menu_book', label: '數位聯絡簿' },
  ];

  constructor(
    public auth: AuthService,
    public router: Router,
  ) {}

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  logout() {
    this.auth.logout();
  }
}