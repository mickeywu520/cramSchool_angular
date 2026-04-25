import { Component, signal } from '@angular/core';
import { honors } from '../../data/honors';

@Component({
  selector: 'app-honors',
  imports: [],
  templateUrl: './honors.html',
  styleUrl: './honors.scss',
})
export class Honors {
  showAll = signal(false);
  honorsData = honors;
  
  get featuredHonors() {
    return this.showAll() ? this.honorsData : this.honorsData.slice(0, 6);
  }
  
  toggleShowAll() {
    this.showAll.set(!this.showAll());
  }
}