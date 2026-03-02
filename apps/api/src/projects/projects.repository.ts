import { Injectable } from '@nestjs/common';
import { Project } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type ProjectWithCount = Project & { _count: { posts: number } };

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUserId(userId: string): Promise<ProjectWithCount[]> {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { posts: true } } },
    });
  }

  create(
    userId: string,
    data: { name: string; description?: string; context?: string },
  ): Promise<Project> {
    return this.prisma.project.create({
      data: {
        userId,
        name: data.name,
        description: data.description ?? '',
        context: data.context,
      },
    });
  }

  findByIdForUser(
    id: string,
    userId: string,
  ): Promise<ProjectWithCount | null> {
    return this.prisma.project.findFirst({
      where: { id, userId },
      include: { _count: { select: { posts: true } } },
    });
  }
}
