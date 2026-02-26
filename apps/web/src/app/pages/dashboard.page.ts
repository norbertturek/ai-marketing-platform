import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AuthApiService } from '../core/auth/auth-api.service';
import { AuthStoreService } from '../core/auth/auth-store.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [...HlmButtonImports],
  template: `
    <section class="mx-auto w-full max-w-2xl rounded-xl border bg-background p-6 shadow-sm">
      <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p class="mt-2 text-sm text-muted-foreground">
        Signed in as <span class="font-medium text-foreground">{{ userEmail }}</span>.
      </p>

      <div class="mt-6">
        <button hlmBtn variant="outline" type="button" (click)="signOut()">
          Sign out
        </button>
      </div>
    </section>
  `,
})
export class DashboardPage {
  private readonly authApi = inject(AuthApiService);
  private readonly authStore = inject(AuthStoreService);
  private readonly router = inject(Router);

  get userEmail(): string {
    return this.authStore.session()?.user.email ?? 'unknown';
  }

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
