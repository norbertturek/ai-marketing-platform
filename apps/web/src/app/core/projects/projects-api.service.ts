import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type ProjectSettings = {
  defaultPlatform?: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok';
  defaultAiModel?: 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo';
  defaultNumTextVariants?: number;
  defaultMaxLength?: number;
  defaultTemperature?: number;
  defaultImageModel?: string;
  defaultAspectRatio?: '1:1' | '16:9' | '9:16' | '4:5';
  defaultImageOutputFormat?: 'JPG' | 'PNG' | 'WEBP';
  defaultNumImageVariants?: number;
  defaultVideoModel?: string;
  defaultVideoDuration?: number;
  defaultNumVideoVariants?: number;
  defaultMotionIntensity?: 'low' | 'medium' | 'high';
  defaultCameraMovement?: 'static' | 'pan' | 'zoom' | 'dolly';
  defaultFps?: '24' | '30' | '60';
  defaultLoopVideo?: boolean;
};

export type ProjectResponse = {
  id: string;
  name: string;
  description: string;
  context: string | null;
  settings: ProjectSettings | null;
  postsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectPayload = {
  name: string;
  description?: string;
  context?: string;
  settings?: ProjectSettings;
};

export type UpdateProjectPayload = {
  name?: string;
  description?: string;
  context?: string;
  settings?: ProjectSettings;
};

@Injectable({ providedIn: 'root' })
export class ProjectsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = window.__env?.apiUrl ?? 'http://localhost:3000/api';

  getProjects(): Observable<ProjectResponse[]> {
    return this.http.get<ProjectResponse[]>(`${this.baseUrl}/projects`);
  }

  getProject(id: string): Observable<ProjectResponse> {
    return this.http.get<ProjectResponse>(`${this.baseUrl}/projects/${id}`);
  }

  createProject(payload: CreateProjectPayload): Observable<ProjectResponse> {
    return this.http.post<ProjectResponse>(`${this.baseUrl}/projects`, payload);
  }

  updateProject(
    id: string,
    payload: UpdateProjectPayload
  ): Observable<ProjectResponse> {
    return this.http.patch<ProjectResponse>(`${this.baseUrl}/projects/${id}`, payload);
  }
}
