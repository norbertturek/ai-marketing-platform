import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import { PostsRepository } from './posts.repository';
import type { PostResponse } from './posts.types';
import { R2Service } from '../storage/r2.service';

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr)
      ? arr.filter((x): x is string => typeof x === 'string')
      : [];
  } catch {
    return [];
  }
}

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly projectsRepository: ProjectsRepository,
    private readonly r2: R2Service,
  ) {}

  async findAllByProjectId(
    projectId: string,
    userId: string,
  ): Promise<PostResponse[]> {
    const project = await this.projectsRepository.findByIdForUser(
      projectId,
      userId,
    );
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const posts = await this.postsRepository.findAllByProjectId(
      projectId,
      userId,
    );
    return posts.map((p) => this.toResponse(p));
  }

  async create(projectId: string, userId: string): Promise<PostResponse> {
    const project = await this.projectsRepository.findByIdForUser(
      projectId,
      userId,
    );
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const post = await this.postsRepository.create(projectId);
    return this.toResponse(post);
  }

  async findById(
    projectId: string,
    postId: string,
    userId: string,
  ): Promise<PostResponse> {
    const project = await this.projectsRepository.findByIdForUser(
      projectId,
      userId,
    );
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const post = await this.postsRepository.findByIdForUser(
      postId,
      projectId,
      userId,
    );
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return this.toResponse(post);
  }

  async update(
    projectId: string,
    postId: string,
    userId: string,
    data: {
      content?: string;
      imageUrls?: string[];
      videoUrls?: string[];
      platform?: string;
      status?: string;
    },
  ): Promise<PostResponse> {
    const project = await this.projectsRepository.findByIdForUser(
      projectId,
      userId,
    );
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const post = await this.postsRepository.findByIdForUser(
      postId,
      projectId,
      userId,
    );
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const imageUrls = await this.copyMediaToR2(
      data.imageUrls,
      projectId,
      postId,
      'image',
    );
    const videoUrls = await this.copyMediaToR2(
      data.videoUrls,
      projectId,
      postId,
      'video',
    );

    const updated = await this.postsRepository.update(postId, {
      content: data.content,
      imageUrls:
        imageUrls !== undefined ? JSON.stringify(imageUrls) : undefined,
      videoUrls:
        videoUrls !== undefined ? JSON.stringify(videoUrls) : undefined,
      platform: data.platform,
      status: data.status,
    });
    return this.toResponse(updated);
  }

  private async copyMediaToR2(
    urls: string[] | undefined,
    projectId: string,
    postId: string,
    type: 'image' | 'video',
  ): Promise<string[] | undefined> {
    if (!urls || urls.length === 0) return undefined;

    const results: string[] = [];
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      if (!url) continue;
      if (url.startsWith('data:')) {
        const [header, base64] = url.split(',');
        const mime =
          header.match(/data:([^;]+)/)?.[1] ?? 'application/octet-stream';
        const ext = mime.split('/')[1] ?? (type === 'image' ? 'webp' : 'mp4');
        const buffer = Buffer.from(base64, 'base64');
        const key = this.r2.mediaKey(projectId, postId, type, i, ext);
        const r2Url = await this.r2.upload(key, buffer, mime);
        results.push(r2Url ?? url);
      } else if (url.startsWith('http://') || url.startsWith('https://')) {
        const ext =
          this.r2.extensionFromUrl(url) || (type === 'image' ? 'webp' : 'mp4');
        const key = this.r2.mediaKey(projectId, postId, type, i, ext);
        const contentType =
          type === 'image' ? `image/${ext || 'webp'}` : `video/${ext || 'mp4'}`;
        const r2Url = await this.r2.uploadFromUrl(url, key, contentType);
        results.push(r2Url);
      } else {
        results.push(url);
      }
    }
    return results;
  }

  private toResponse(post: {
    id: string;
    projectId: string;
    content: string | null;
    imageUrls: string | null;
    videoUrls: string | null;
    platform: string | null;
    status: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): PostResponse {
    return {
      id: post.id,
      projectId: post.projectId,
      content: post.content,
      imageUrls: parseJsonArray(post.imageUrls),
      videoUrls: parseJsonArray(post.videoUrls),
      platform: post.platform,
      status: post.status,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }
}
