import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthResponse } from './auth.types';

type AuthCredentials = {
  email: string;
  password: string;
};

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = window.__env?.apiUrl ?? 'http://localhost:3000/api';

  register(payload: AuthCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, payload);
  }

  signIn(payload: AuthCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/signin`, payload);
  }

  refresh(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/refresh`, {
      refreshToken,
    });
  }

  signOut(refreshToken: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/signout`, { refreshToken });
  }
}
