import { Injectable, computed, signal } from '@angular/core';
import { AuthSession, AuthTokens } from './auth.types';

const SESSION_STORAGE_KEY = 'amp.auth.session';

@Injectable({ providedIn: 'root' })
export class AuthStoreService {
  private readonly sessionState = signal<AuthSession | null>(this.restoreSession());

  readonly session = computed(() => this.sessionState());
  readonly isAuthenticated = computed(() => Boolean(this.sessionState()?.tokens.accessToken));

  getAccessToken(): string | null {
    return this.sessionState()?.tokens.accessToken ?? null;
  }

  getRefreshToken(): string | null {
    return this.sessionState()?.tokens.refreshToken ?? null;
  }

  updateTokens(tokens: AuthTokens): void {
    const currentSession = this.sessionState();
    if (!currentSession) {
      return;
    }

    this.setSession({
      ...currentSession,
      tokens,
    });
  }

  setSession(session: AuthSession): void {
    this.sessionState.set(session);
    this.persistSession(session);
  }

  clearSession(): void {
    this.sessionState.set(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  private restoreSession(): AuthSession | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawSession) {
      return null;
    }

    try {
      return JSON.parse(rawSession) as AuthSession;
    } catch {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }

  private persistSession(session: AuthSession): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
}
