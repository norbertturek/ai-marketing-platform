import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type GenerateTextPayload = {
  prompt: string;
  platform?: string;
  numVariants?: number;
  maxLength?: number;
  model?: string;
  temperature?: number;
};

export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type GenerateTextResponse = {
  texts: string[];
  usage: TokenUsage;
  model: string;
  remainingCredits: number;
};

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
