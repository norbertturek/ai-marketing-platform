import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { App } from './app';
import { AuthApiService } from './core/auth/auth-api.service';
import { AuthStoreService } from './core/auth/auth-store.service';

describe('App', () => {
  const isAuthenticatedSignal = signal(false);
  const authStoreMock = {
    isAuthenticated: isAuthenticatedSignal,
    getRefreshToken: vi.fn(),
    clearSession: vi.fn(),
  };
  const authApiMock = {
    signOut: vi.fn(),
  };
  const routerNavigateSpy = vi.fn();

  beforeEach(async () => {
    isAuthenticatedSignal.set(false);
    authStoreMock.getRefreshToken.mockReset();
    authStoreMock.clearSession.mockReset();
    authApiMock.signOut.mockReset();
    routerNavigateSpy.mockReset();

    await TestBed.configureTestingModule({
      imports: [App, RouterTestingModule],
      providers: [
        { provide: AuthStoreService, useValue: authStoreMock },
        { provide: AuthApiService, useValue: authApiMock },
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    routerNavigateSpy.mockReturnValue(Promise.resolve(true));
    vi.spyOn(router, 'navigate').mockImplementation(
      (...args: unknown[]) => {
        routerNavigateSpy(...args);
        return Promise.resolve(true);
      }
    );
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render header with branding and Dashboard and Playground', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('AI Marketing Platform');
    expect(el.textContent).toContain('Dashboard');
    expect(el.textContent).toContain('Playground');
  });

  describe('navbar when not authenticated', () => {
    beforeEach(() => {
      isAuthenticatedSignal.set(false);
    });

    it('shows Sign in and Sign up and does not show Logout', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Sign in');
      expect(el.textContent).toContain('Sign up');
      expect(el.textContent).not.toContain('Logout');
    });

    it('logo link points to signin', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const logoLink = (fixture.nativeElement as HTMLElement).querySelector(
        'a[routerlink="/signin"]'
      );
      expect(logoLink).toBeTruthy();
    });
  });

  describe('navbar when authenticated', () => {
    beforeEach(() => {
      isAuthenticatedSignal.set(true);
    });

    it('shows Dashboard, Playground and Logout and does not show Sign in or Sign up', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Dashboard');
      expect(el.textContent).toContain('Playground');
      expect(el.textContent).toContain('Logout');
      expect(el.textContent).not.toContain('Sign in');
      expect(el.textContent).not.toContain('Sign up');
    });

    it('logo link points to dashboard', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const logoLink = (fixture.nativeElement as HTMLElement).querySelector(
        'a[routerlink="/dashboard"]'
      );
      expect(logoLink).toBeTruthy();
    });

    it('clicking Logout calls signOut, clearSession and navigates to signin', () => {
      authStoreMock.getRefreshToken.mockReturnValue('refresh-token');
      authApiMock.signOut.mockReturnValue(of(undefined));

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const logoutBtn = el.querySelector('button');
      expect(logoutBtn?.textContent?.trim()).toBe('Logout');
      logoutBtn?.click();
      fixture.detectChanges();

      expect(authApiMock.signOut).toHaveBeenCalledWith('refresh-token');
      expect(authStoreMock.clearSession).toHaveBeenCalled();
      expect(routerNavigateSpy).toHaveBeenCalledWith(['/signin']);
    });

    it('when no refresh token, Logout clears session and navigates without calling API', () => {
      authStoreMock.getRefreshToken.mockReturnValue(null);

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      el.querySelector('button')?.click();
      fixture.detectChanges();

      expect(authApiMock.signOut).not.toHaveBeenCalled();
      expect(authStoreMock.clearSession).toHaveBeenCalled();
      expect(routerNavigateSpy).toHaveBeenCalledWith(['/signin']);
    });

    it('when signOut API fails, still clears session and navigates to signin', () => {
      authStoreMock.getRefreshToken.mockReturnValue('refresh-token');
      authApiMock.signOut.mockReturnValue(throwError(() => new Error('network')));

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      (fixture.nativeElement as HTMLElement).querySelector('button')?.click();
      fixture.detectChanges();

      expect(authStoreMock.clearSession).toHaveBeenCalled();
      expect(routerNavigateSpy).toHaveBeenCalledWith(['/signin']);
    });
  });
});
