import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-teachers',
  imports: [RouterLink],
  templateUrl: './teachers.html',
  styleUrl: './teachers.scss',
})
export class Teachers {
  featuredTeachers = [
    {
      name: '程昊',
      subject: '數學科',
      image: '/teachers/程昊_photo.jpg',
      highlight: '陪伴孩子成長的數學領航員'
    },
    {
      name: '秦清',
      subject: '國文科',
      image: '/teachers/秦清_photo.jpg',
      highlight: '把複雜的事情簡單化'
    },
    {
      name: 'Eva',
      subject: '英文科',
      image: '/teachers/Eva_photo.jpg',
      highlight: '把英文變得簡單好理解'
    },
    {
      name: '段諭',
      subject: '理化科',
      image: '/teachers/段諭_photo.jpg',
      highlight: '教育是傳承'
    }
  ];
}