import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-course-details',
  imports: [RouterLink],
  templateUrl: './course-details.html',
  styleUrl: './course-details.scss',
})
export class CourseDetails implements OnInit {
  activeTab = signal<'elementary' | 'junior'>('elementary');

  ngOnInit() {
    window.scrollTo(0, 0);
  }

  setTab(tab: 'elementary' | 'junior') {
    this.activeTab.set(tab);
  }
}
