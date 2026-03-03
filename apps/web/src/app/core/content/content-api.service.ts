import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface GenerateTextPayload {
  prompt: string;
  platform?: string;
  researchContext?: string;
  numVariants?: number;
  maxLength?: number;
}

export interface GenerateTextResponse {
  texts: string[];
}

@Injectable({ providedIn: 'root' })
export class ContentApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl =
    window.__env?.apiUrl ?? 'http://localhost:3000/api';

  generateText(payload: GenerateTextPayload): Observable<GenerateTextResponse> {
    return this.http.post<GenerateTextResponse>(
      `${this.baseUrl}/content/generate-text`,
      payload
    );
  }
}
