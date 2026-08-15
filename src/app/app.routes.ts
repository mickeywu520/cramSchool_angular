import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Register } from './components/register/register';
import { RegisterDetails } from './components/register-details/register-details';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { ResetPassword } from './components/reset-password/reset-password';
import { Faculty } from './components/faculty/faculty';
import { StudentProfile } from './components/student-profile/student-profile';
import { EditProfile } from './components/edit-profile/edit-profile';
import { CommunicationBook } from './components/communication-book/communication-book';
import { CourseDetails } from './components/course-details/course-details';
import { LeaveMakeup } from './components/leave-makeup/leave-makeup';
import { AdminLayout } from './components/admin/layout/layout';
import { AdminBanners } from './components/admin/banners/banners';
import { AdminAboutCards } from './components/admin/about-cards/about-cards';
import { AdminTeachers } from './components/admin/teachers/teachers';
import { AdminHonors } from './components/admin/honors/honors';
import { AdminCommunication } from './components/admin/communication/communication';
import { AdminCourses } from './components/admin/courses/courses';
import { AdminEnrollments } from './components/admin/enrollments/enrollments';
import { AdminStudentRegistrations } from './components/admin/student-registrations/student-registrations';
import { AdminUsers } from './components/admin/admin-users/admin-users';
import { AdminBranches } from './components/admin/branches/branches';
import { AuthGuard } from './guards/auth.guard';
import { StudentAuthGuard } from './guards/student-auth.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'register', component: Register },
  { path: 'register-details', component: RegisterDetails },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'reset-password', component: ResetPassword },
  { path: 'faculty', component: Faculty },
  { path: 'student', component: StudentProfile, canActivate: [StudentAuthGuard] },
  { path: 'edit-profile', component: EditProfile, canActivate: [StudentAuthGuard] },
  { path: 'communication-book', component: CommunicationBook, canActivate: [StudentAuthGuard] },
  { path: 'course-details', component: CourseDetails },
  { path: 'leave-makeup', component: LeaveMakeup },
  { path: 'order', redirectTo: '/student' },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'banners', pathMatch: 'full' },
      { path: 'banners', component: AdminBanners },
      { path: 'about-cards', component: AdminAboutCards },
      { path: 'teachers', component: AdminTeachers },
      { path: 'honors', component: AdminHonors },
      { path: 'users', component: AdminUsers },
      { path: 'branches', component: AdminBranches },
      { path: 'courses', component: AdminCourses },
      { path: 'enrollments', component: AdminEnrollments },
      { path: 'student-registrations', component: AdminStudentRegistrations },
      { path: 'communication', component: AdminCommunication },
    ],
  },
  { path: '**', redirectTo: '' }
];
