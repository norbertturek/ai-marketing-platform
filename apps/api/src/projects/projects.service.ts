import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectWithCount, ProjectsRepository } from './projects.repository';
import type { ProjectResponse } from './projects.types';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  async findAll(userId: string): Promise<ProjectResponse[]> {
    const projects = await this.projectsRepository.findAllByUserId(userId);
    return projects.map((project) => this.toResponse(project));
  }

  async create(
    userId: string,
    params: { name: string; description?: string; context?: string },
  ): Promise<ProjectResponse> {
    const project = await this.projectsRepository.create(userId, params);
    return this.toResponse({ ...project, _count: { posts: 0 } });
  }

  async findOne(id: string, userId: string): Promise<ProjectResponse> {
    const project = await this.projectsRepository.findByIdForUser(id, userId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.toResponse(project);
  }

  private toResponse(project: ProjectWithCount): ProjectResponse {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      context: project.context ?? null,
      postsCount: project._count.posts,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}
