import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthApiService } from './core/auth/auth-api.service';
import { AuthStoreService } from './core/auth/auth-store.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly authApi = inject(AuthApiService);
  private readonly authStore = inject(AuthStoreService);
  private readonly router = inject(Router);

  readonly isAuthenticated = this.authStore.isAuthenticated;

  signOut(): void {
    const refreshToken = this.authStore.getRefreshToken();
    if (!refreshToken) {
      this.authStore.clearSession();
      this.router.navigate(['/signin']);
      return;
    }
    this.authApi.signOut(refreshToken).subscribe({
      next: () => {
        this.authStore.clearSession();
        this.router.navigate(['/signin']);
      },
      error: () => {
        this.authStore.clearSession();
        this.router.navigate(['/signin']);
      },
    });
  }
}
