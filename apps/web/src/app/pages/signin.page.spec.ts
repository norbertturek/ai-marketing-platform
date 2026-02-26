import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthApiService } from '../core/auth/auth-api.service';
import { AuthStoreService } from '../core/auth/auth-store.service';
import { SignInPage } from './signin.page';

describe('SignInPage', () => {
  const authApiMock = {
    signIn: vi.fn(),
  };
  const authStoreMock = {
    setSession: vi.fn(),
  };

  beforeEach(async () => {
    authApiMock.signIn.mockReset();
    authStoreMock.setSession.mockReset();
    await TestBed.configureTestingModule({
      imports: [SignInPage],
      providers: [
        provideRouter([]),
        { provide: AuthApiService, useValue: authApiMock },
        { provide: AuthStoreService, useValue: authStoreMock },
      ],
    }).compileComponents();
  });

  it('does not submit invalid form', () => {
    const fixture = TestBed.createComponent(SignInPage);
    const component = fixture.componentInstance;

    component.submit();

    expect(authApiMock.signIn).not.toHaveBeenCalled();
  });

  it('submits valid form and stores session', () => {
    authApiMock.signIn.mockReturnValue(
      of({
        user: { id: 'user_1', email: 'test@example.com' },
        tokens: { accessToken: 'a', refreshToken: 'r' },
      }),
    );

    const fixture = TestBed.createComponent(SignInPage);
    const component = fixture.componentInstance;
    component.form.setValue({
      email: 'test@example.com',
      password: 'StrongPass123',
    });

    component.submit();

    expect(authApiMock.signIn).toHaveBeenCalled();
    expect(authStoreMock.setSession).toHaveBeenCalled();
  });

  it('surfaces API error state', () => {
    authApiMock.signIn.mockReturnValue(throwError(() => ({ status: 401 })));

    const fixture = TestBed.createComponent(SignInPage);
    const component = fixture.componentInstance;
    component.form.setValue({
      email: 'user@example.com',
      password: 'wrongpass',
    });

    component.submit();

    expect(component.errorMessage()).toBeTruthy();
  });
});
