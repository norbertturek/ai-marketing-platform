---
name: angular21-frontend
description: Build and review Angular 21 frontend code using standalone APIs, signals, typed forms, and test-first changes. Use when working in apps/web, Angular pages/components/services, or frontend refactors.
---

# Angular 21 Frontend

## Use This Skill When

- The task touches `apps/web`.
- The user asks for Angular component/service/routing/form changes.
- A frontend review is requested.

## Project Structure

```
apps/web/src/app/
├── pages/              # Page components (lazy-loaded via routes)
│   ├── content-generator.page.ts   # Playground: text/image/video generation
│   ├── project-detail.page.ts
│   ├── projects.page.ts
│   ├── signin.page.ts
│   └── signup.page.ts
├── core/               # Singleton services, guards, interceptors
│   ├── auth/
│   └── projects/       # ProjectsApiService (getProjects, getProject, createProject)
├── app.routes.ts       # All route definitions
├── app.config.ts       # Providers (HttpClient, Router, Sentry)
└── app.ts              # Root component (dark shell, nav)
libs/ui/                # spartan-ng helm components (@spartan-ng/helm/*)
```

## Implementation Workflow

1. **Confirm scope:** page, component, service, guard, form, or tests.
2. **Read existing patterns** in the target directory before writing.
3. Use standalone APIs — no NgModules.
4. Use `signal()`, `computed()`, `effect()` for state — no `Subject`/`BehaviorSubject` for local state.
5. Keep templates simple; move logic to TypeScript.
6. Keep HTTP access in `*ApiService` classes; components never build request details.
7. Add or update Vitest tests for changed behavior.

## Component Pattern

```typescript
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-example-page',
  imports: [],                     // explicit imports, spread helm imports
  template: `
    @if (loading()) {
      <p>Loading...</p>
    } @else if (error()) {
      <p class="text-destructive">{{ error() }}</p>
    } @else {
      <!-- content -->
    }
  `,
})
export class ExamplePage {
  private readonly router = inject(Router);        // inject(), not constructor

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<SomeType | null>(null);
}
```

**Rules:**
- Selector prefix: `app-`
- File naming: `kebab-case.page.ts` for pages, `kebab-case.component.ts` for shared components
- Always handle loading, error, and empty states in template
- Use `@if`/`@else`/`@for` control flow (not `*ngIf`/`*ngFor`)
- Use inline templates (no `templateUrl`) for pages
- Inject with `inject()`, never constructor injection

## API Service Pattern

```typescript
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExampleApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = window.__env?.apiUrl ?? 'http://localhost:3000/api';

  getItems(): Observable<Item[]> {
    return this.http.get<Item[]>(`${this.baseUrl}/items`);
  }

  createItem(payload: CreateItemPayload): Observable<Item> {
    return this.http.post<Item>(`${this.baseUrl}/items`, payload);
  }
}
```

**Rules:**
- `providedIn: 'root'` always
- Base URL from `window.__env?.apiUrl` with localhost fallback
- Return typed `Observable<T>` — no error handling here (interceptor handles 401)
- Components subscribe and handle errors

## State Store Pattern

```typescript
import { computed, Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'amp.feature.state';

@Injectable({ providedIn: 'root' })
export class ExampleStoreService {
  private readonly state = signal<ExampleState | null>(this.restore());

  readonly data = computed(() => this.state());
  readonly isReady = computed(() => Boolean(this.state()?.someField));

  setState(value: ExampleState): void {
    this.state.set(value);
    this.persist(value);
  }

  clearState(): void {
    this.state.set(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  private restore(): ExampleState | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as ExampleState; }
    catch { window.localStorage.removeItem(STORAGE_KEY); return null; }
  }

  private persist(value: ExampleState): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }
}
```

**Rules:**
- Private `signal()` for internal state
- Public `computed()` for derived/read access
- Storage key prefix: `amp.`
- Always check `typeof window !== 'undefined'` for SSR safety

## Form Pattern

```typescript
readonly isSubmitting = signal(false);
readonly errorMessage = signal<string | null>(null);

readonly form = new FormGroup({
  email: new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  }),
  name: new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2)],
  }),
});

get emailError(): string | null {
  const c = this.form.controls.email;
  if (!c.touched && !c.dirty) return null;
  if (c.hasError('required')) return 'Email is required';
  if (c.hasError('email')) return 'Provide a valid email address';
  return null;
}

submit(): void {
  if (this.form.invalid) { this.form.markAllAsTouched(); return; }
  this.errorMessage.set(null);
  this.isSubmitting.set(true);
  const payload = this.form.getRawValue();

  this.api.create(payload).subscribe({
    next: (result) => { /* handle success */ },
    error: (err: unknown) => {
      this.errorMessage.set(this.mapError(err));
      this.isSubmitting.set(false);
    },
    complete: () => this.isSubmitting.set(false),
  });
}
```

**Rules:**
- `nonNullable: true` on all form controls
- Per-field error getter that checks `touched`/`dirty`
- `isSubmitting` and `errorMessage` as signals
- `form.markAllAsTouched()` on invalid submit
- Map API errors to user-friendly messages

## Route Pattern

```typescript
// app.routes.ts
{
  path: 'example',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./pages/example.page').then((m) => m.ExamplePage),
},
```

**Rules:**
- Lazy-load all pages via `loadComponent`
- Apply `authGuard` to protected routes
- Functional guards only (not class-based)

## spartan-ng Usage

```typescript
import { HlmButtonImports } from '@spartan-ng/helm/button';

@Component({
  imports: [...HlmButtonImports],
  template: `
    <button hlmBtn variant="outline" size="sm">Click</button>
  `,
})
```

- Import from `@spartan-ng/helm/*` (aliased in tsconfig)
- Spread imports: `...HlmButtonImports`
- Add new components: `npx spartan-cli add <component>`

## Type Definitions

```typescript
// Use `type` (not `interface`) for data shapes
export type ExampleItem = {
  id: string;
  name: string;
  createdAt: string;
};
```

## Test Pattern (Vitest)

```typescript
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ExamplePage', () => {
  const apiMock = {
    getItems: vi.fn(),
  };

  beforeEach(async () => {
    apiMock.getItems.mockReset();
    await TestBed.configureTestingModule({
      imports: [ExamplePage],
      providers: [
        provideRouter([]),
        { provide: ExampleApiService, useValue: apiMock },
      ],
    }).compileComponents();
  });

  it('loads data on init', () => {
    apiMock.getItems.mockReturnValue(of([{ id: '1', name: 'Test' }]));
    const fixture = TestBed.createComponent(ExamplePage);
    const component = fixture.componentInstance;
    // assert
  });

  it('handles API error', () => {
    apiMock.getItems.mockReturnValue(throwError(() => new Error('fail')));
    const fixture = TestBed.createComponent(ExamplePage);
    const component = fixture.componentInstance;
    // assert error state
    expect(component.error()).toBeTruthy();
  });
});
```

**Rules:**
- Vitest (`vi.fn()`, not `jest.fn()`)
- Mock services as plain objects
- `TestBed.configureTestingModule({ imports: [Component] })`
- Test success, error, and edge cases
- Use `of()` and `throwError()` for observable mocks

## Quality Gates

- Inputs and outputs are typed end-to-end.
- Form validation is explicit with user-facing messages.
- Loading, empty, and error states handled in template.
- Accessibility: labels, keyboard flow, semantic HTML.
- No inline imports or hidden side effects.
- Tests cover happy path, error path, and edge cases.
