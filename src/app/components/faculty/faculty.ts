import { Component, signal, computed, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface Teacher {
  id: number;
  name: string;
  subject: string;
  degree: string;
  experience: string;
  image: string;
  lifePhoto: string;
  philosophy: string;
  highlight: string;
  subjectId: string;
}

const SUBJECT_MAP: Record<string, string> = {
  '數學': 'math',
  '英文': 'english',
  '理化': 'science',
  '國文': 'chinese',
  '地科': 'science',
  '物理': 'science',
  '化學': 'science',
  '作文': 'chinese',
};

@Component({
  selector: 'app-faculty',
  imports: [RouterLink],
  templateUrl: './faculty.html',
  styleUrl: './faculty.scss',
})
export class Faculty implements OnInit, AfterViewInit {
  @ViewChild('teacherList') teacherList!: ElementRef;

  selectedFilter = signal<string>('all');
  searchQuery = signal<string>('');
  selectedTeacher = signal<Teacher | null>(null);
  selectedTeacherData = computed(() => this.selectedTeacher() as Teacher);
  highlightTeacher = signal<string>('');
  teachers = signal<Teacher[]>([]);

  constructor(private api: ApiService) {}

  ngOnInit() {
    window.scrollTo(0, 0);

    const params = new URLSearchParams(window.location.search);
    const teacherName = params.get('teacher');
    if (teacherName) {
      this.highlightTeacher.set(decodeURIComponent(teacherName));
    }

    this.api.get<{ id: number; name: string; subject: string; title: string | null; motto: string | null; description: string | null; photo_url: string | null; life_photo_url: string | null }[]>('/teachers').subscribe({
      next: (data) => {
        this.teachers.set(
          (data || []).map((t) => ({
            id: t.id,
            name: t.name,
            subject: t.subject + '科',
            degree: t.title || '',
            experience: '豐富',
            image: t.photo_url || '',
            lifePhoto: t.life_photo_url || '',
            philosophy: t.description || '',
            highlight: t.motto || '',
            subjectId: SUBJECT_MAP[t.subject] || 'all',
          })),
        );
      },
    });
  }

  ngAfterViewInit() {
    if (this.highlightTeacher()) {
      setTimeout(() => {
        const element = document.querySelector(`[data-teacher="${this.highlightTeacher()}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }

  filters = [
    { id: 'all', label: '全部師資' },
    { id: 'math', label: '數學科' },
    { id: 'english', label: '英文科' },
    { id: 'science', label: '理化科' },
    { id: 'chinese', label: '國文科' },
  ];

  setFilter(filterId: string) {
    this.selectedFilter.set(filterId);
  }

  openModal(teacher: Teacher) {
    this.selectedTeacher.set(teacher);
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.selectedTeacher.set(null);
    document.body.style.overflow = '';
  }

  get filteredTeachers() {
    let filtered = this.teachers();
    if (this.selectedFilter() !== 'all') {
      filtered = filtered.filter(t => t.subjectId === this.selectedFilter());
    }
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.subject.toLowerCase().includes(query)
      );
    }
    return filtered;
  }
}
