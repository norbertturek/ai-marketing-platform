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
  seedImage?: string;
  maskImage?: string;
  guideImage?: string;
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
  model?: string;
  duration?: number;
  width?: number;
  height?: number;
  negativePrompt?: string;
  cfgScale?: number;
  numberResults?: number;
};

export type GenerateVideoResponse = {
  urls: string[];
  remainingCredits: number;
};

export type StartVideoGenerationResponse = {
  taskUUIDs: string[];
  remainingCredits: number;
};

export type VideoTaskStatus = {
  taskUUID: string;
  status: 'processing' | 'success' | 'error';
  videoURL?: string;
  error?: string;
};

export type VideoGenerationStatusPayload = {
  taskUUIDs: string[];
};

export type VideoGenerationStatusResponse = {
  items: VideoTaskStatus[];
  done: boolean;
  urls: string[];
};

export type RunwareImageModelCapability = {
  id: string;
  label: string;
  description: string;
  requiredInputs: Array<'seedImage' | 'maskImage' | 'guideImage'>;
  supportsNegativePrompt: boolean;
};

export type VideoDurationSpec =
  | { mode: 'enum'; values: number[] }
  | { mode: 'range'; min: number; max: number; step: number };

export type VideoResolution = {
  width: number;
  height: number;
  label: string;
};

export type RunwareVideoModelCapability = {
  id: string;
  label: string;
  description: string;
  duration: VideoDurationSpec;
  durationOptions: number[];
  resolutions: VideoResolution[];
  inferDimensionsFromImage: boolean;
  supportsNegativePrompt: boolean;
  supportsCfgScale: boolean;
  inputShape: 'frameImages' | 'inputs.frameImages';
  defaults: {
    duration: number;
    width?: number;
    height?: number;
    cfgScale?: number;
  };
};

export type ContentCapabilitiesResponse = {
  imageModels: RunwareImageModelCapability[];
  videoModels: RunwareVideoModelCapability[];
  defaults: {
    imageModel: string;
    videoModel: string;
  };
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

  startVideoGeneration(
    payload: GenerateVideoPayload
  ): Observable<StartVideoGenerationResponse> {
    return this.http.post<StartVideoGenerationResponse>(
      `${this.baseUrl}/content/generate-video/start`,
      payload
    );
  }

  getVideoGenerationStatus(
    payload: VideoGenerationStatusPayload
  ): Observable<VideoGenerationStatusResponse> {
    return this.http.post<VideoGenerationStatusResponse>(
      `${this.baseUrl}/content/generate-video/status`,
      payload
    );
  }

  getCapabilities(): Observable<ContentCapabilitiesResponse> {
    return this.http.get<ContentCapabilitiesResponse>(
      `${this.baseUrl}/content/capabilities`
    );
  }
}
