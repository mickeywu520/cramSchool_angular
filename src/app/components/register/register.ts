import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  activeTab = signal<'login' | 'register'>('login');
  showPassword = signal(false);

  constructor(private router: Router) {}

  setActiveTab(tab: 'login' | 'register') {
    this.activeTab.set(tab);
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  goToRegisterDetails() {
    this.router.navigate(['/register-details']);
  }
}
