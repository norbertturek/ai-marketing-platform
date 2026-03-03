import { Injectable } from '@nestjs/common';
import { Post } from '@prisma/client';
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
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        projectId,
        project: { userId },
      },
    });
    return post;
  }
}
