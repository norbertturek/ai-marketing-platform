import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type CreditUsageEntry = {
  id: string;
  action: string;
  creditsCost: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type CreditsResponse = {
  balance: number;
  usage: CreditUsageEntry[];
};

@Injectable({ providedIn: 'root' })
export class CreditsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl =
    window.__env?.apiUrl ?? 'http://localhost:3000/api';

  getCredits(): Observable<CreditsResponse> {
    return this.http.get<CreditsResponse>(`${this.baseUrl}/credits`);
  }
}
