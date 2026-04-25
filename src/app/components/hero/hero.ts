import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements OnInit, OnDestroy {
  banners = [
    {
      image: '/banners/home_banner_1.jpg',
      tag: '招生中',
      title: '成就卓越未來',
      titleLine2: '培育學子競爭力',
      description: '禾笙文理補習班，專業師資與溫馨環境，引領學生邁向學術高峰。'
    },
    {
      image: '/banners/home_banner_2.png',
      tag: '新班開課',
      title: '專業師資',
      titleLine2: '陪伴孩子成長',
      description: '由經驗豐富的教師團隊，量身打造學習計畫。'
    },
    {
      image: '/banners/home_banner_3.png',
      tag: '限時優惠',
      title: '早鳥報名',
      titleLine2: '優惠倒數中',
      description: '立即報名享有學費折扣，名額有限。'
    },
    {
      image: '/banners/home_banner_4.jpg',
      tag: '招生中',
      title: '會考衝刺班',
      titleLine2: '全力備考',
      description: '專業課程規劃，幫助學生掌握重點知識。'
    },
    {
      image: '/banners/home_banner_5.png',
      tag: '暑期營隊',
      title: '多元學習',
      titleLine2: '激發興趣潐能',
      description: '豐富課程內容，讓學習充滿樂趣。'
    },
    {
      image: '/banners/home_banner_6.png',
      tag: '免費試聽',
      title: '開放體驗',
      titleLine2: '歡迎預約',
      description: '提供完整試聽課程，讓您感受教學品質。'
    }
  ];

  currentIndex = signal(0);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.startAutoPlay();
  }

  ngOnDestroy() {
    this.stopAutoPlay();
  }

  startAutoPlay() {
    this.stopAutoPlay();
    this.intervalId = setInterval(() => {
      this.currentIndex.update(i => (i + 1) % this.banners.length);
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
    this.currentIndex.update(i => i === 0 ? this.banners.length - 1 : i - 1);
  }

  next() {
    this.currentIndex.update(i => (i + 1) % this.banners.length);
  }
}