import { HttpErrorResponse } from '@angular/common/http';
import { NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AuthApiService } from '../core/auth/auth-api.service';
import { AuthStoreService } from '../core/auth/auth-store.service';

@Component({
  selector: 'app-signup-page',
  imports: [NgIf, RouterLink, ReactiveFormsModule, ...HlmButtonImports],
  template: `
    <section class="mx-auto w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
      <div class="mb-6 space-y-1">
        <h1 class="text-2xl font-semibold tracking-tight">Create account</h1>
        <p class="text-sm text-muted-foreground">
          Start your workspace and set up your first marketing automation flow.
        </p>
      </div>

      <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        <div class="space-y-2">
          <label for="signup-email" class="text-sm font-medium">Email</label>
          <input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            class="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            formControlName="email"
          />
          <p class="text-xs text-destructive" *ngIf="emailError">{{ emailError }}</p>
        </div>

        <div class="space-y-2">
          <label for="signup-password" class="text-sm font-medium">Password</label>
          <input
            id="signup-password"
            type="password"
            placeholder="Minimum 8 characters"
            class="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            formControlName="password"
          />
          <p class="text-xs text-destructive" *ngIf="passwordError">{{ passwordError }}</p>
        </div>

        <p class="text-sm text-destructive" *ngIf="errorMessage()">{{ errorMessage() }}</p>

        <button hlmBtn class="w-full" type="submit" [disabled]="isSubmitting()">
          {{ isSubmitting() ? 'Creating account...' : 'Create account' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-muted-foreground">
        Already registered?
        <a routerLink="/signin" class="font-medium text-foreground underline underline-offset-4">
          Sign in
        </a>
      </p>
    </section>
  `,
})
export class SignUpPage {
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

    this.authApi.register(payload).subscribe({
      next: (session) => {
        this.authStore.setSession(session);
        this.router.navigate(['/dashboard']);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.mapSignupError(error));
        this.isSubmitting.set(false);
      },
      complete: () => this.isSubmitting.set(false),
    });
  }

  private mapSignupError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return 'This email is already registered';
    }
    return 'Unable to create account. Please try again.';
  }
}
