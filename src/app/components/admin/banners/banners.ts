import { Component, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Banner {
  id: number;
  title: string;
  image_url: string;
  link_url: string;
  display_order: number;
  is_active: boolean;
}

@Component({
  selector: 'app-admin-banners',
  imports: [FormsModule],
  templateUrl: './banners.html',
  styleUrl: './banners.scss',
})
export class AdminBanners implements OnInit {
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cdr.detectChanges();
  }

  // TODO: [API對接] 替換為 GET /api/homepage/banners 取得資料
  // 目前為 hard-coded dummy 資料供 UI 展示
  banners = signal<Banner[]>([
    { id: 1, title: '招生中', image_url: '/banners/home_banner_1.jpg', link_url: '', display_order: 0, is_active: true },
    { id: 2, title: '新班開課', image_url: '/banners/home_banner_2.png', link_url: '', display_order: 1, is_active: true },
    { id: 3, title: '限時優惠', image_url: '/banners/home_banner_3.png', link_url: '', display_order: 2, is_active: true },
    { id: 4, title: '會考衝刺班', image_url: '/banners/home_banner_4.jpg', link_url: '', display_order: 3, is_active: true },
    { id: 5, title: '暑期營隊', image_url: '/banners/home_banner_5.png', link_url: '', display_order: 4, is_active: true },
    { id: 6, title: '免費試聽', image_url: '/banners/home_banner_6.png', link_url: '', display_order: 5, is_active: true },
  ]);

  editingBanner = signal<Banner | null>(null);
  showForm = signal(false);
  isNew = signal(false);
  formData = signal<Partial<Banner>>({});
  previewImage = signal<string | null>(null);
  maxBanners = 6;

  get canAdd() {
    return this.banners().length < this.maxBanners;
  }

  openNewForm() {
    if (!this.canAdd) return;
    this.isNew.set(true);
    this.formData.set({ title: '', image_url: '', link_url: '', display_order: this.banners().length, is_active: true });
    this.previewImage.set(null);
    this.showForm.set(true);
  }

  openEditForm(banner: Banner) {
    this.isNew.set(false);
    this.editingBanner.set(banner);
    this.formData.set({ ...banner });
    this.previewImage.set(banner.image_url);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingBanner.set(null);
    this.formData.set({});
    this.previewImage.set(null);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.previewImage.set(result);
        this.formData.update(d => ({ ...d, image_url: result }));
      };
      reader.readAsDataURL(file);
    }
  }

  save() {
    const data = this.formData();
    if (!data.title || !data.image_url) return;

    if (this.isNew()) {
      const newBanner: Banner = {
        id: Date.now(),
        title: data.title || '',
        image_url: data.image_url || '',
        link_url: data.link_url || '',
        display_order: data.display_order || 0,
        is_active: data.is_active ?? true,
      };
      this.banners.update(list => [...list, newBanner]);
    } else {
      const editing = this.editingBanner();
      if (editing) {
        this.banners.update(list =>
          list.map(b => b.id === editing.id ? { ...b, ...data } as Banner : b)
        );
      }
    }
    this.closeForm();
  }

  deleteBanner(banner: Banner) {
    if (confirm(`確定要刪除「${banner.title}」嗎？`)) {
      this.banners.update(list => list.filter(b => b.id !== banner.id));
    }
  }

  toggleActive(banner: Banner) {
    this.banners.update(list =>
      list.map(b => b.id === banner.id ? { ...b, is_active: !b.is_active } : b)
    );
  }

  moveUp(index: number) {
    if (index === 0) return;
    this.banners.update(list => {
      const arr = [...list];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr.map((b, i) => ({ ...b, display_order: i }));
    });
  }

  moveDown(index: number) {
    if (index === this.banners().length - 1) return;
    this.banners.update(list => {
      const arr = [...list];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr.map((b, i) => ({ ...b, display_order: i }));
    });
  }
}