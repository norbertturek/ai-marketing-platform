import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectResponse } from './projects.types';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(
    @CurrentUser() user: { userId: string; email: string },
  ): Promise<ProjectResponse[]> {
    return this.projectsService.findAll(user.userId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; email: string },
  ): Promise<ProjectResponse> {
    return this.projectsService.findOne(id, user.userId);
  }

  @Post()
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: { userId: string; email: string },
  ): Promise<ProjectResponse> {
    return this.projectsService.create(user.userId, {
      name: dto.name,
      description: dto.description,
      context: dto.context,
    });
  }
}
