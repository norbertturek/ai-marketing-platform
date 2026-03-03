import { HttpErrorResponse } from '@angular/common/http';
import { NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AuthApiService } from '../core/auth/auth-api.service';
import { AuthStoreService } from '../core/auth/auth-store.service';

@Component({
  selector: 'app-signin-page',
  imports: [NgIf, RouterLink, ReactiveFormsModule, ...HlmButtonImports],
  template: `
    <section class="dark min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <!-- Back to app link -->
      <a
        routerLink="/"
        class="absolute top-4 left-4 md:top-6 md:left-6 text-xs md:text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-2"
      >
        <span aria-hidden="true" class="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-[10px]">
          ←
        </span>
        <span class="hidden sm:inline">Back to app</span>
      </a>

      <div class="w-full max-w-md px-4">
        <!-- Logo / header -->
        <div class="text-center mb-6 md:mb-8">
          <div
            class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 shadow-sm mb-4 md:mb-6"
            aria-hidden="true"
          >
            <span class="text-sm font-semibold tracking-tight">AI</span>
          </div>
          <h1 class="text-xl md:text-2xl font-medium text-white mb-2">Welcome back</h1>
          <p class="text-xs md:text-sm text-zinc-500">Sign in to access your AI marketing workspace.</p>
        </div>

        <form class="space-y-5" [formGroup]="form" (ngSubmit)="submit()">
          <div>
            <label for="signin-email" class="text-xs text-zinc-400 mb-2 block">Email</label>
            <input
              id="signin-email"
              type="email"
              placeholder="you@example.com"
              class="h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white shadow-xs outline-none placeholder:text-zinc-600 focus-visible:border-zinc-500 focus-visible:ring-[3px] focus-visible:ring-zinc-500/40"
              formControlName="email"
            />
            <p class="mt-1 text-xs text-red-400" *ngIf="emailError">{{ emailError }}</p>
          </div>

          <div>
            <div class="mb-2 flex items-center justify-between">
              <label for="signin-password" class="text-xs text-zinc-400">Password</label>
              <span class="text-xs text-zinc-500">Minimum 8 characters</span>
            </div>
            <input
              id="signin-password"
              type="password"
              placeholder="••••••••"
              class="h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white shadow-xs outline-none placeholder:text-zinc-600 focus-visible:border-zinc-500 focus-visible:ring-[3px] focus-visible:ring-zinc-500/40"
              formControlName="password"
            />
            <p class="mt-1 text-xs text-red-400" *ngIf="passwordError">{{ passwordError }}</p>
          </div>

          <p class="text-sm text-red-400" *ngIf="errorMessage()">{{ errorMessage() }}</p>

          <button
            hlmBtn
            class="w-full h-11 bg-white text-black hover:bg-zinc-200 text-sm"
            type="submit"
            [disabled]="isSubmitting()"
          >
            {{ isSubmitting() ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-zinc-500">
          No account yet?
          <a routerLink="/signup" class="font-medium text-white hover:underline">
            Create one
          </a>
        </p>
      </div>
    </section>
  `,
})
export class SignInPage {
  private readonly authApi = inject(AuthApiService);
  private readonly authStore = inject(AuthStoreService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
  });

  get emailError(): string | null {
    const control = this.form.controls.email;
    if (!control.touched && !control.dirty) {
      return null;
    }
    if (control.hasError('required')) {
      return 'Email is required';
    }
    if (control.hasError('email')) {
      return 'Provide a valid email address';
    }
    return null;
  }

  get passwordError(): string | null {
    const control = this.form.controls.password;
    if (!control.touched && !control.dirty) {
      return null;
    }
    if (control.hasError('required')) {
      return 'Password is required';
    }
    if (control.hasError('minlength')) {
      return 'Password must be at least 8 characters';
    }
    return null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    const payload = this.form.getRawValue();

    this.authApi.signIn(payload).subscribe({
      next: (session) => {
        this.authStore.setSession(session);
        this.router.navigate(['/projects']);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.mapSignInError(error));
        this.isSubmitting.set(false);
      },
      complete: () => this.isSubmitting.set(false),
    });
  }

  private mapSignInError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return 'Invalid email or password';
    }
    return 'Unable to sign in. Please try again.';
  }
}
