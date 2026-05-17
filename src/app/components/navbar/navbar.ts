import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  constructor(
    public auth: AuthService,
    private router: Router,
  ) {}

  get displayName(): string {
    const user = this.auth.currentUser();
    return user?.student_name || user?.teacher_name || user?.email?.split('@')[0] || '';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}