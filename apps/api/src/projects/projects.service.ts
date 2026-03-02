import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectResponse } from './projects.types';
import { ProjectsRepository } from './projects.repository';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  async findAll(userId: string): Promise<ProjectResponse[]> {
    const projects = await this.projectsRepository.findAllByUserId(userId);
    return projects.map((p) => this.toResponse(p));
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

  private toResponse(
    project: {
      id: string;
      name: string;
      description: string;
      context: string | null;
      createdAt: Date;
    } & {
      _count?: { posts: number };
    },
  ): ProjectResponse {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      context: project.context,
      createdAt: project.createdAt.toISOString(),
      itemsCount: project._count?.posts ?? 0,
    };
  }
}
