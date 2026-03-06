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

export type GenerateImagePayload = {
  prompt: string;
  negativePrompt?: string;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  numberResults?: number;
  outputFormat?: 'JPG' | 'PNG' | 'WEBP';
};

export type GenerateImageResponse = {
  urls: string[];
  imageUUIDs: string[];
  remainingCredits: number;
};

export type GenerateVideoPayload = {
  imageUUID?: string;
  imageData?: string;
  prompt: string;
  duration?: number;
  numberResults?: number;
};

export type GenerateVideoResponse = {
  urls: string[];
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

  generateImage(
    payload: GenerateImagePayload
  ): Observable<GenerateImageResponse> {
    return this.http.post<GenerateImageResponse>(
      `${this.baseUrl}/content/generate-image`,
      payload
    );
  }

  generateVideo(
    payload: GenerateVideoPayload
  ): Observable<GenerateVideoResponse> {
    return this.http.post<GenerateVideoResponse>(
      `${this.baseUrl}/content/generate-video`,
      payload
    );
  }
}
