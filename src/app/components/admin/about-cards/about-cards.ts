import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

interface AboutCard {
  id: number;
  title: string;
  content: string;
  icon: string;
  display_order: number;
  is_active: boolean;
}

@Component({
  selector: 'app-admin-about-cards',
  imports: [FormsModule],
  templateUrl: './about-cards.html',
  styleUrl: './about-cards.scss',
})
export class AdminAboutCards implements OnInit {
  cards = signal<AboutCard[]>([]);
  loading = signal(false);

  showForm = signal(false);
  isNew = signal(false);
  editingCard = signal<AboutCard | null>(null);
  formData = signal<Partial<AboutCard>>({});
  maxCards = 5;

  iconOptions = [
    { value: 'flag', label: '旗幟' },
    { value: 'format_quote', label: '引言' },
    { value: 'star', label: '星星' },
    { value: 'school', label: '學校' },
    { value: 'groups', label: '團隊' },
    { value: 'psychology', label: '心理' },
    { value: 'emoji_objects', label: '燈泡' },
    { value: 'rocket_launch', label: '火箭' },
    { value: 'trending_up', label: '成長' },
    { value: 'diamond', label: '鑽石' },
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadCards();
  }

  get canAdd() {
    return this.cards().length < this.maxCards;
  }

  loadCards() {
    this.loading.set(true);
    this.api.get<{ total: number; cards: AboutCard[] }>('/about-cards/all').subscribe({
      next: (data) => {
        this.cards.set(data.cards || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openNewForm() {
    if (!this.canAdd) return;
    this.isNew.set(true);
    this.formData.set({ title: '', content: '', icon: 'star', display_order: this.cards().length, is_active: true });
    this.showForm.set(true);
  }

  openEditForm(card: AboutCard) {
    this.isNew.set(false);
    this.editingCard.set(card);
    this.formData.set({ ...card });
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editingCard.set(null);
    this.formData.set({});
  }

  save() {
    const data = this.formData();
    if (!data.title || !data.content) return;

    const body = {
      title: data.title,
      content: data.content,
      icon: data.icon || 'star',
      display_order: data.display_order ?? this.cards().length,
      is_active: data.is_active ?? true,
    };

    if (this.isNew()) {
      this.api.post<AboutCard>('/about-cards', body).subscribe({
        next: () => { this.loadCards(); this.closeForm(); },
      });
    } else {
      const editing = this.editingCard();
      if (editing) {
        this.api.put<AboutCard>(`/about-cards/${editing.id}`, body).subscribe({
          next: () => { this.loadCards(); this.closeForm(); },
        });
      }
    }
  }

  deleteCard(card: AboutCard) {
    if (confirm(`確定要刪除「${card.title}」嗎？`)) {
      this.api.delete(`/about-cards/${card.id}`).subscribe({
        next: () => this.loadCards(),
      });
    }
  }

  toggleActive(card: AboutCard) {
    this.api.put(`/about-cards/${card.id}`, { is_active: !card.is_active }).subscribe({
      next: () => this.loadCards(),
    });
  }

  moveUp(index: number) {
    if (index === 0) return;
    this.reorder(index - 1, index);
  }

  moveDown(index: number) {
    if (index === this.cards().length - 1) return;
    this.reorder(index, index + 1);
  }

  private reorder(from: number, to: number) {
    const arr = [...this.cards()];
    [arr[from], arr[to]] = [arr[to], arr[from]];
    const order = arr.map((c) => c.id);
    this.api.put('/about-cards/reorder', { order }).subscribe({
      next: () => this.loadCards(),
    });
  }
}