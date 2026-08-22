import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface FeaturedTeacher {
  name: string;
  subjects: string[];
  image: string;
  highlight: string;
}

const SUBJECT_ORDER = ['國文', '英文', '數學', '自然', '社會'];

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
      .get<{ id: number; name: string; subject: string; subjects?: string[]; photo_url: string | null; motto: string | null }[]>('/teachers/featured')
      .subscribe({
        next: (data) => {
          const order = (s: string) => {
            const i = SUBJECT_ORDER.indexOf(s);
            return i === -1 ? SUBJECT_ORDER.length : i;
          };
          this.featuredTeachers.set(
            (data || []).map((t) => ({
              name: t.name,
              subjects: [...(t.subjects && t.subjects.length ? t.subjects : [t.subject].filter(Boolean))]
                .sort((a, b) => order(a) - order(b)),
              image: t.photo_url || '',
              highlight: t.motto || '',
            })),
          );
        },
      });
  }
}
