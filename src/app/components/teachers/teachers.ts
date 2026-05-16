import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface FeaturedTeacher {
  name: string;
  subject: string;
  image: string;
  highlight: string;
}

@Component({
  selector: 'app-teachers',
  imports: [RouterLink],
  templateUrl: './teachers.html',
  styleUrl: './teachers.scss',
})
export class Teachers implements OnInit {
  featuredTeachers = signal<FeaturedTeacher[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api
      .get<{ id: number; name: string; subject: string; photo_url: string | null; motto: string | null }[]>('/teachers/featured')
      .subscribe({
        next: (data) => {
          this.featuredTeachers.set(
            (data || []).map((t) => ({
              name: t.name,
              subject: t.subject,
              image: t.photo_url || '',
              highlight: t.motto || '',
            })),
          );
        },
      });
  }
}
