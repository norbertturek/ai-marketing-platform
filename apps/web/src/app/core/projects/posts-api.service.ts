import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type PostResponse = {
  id: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
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

  createPost(projectId: string): Observable<PostResponse> {
    return this.http.post<PostResponse>(
      `${this.baseUrl}/projects/${projectId}/posts`,
      {}
    );
  }
}
