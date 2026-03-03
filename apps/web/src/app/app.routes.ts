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
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/content-generator.page').then((m) => m.ContentGeneratorPage),
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
    path: 'projects',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/projects.page').then((m) => m.ProjectsPage),
  },
  {
    path: 'project/:projectId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/project-detail.page').then((m) => m.ProjectDetailPage),
  },
  {
    path: 'project/:projectId/post/:postId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/content-generator.page').then((m) => m.ContentGeneratorPage),
  },
];
