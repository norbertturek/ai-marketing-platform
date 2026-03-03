import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PostsController } from './posts.controller';
import { PostsRepository } from './posts.repository';
import { PostsService } from './posts.service';
import { ProjectsController } from './projects.controller';
import { ProjectsRepository } from './projects.repository';
import { ProjectsService } from './projects.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectsController, PostsController],
  providers: [
    ProjectsService,
    ProjectsRepository,
    PostsService,
    PostsRepository,
  ],
  exports: [ProjectsService, PostsService],
})
export class ProjectsModule {}
