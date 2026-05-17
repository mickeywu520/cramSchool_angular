import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../services/api.service';

interface Slide {
  image: string;
  tag: string;
  link_url?: string;
  is_event?: boolean;
}

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements OnInit, OnDestroy {
  slides = signal<Slide[]>([]);
  currentIndex = signal(0);
  private intervalMs = 5000;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<{
      banners: { image_url: string; title: string | null; link_url: string | null }[];
      announcements: { title: string; content: string; published_at: string }[];
      banner_interval_seconds: number;
    }>('/homepage').subscribe({
      next: (data) => {
        this.intervalMs = Math.max(3000, Math.min(10000, (data.banner_interval_seconds || 5) * 1000));
        const bannerSlides: Slide[] = data.banners.map((b) => ({
          image: b.image_url,
          tag: b.title || '',
          link_url: b.link_url || undefined,
        }));
        const eventSlides: Slide[] = data.announcements.map((a) => ({
          image: '',
          tag: '最新活動',
          link_url: undefined,
          is_event: true,
        }));
        const all = [...bannerSlides, ...eventSlides];
        if (all.length > 0) {
          this.slides.set(all);
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
      this.currentIndex.update(i => (i + 1) % this.slides().length);
    }, this.intervalMs);
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
    this.currentIndex.update(i => (i === 0 ? this.slides().length - 1 : i - 1));
  }

  next() {
    this.currentIndex.update(i => (i + 1) % this.slides().length);
  }

  clickSlide(s: Slide) {
    if (s.link_url) {
      window.open(s.link_url, '_blank');
    }
  }
}