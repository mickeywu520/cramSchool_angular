import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  fbQRVisible = signal(false);

  showFBQR() {
    this.fbQRVisible.set(true);
  }

  hideFBQR() {
    this.fbQRVisible.set(false);
  }
}