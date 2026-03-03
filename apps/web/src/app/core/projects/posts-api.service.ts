import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type PostResponse = {
  id: string;
  projectId: string;
  content: string | null;
  imageUrls: string[];
  videoUrls: string[];
  platform: string | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdatePostPayload = {
  content?: string;
  imageUrls?: string[];
  videoUrls?: string[];
  platform?: string;
  status?: string;
};

@Injectable({ providedIn: 'root' })
export class PostsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = window.__env?.apiUrl ?? 'http://localhost:3000/api';

  getPosts(projectId: string): Observable<PostResponse[]> {
    return this.http.get<PostResponse[]>(
      `${this.baseUrl}/projects/${projectId}/posts`
    );
  }

  getPost(projectId: string, postId: string): Observable<PostResponse> {
    return this.http.get<PostResponse>(
      `${this.baseUrl}/projects/${projectId}/posts/${postId}`
    );
  }

  createPost(projectId: string): Observable<PostResponse> {
    return this.http.post<PostResponse>(
      `${this.baseUrl}/projects/${projectId}/posts`,
      {}
    );
  }

  updatePost(
    projectId: string,
    postId: string,
    payload: UpdatePostPayload
  ): Observable<PostResponse> {
    return this.http.patch<PostResponse>(
      `${this.baseUrl}/projects/${projectId}/posts/${postId}`,
      payload
    );
  }
}
