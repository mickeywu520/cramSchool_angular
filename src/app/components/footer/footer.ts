import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  lineQRVisible = signal(false);
  fbQRVisible = signal(false);

  showLINEQR() {
    this.lineQRVisible.set(true);
  }

  hideLINEQR() {
    this.lineQRVisible.set(false);
  }

  showFBQR() {
    this.fbQRVisible.set(true);
  }

  hideFBQR() {
    this.fbQRVisible.set(false);
  }
}