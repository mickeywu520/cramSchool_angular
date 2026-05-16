import { Component, signal, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class AdminLayout implements OnInit {
  sidebarOpen = signal(true);

  menuItems = [
    { path: '/admin/banners', icon: 'view_carousel', label: 'Banner 輪播管理' },
    { path: '/admin/about-cards', icon: 'dashboard_customize', label: '關於我們卡片' },
    { path: '/admin/teachers', icon: 'group', label: '師資介紹管理' },
    { path: '/admin/honors', icon: 'emoji_events', label: '歷年榜單管理' },
  ];

  constructor(
    private router: Router,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    if (!this.auth.isAdmin) {
      this.router.navigate(['/register']);
    }
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  logout() {
    this.auth.logout();
  }
}