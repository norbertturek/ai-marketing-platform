import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthApiService } from '../core/auth/auth-api.service';
import { AuthStoreService } from '../core/auth/auth-store.service';
import { SignUpPage } from './signup.page';

describe('SignUpPage', () => {
  const authApiMock = {
    register: vi.fn(),
  };
  const authStoreMock = {
    setSession: vi.fn(),
  };

  beforeEach(async () => {
    authApiMock.register.mockReset();
    authStoreMock.setSession.mockReset();
    await TestBed.configureTestingModule({
      imports: [SignUpPage],
      providers: [
        provideRouter([]),
        { provide: AuthApiService, useValue: authApiMock },
        { provide: AuthStoreService, useValue: authStoreMock },
      ],
    }).compileComponents();
  });

  it('does not submit invalid form', () => {
    const fixture = TestBed.createComponent(SignUpPage);
    const component = fixture.componentInstance;

    component.submit();

    expect(authApiMock.register).not.toHaveBeenCalled();
  });

  it('submits valid form and stores session', () => {
    authApiMock.register.mockReturnValue(
      of({
        user: { id: 'user_1', email: 'test@example.com' },
        tokens: { accessToken: 'a', refreshToken: 'r' },
      }),
    );

    const fixture = TestBed.createComponent(SignUpPage);
    const component = fixture.componentInstance;
    component.form.setValue({
      email: 'test@example.com',
      password: 'StrongPass123',
    });

    component.submit();

    expect(authApiMock.register).toHaveBeenCalled();
    expect(authStoreMock.setSession).toHaveBeenCalled();
  });

  it('surfaces API error state', () => {
    authApiMock.register.mockReturnValue(throwError(() => ({ status: 409 })));

    const fixture = TestBed.createComponent(SignUpPage);
    const component = fixture.componentInstance;
    component.form.setValue({
      email: 'taken@example.com',
      password: 'StrongPass123',
    });

    component.submit();

    expect(component.errorMessage()).toBeTruthy();
  });
});
