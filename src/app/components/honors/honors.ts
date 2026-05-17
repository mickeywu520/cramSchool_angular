import { Component, signal, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

interface Honor {
  student_name: string;
  school: string;
  department: string | null;
}

@Component({
  selector: 'app-honors',
  imports: [],
  templateUrl: './honors.html',
  styleUrl: './honors.scss',
})
export class Honors implements OnInit {
  showAll = signal(false);
  honorsData = signal<Honor[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<{ total: number; honors: { student_name: string; school: string; department: string | null }[] }>('/honors').subscribe({
      next: (data) => {
        this.honorsData.set(data.honors || []);
      },
    });
  }

  get featuredHonors() {
    return this.showAll() ? this.honorsData() : this.honorsData().slice(0, 6);
  }

  toggleShowAll() {
    this.showAll.set(!this.showAll());
  }

  maskName(name: string): string {
    if (name.length <= 2) return name;
    const first = name[0];
    const last = name[name.length - 1];
    const masked = 'O'.repeat(name.length - 2);
    return first + masked + last;
  }
}
