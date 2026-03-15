import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-leave-makeup',
  imports: [RouterLink],
  templateUrl: './leave-makeup.html',
  styleUrl: './leave-makeup.scss',
})
export class LeaveMakeup implements OnInit {
  ngOnInit() {
    window.scrollTo(0, 0);
  }
}
