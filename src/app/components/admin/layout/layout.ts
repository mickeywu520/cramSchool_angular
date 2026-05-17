import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
  ];

  constructor(
    public auth: AuthService,
  ) {}

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  logout() {
    this.auth.logout();
  }
}