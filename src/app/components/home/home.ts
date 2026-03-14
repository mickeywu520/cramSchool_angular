import { Component } from '@angular/core';
import { Navbar } from '../navbar/navbar';
import { Hero } from '../hero/hero';
import { About } from '../about/about';
import { Teachers } from '../teachers/teachers';
import { Courses } from '../courses/courses';
import { Honors } from '../honors/honors';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-home',
  imports: [Navbar, Hero, About, Teachers, Courses, Honors, Footer],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
