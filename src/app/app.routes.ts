import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Register } from './components/register/register';
import { RegisterDetails } from './components/register-details/register-details';
import { Faculty } from './components/faculty/faculty';
import { StudentProfile } from './components/student-profile/student-profile';
import { CommunicationBook } from './components/communication-book/communication-book';
import { CourseDetails } from './components/course-details/course-details';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'register', component: Register },
  { path: 'register-details', component: RegisterDetails },
  { path: 'faculty', component: Faculty },
  { path: 'student', component: StudentProfile },
  { path: 'communication-book', component: CommunicationBook },
  { path: 'course-details', component: CourseDetails },
  { path: '**', redirectTo: '' }
];
