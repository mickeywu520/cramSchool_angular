import { Component, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cdr.detectChanges();
  }

  // TODO: [API對接] 替換為 GET /api/homepage/about-cards 取得資料
  // 目前為 hard-coded dummy 資料供 UI 展示
  cards = signal<AboutCard[]>([
    { id: 1, title: '我們的使命', content: '禾笙致力於提供最高品質的教育服務，打造優質的學習環境，幫助每位學員達成升學目標。我們相信每位學生都有潛力，透過專業教學與個別輔導，讓孩子在學業上取得優異成績。', icon: 'flag', display_order: 0, is_active: true },
    { id: 2, title: '老闆的話', content: '今天要不要訂飲料?', icon: 'format_quote', display_order: 1, is_active: true },
  ]);

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

  get canAdd() {
    return this.cards().length < this.maxCards;
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

    if (this.isNew()) {
      const newCard: AboutCard = {
        id: Date.now(),
        title: data.title || '',
        content: data.content || '',
        icon: data.icon || 'star',
        display_order: data.display_order || 0,
        is_active: data.is_active ?? true,
      };
      this.cards.update(list => [...list, newCard]);
    } else {
      const editing = this.editingCard();
      if (editing) {
        this.cards.update(list =>
          list.map(c => c.id === editing.id ? { ...c, ...data } as AboutCard : c)
        );
      }
    }
    this.closeForm();
  }

  deleteCard(card: AboutCard) {
    if (confirm(`確定要刪除「${card.title}」嗎？`)) {
      this.cards.update(list => list.filter(c => c.id !== card.id));
    }
  }

  toggleActive(card: AboutCard) {
    this.cards.update(list =>
      list.map(c => c.id === card.id ? { ...c, is_active: !c.is_active } : c)
    );
  }

  moveUp(index: number) {
    if (index === 0) return;
    this.cards.update(list => {
      const arr = [...list];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr.map((c, i) => ({ ...c, display_order: i }));
    });
  }

  moveDown(index: number) {
    if (index === this.cards().length - 1) return;
    this.cards.update(list => {
      const arr = [...list];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr.map((c, i) => ({ ...c, display_order: i }));
    });
  }
}