import { Component, signal, computed, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Footer } from '../footer/footer';

interface Teacher {
  id: number;
  name: string;
  subject: string;
  subjects: string[];
  subjectsDisplay: string[];
  degree: string;
  experience: string;
  image: string;
  lifePhoto: string;
  philosophy: string;
  highlight: string;
  subjectIds: string[];
}

const SUBJECT_MAP: Record<string, string> = {
  '國文': 'chinese',
  '英文': 'english',
  '數學': 'math',
  '自然': 'science',
  '理化': 'science',
  '社會': 'social',
  '地科': 'science',
  '物理': 'science',
  '化學': 'science',
  '作文': 'chinese',
};

const SUBJECT_ORDER = ['國文', '英文', '數學', '自然', '社會'];

@Component({
  selector: 'app-faculty',
  imports: [RouterLink, Footer],
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

    this.loadTeachers();
  }

  loadTeachers() {
    this.api.get<{ total: number; teachers: { id: number; name: string; subject: string; subjects?: string[]; title: string | null; motto: string | null; description: string | null; photo_url: string | null; life_photo_url: string | null }[] }>('/teachers').subscribe({
      next: (data) => {
        this.teachers.set(
          ((data && data.teachers) || []).map((t) => {
            const subjects = (t.subjects && t.subjects.length ? t.subjects : [t.subject].filter(Boolean));
            const order = (s: string) => {
              const i = SUBJECT_ORDER.indexOf(s);
              return i === -1 ? SUBJECT_ORDER.length : i;
            };
            const sorted = [...subjects].sort((a, b) => order(a) - order(b));
            return {
              id: t.id,
              name: t.name,
              subject: sorted.map((s) => s + '科').join('、'),
              subjects,
              subjectsDisplay: sorted.map((s) => s + '科'),
              degree: t.title || '',
              experience: '豐富',
              image: t.photo_url || '',
              lifePhoto: t.life_photo_url || '',
              philosophy: t.description || '',
              highlight: t.motto || '',
              subjectIds: Array.from(new Set(subjects.map((s) => SUBJECT_MAP[s]).filter(Boolean))),
            };
          }),
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
    { id: 'chinese', label: '國文科' },
    { id: 'english', label: '英文科' },
    { id: 'math', label: '數學科' },
    { id: 'science', label: '自然科' },
    { id: 'social', label: '社會科' },
  ];

  setFilter(filterId: string) {
    this.selectedFilter.set(filterId);
  }

  lineQRVisible = signal(false);

  showLINEQR() {
    this.lineQRVisible.set(true);
  }

  hideLINEQR() {
    this.lineQRVisible.set(false);
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
      filtered = filtered.filter(t => t.subjectIds.includes(this.selectedFilter()));
    }
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.subjects.some(s => s.toLowerCase().includes(query))
      );
    }
    return filtered;
  }
}
