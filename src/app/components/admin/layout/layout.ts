import { Component, signal, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class AdminLayout implements OnInit {
  sidebarOpen = signal(true);
  currentPage = signal('');

  menuItems = [
    { path: '/admin/banners', icon: 'view_carousel', label: 'Banner 輪播管理' },
    { path: '/admin/about-cards', icon: 'dashboard_customize', label: '關於我們卡片' },
    { path: '/admin/teachers', icon: 'group', label: '師資介紹管理' },
    { path: '/admin/honors', icon: 'emoji_events', label: '歷年榜單管理' },
  ];

  constructor(private router: Router) {}

  // TODO: [API對接] 登入守衛改用 JWT token 驗證，而非 sessionStorage flag
  // 後續改為檢查 token 是否存在 + role === 'admin'
  ngOnInit() {
    if (!sessionStorage.getItem('admin_logged_in')) {
      this.router.navigate(['/register']);
    }
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  logout() {
    sessionStorage.removeItem('admin_logged_in');
    this.router.navigate(['/register']);
  }
}