import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../services/api.service';

interface Banner {
  image: string;
  tag: string;
  title: string;
  titleLine2: string;
  description: string;
}

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements OnInit, OnDestroy {
  banners = signal<Banner[]>([]);
  currentIndex = signal(0);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<{ image_url: string; title: string | null }[]>('/banners').subscribe({
      next: (data) => {
        const mapped = data.map((b) => ({
          image: b.image_url,
          tag: b.title || '',
          title: '',
          titleLine2: '',
          description: '',
        }));
        if (mapped.length === 0) {
          this.banners.set([]);
        } else {
          this.banners.set(mapped);
          this.startAutoPlay();
        }
      },
    });
  }

  ngOnDestroy() {
    this.stopAutoPlay();
  }

  startAutoPlay() {
    this.stopAutoPlay();
    this.intervalId = setInterval(() => {
      this.currentIndex.update(i => (i + 1) % this.banners().length);
    }, 5000);
  }

  stopAutoPlay() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  goTo(index: number) {
    this.currentIndex.set(index);
  }

  prev() {
    this.currentIndex.update(i => i === 0 ? this.banners().length - 1 : i - 1);
  }

  next() {
    this.currentIndex.update(i => (i + 1) % this.banners().length);
  }
}