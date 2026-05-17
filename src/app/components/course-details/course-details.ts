import { Component, signal, OnInit } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-course-details',
  imports: [RouterLink],
  templateUrl: './course-details.html',
  styleUrl: './course-details.scss',
})
export class CourseDetails implements OnInit {
  activeTab = signal<'elementary' | 'junior' | 'senior'>('elementary');

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    window.scrollTo(0, 0);
    this.route.queryParams.subscribe((params) => {
      const tab = params['tab'];
      if (tab === 'elementary' || tab === 'junior' || tab === 'senior') {
        this.activeTab.set(tab);
      }
    });
  }

  setTab(tab: 'elementary' | 'junior' | 'senior') {
    this.activeTab.set(tab);
  }
}
