import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

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
  banners = signal<Banner[]>([]);
  loading = signal(false);

  editingBanner = signal<Banner | null>(null);
  showForm = signal(false);
  isNew = signal(false);
  formData = signal<Partial<Banner>>({});
  previewImage = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  maxBanners = 6;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadBanners();
  }

  get canAdd() {
    return this.banners().length < this.maxBanners;
  }

  loadBanners() {
    this.loading.set(true);
    this.api.get<Banner[]>('/banners/all').subscribe({
      next: (data) => {
        this.banners.set(data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openNewForm() {
    if (!this.canAdd) return;
    this.isNew.set(true);
    this.formData.set({ title: '', image_url: '', link_url: '', display_order: this.banners().length, is_active: true });
    this.previewImage.set(null);
    this.selectedFile.set(null);
    this.showForm.set(true);
  }

  openEditForm(banner: Banner) {
    this.isNew.set(false);
    this.editingBanner.set(banner);
    this.formData.set({ ...banner });
    this.previewImage.set(banner.image_url);
    this.selectedFile.set(null);
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingBanner.set(null);
    this.formData.set({});
    this.previewImage.set(null);
    this.selectedFile.set(null);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile.set(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImage.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  save() {
    const data = this.formData();
    if (!data.title || (!data.image_url && !this.selectedFile())) return;

    const doSave = (imageUrl: string) => {
      const body = {
        title: data.title,
        image_url: imageUrl,
        link_url: data.link_url || '',
        display_order: data.display_order ?? this.banners().length,
        is_active: data.is_active ?? true,
      };

      if (this.isNew()) {
        this.api.post<Banner>('/banners', body).subscribe({
          next: () => { this.loadBanners(); this.closeForm(); },
        });
      } else {
        const editing = this.editingBanner();
        if (editing) {
          this.api.put<Banner>(`/banners/${editing.id}`, body).subscribe({
            next: () => { this.loadBanners(); this.closeForm(); },
          });
        }
      }
    };

    const file = this.selectedFile();
    if (file) {
      this.api.upload<{ url: string }>('/upload/image/banners', file).subscribe({
        next: (res) => doSave(res.url),
        error: () => doSave(data.image_url || ''),
      });
    } else {
      doSave(data.image_url || '');
    }
  }

  deleteBanner(banner: Banner) {
    if (confirm(`確定要刪除「${banner.title}」嗎？`)) {
      this.api.delete(`/banners/${banner.id}`).subscribe({
        next: () => this.loadBanners(),
      });
    }
  }

  toggleActive(banner: Banner) {
    this.api.put<Banner>(`/banners/${banner.id}`, { is_active: !banner.is_active }).subscribe({
      next: () => this.loadBanners(),
    });
  }

  moveUp(index: number) {
    if (index === 0) return;
    this.reorder(index - 1, index);
  }

  moveDown(index: number) {
    if (index === this.banners().length - 1) return;
    this.reorder(index, index + 1);
  }

  private reorder(from: number, to: number) {
    const arr = [...this.banners()];
    [arr[from], arr[to]] = [arr[to], arr[from]];
    const order = arr.map((b) => b.id);
    this.api.put('/banners/reorder', { order }).subscribe({
      next: () => this.loadBanners(),
    });
  }
}