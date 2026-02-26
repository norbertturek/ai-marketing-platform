import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { App } from './app';
import { routes } from './app.routes';
import { AuthApiService } from './core/auth/auth-api.service';
import { AuthStoreService } from './core/auth/auth-store.service';

/**
 * Integration tests for the app navbar with real router config.
 * Verifies navbar content and logout flow with routing.
 */
describe('App navbar (integration)', () => {
  const isAuthenticatedSignal = signal(false);
  const authStoreMock = {
    isAuthenticated: isAuthenticatedSignal,
    getRefreshToken: vi.fn(),
    clearSession: vi.fn(),
  };
  const authApiMock = {
    signOut: vi.fn(),
  };
  let router: Router;
  const navigateSpy = vi.fn<(...args: unknown[]) => Promise<boolean>>();

  beforeEach(async () => {
    isAuthenticatedSignal.set(false);
    authStoreMock.getRefreshToken.mockReset();
    authStoreMock.clearSession.mockReset();
    authApiMock.signOut.mockReset();
    navigateSpy.mockReset();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        { provide: AuthStoreService, useValue: authStoreMock },
        { provide: AuthApiService, useValue: authApiMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy.mockReturnValue(Promise.resolve(true));
    vi.spyOn(router, 'navigate').mockImplementation(
      (...args: unknown[]) => {
        (navigateSpy as (...args: unknown[]) => Promise<boolean>)(...args);
        return Promise.resolve(true);
      }
    );
  });

  it('shows Sign in and Sign up when not authenticated and navigates to playground', async () => {
    await router.navigate(['/playground']);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Sign in');
    expect(el.textContent).toContain('Sign up');
    expect(el.textContent).not.toContain('Logout');
  });

  it('shows Logout and hides Sign in/Sign up when authenticated', async () => {
    isAuthenticatedSignal.set(true);
    await router.navigate(['/playground']);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Logout');
    expect(el.textContent).not.toContain('Sign in');
    expect(el.textContent).not.toContain('Sign up');
  });

  it('after clicking Logout, clears session and navigates to signin', async () => {
    isAuthenticatedSignal.set(true);
    authStoreMock.getRefreshToken.mockReturnValue('refresh-token');
    authApiMock.signOut.mockReturnValue(of(undefined));

    await router.navigate(['/playground']);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const logoutBtn = el.querySelector('button');
    expect(logoutBtn?.textContent?.trim()).toBe('Logout');
    logoutBtn?.click();
    fixture.detectChanges();

    expect(authApiMock.signOut).toHaveBeenCalledWith('refresh-token');
    expect(authStoreMock.clearSession).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/signin']);
  });

  it('when signOut API fails, still clears session and navigates to signin', async () => {
    isAuthenticatedSignal.set(true);
    authStoreMock.getRefreshToken.mockReturnValue('rt');
    authApiMock.signOut.mockReturnValue(throwError(() => new Error('network')));

    await router.navigate(['/playground']);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();
    fixture.detectChanges();

    expect(authStoreMock.clearSession).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/signin']);
  });
});
