import { Component, signal, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LinkifyPipe } from '../../pipes/linkify.pipe';

interface AboutCard {
  id: number;
  title: string;
  content: string;
  icon: string;
  display_order: number;
  is_active: boolean;
}

@Component({
  selector: 'app-about',
  imports: [LinkifyPipe],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About implements OnInit {
  cards = signal<AboutCard[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<{ total: number; cards: AboutCard[] }>('/about-cards').subscribe({
      next: (data) => {
        this.cards.set(data.cards || []);
      },
    });
  }
}
