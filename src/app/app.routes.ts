import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Register } from './components/register/register';
import { RegisterDetails } from './components/register-details/register-details';
import { Faculty } from './components/faculty/faculty';
import { StudentProfile } from './components/student-profile/student-profile';
import { CommunicationBook } from './components/communication-book/communication-book';
import { CourseDetails } from './components/course-details/course-details';
import { LeaveMakeup } from './components/leave-makeup/leave-makeup';
import { AdminLayout } from './components/admin/layout/layout';
import { AdminBanners } from './components/admin/banners/banners';
import { AdminAboutCards } from './components/admin/about-cards/about-cards';
import { AdminTeachers } from './components/admin/teachers/teachers';
import { AdminHonors } from './components/admin/honors/honors';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'register', component: Register },
  { path: 'register-details', component: RegisterDetails },
  { path: 'faculty', component: Faculty },
  { path: 'student', component: StudentProfile },
  { path: 'communication-book', component: CommunicationBook },
  { path: 'course-details', component: CourseDetails },
  { path: 'leave-makeup', component: LeaveMakeup },
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      { path: '', redirectTo: 'banners', pathMatch: 'full' },
      { path: 'banners', component: AdminBanners },
      { path: 'about-cards', component: AdminAboutCards },
      { path: 'teachers', component: AdminTeachers },
      { path: 'honors', component: AdminHonors },
    ],
  },
  { path: '**', redirectTo: '' }
];
