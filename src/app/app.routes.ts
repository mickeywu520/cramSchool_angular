import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Register } from './components/register/register';
import { RegisterDetails } from './components/register-details/register-details';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'register', component: Register },
  { path: 'register-details', component: RegisterDetails },
  { path: '**', redirectTo: '' }
];
