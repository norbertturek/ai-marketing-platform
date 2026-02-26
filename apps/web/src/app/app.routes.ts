import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'playground',
  },
  {
    path: 'playground',
    loadComponent: () =>
      import('./pages/playground.page').then((m) => m.PlaygroundPage),
  },
  {
    path: 'signin',
    loadComponent: () =>
      import('./pages/signin.page').then((m) => m.SignInPage),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/signup.page').then((m) => m.SignUpPage),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard.page').then((m) => m.DashboardPage),
  },
];
