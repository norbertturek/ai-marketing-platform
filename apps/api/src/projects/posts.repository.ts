import { Injectable } from '@nestjs/common';
import { Post } from '@prisma/client';
import type { TransactionClient } from '../auth/users.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByProjectId(projectId: string, userId: string): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: {
        projectId,
        project: { userId },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(projectId: string): Promise<Post> {
    return this.prisma.post.create({
      data: { projectId },
    });
  }

  async findByIdForUser(
    postId: string,
    projectId: string,
    userId: string,
  ): Promise<Post | null> {
    return this.prisma.post.findFirst({
      where: {
        id: postId,
        projectId,
        project: { userId },
      },
    });
  }

  async update(
    postId: string,
    data: {
      content?: string;
      imageUrls?: string;
      videoUrls?: string;
      platform?: string;
      status?: string;
    },
    tx?: TransactionClient,
  ): Promise<Post> {
    const client = tx ?? this.prisma;
    return client.post.update({
      where: { id: postId },
      data: { ...data, updatedAt: new Date() },
    });
  }
}
