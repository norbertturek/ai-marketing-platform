import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProjectWithCount, ProjectsRepository } from './projects.repository';
import type { ProjectResponse, ProjectSettings } from './projects.types';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  async findAll(userId: string): Promise<ProjectResponse[]> {
    const projects = await this.projectsRepository.findAllByUserId(userId);
    return projects.map((project) => this.toResponse(project));
  }

  async create(
    userId: string,
    params: {
      name: string;
      description?: string;
      context?: string;
      settings?: ProjectSettings;
    },
  ): Promise<ProjectResponse> {
    const project = await this.projectsRepository.create(userId, {
      name: params.name,
      description: params.description,
      context: params.context,
      settings: params.settings as Prisma.InputJsonValue | undefined,
    });
    return this.toResponse({ ...project, _count: { posts: 0 } });
  }

  async update(
    id: string,
    userId: string,
    params: {
      name?: string;
      description?: string;
      context?: string;
      settings?: ProjectSettings;
    },
  ): Promise<ProjectResponse> {
    const project = await this.projectsRepository.findByIdForUser(id, userId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const updated = await this.projectsRepository.update(id, {
      name: params.name,
      description: params.description,
      context: params.context,
      settings: params.settings as Prisma.InputJsonValue | undefined,
    });

    return this.toResponse({
      ...updated,
      _count: { posts: project._count.posts },
    });
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
      settings: this.normalizeSettings(project.settings),
      postsCount: project._count.posts,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  private normalizeSettings(value: unknown): ProjectSettings | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as ProjectSettings;
  }
}
