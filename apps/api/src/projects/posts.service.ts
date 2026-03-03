import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import { PostsRepository } from './posts.repository';
import type { PostResponse } from './posts.types';

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly projectsRepository: ProjectsRepository,
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

  private toResponse(post: {
    id: string;
    projectId: string;
    createdAt: Date;
    updatedAt: Date;
  }): PostResponse {
    return {
      id: post.id,
      projectId: post.projectId,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }
}
