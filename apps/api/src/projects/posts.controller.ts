import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostsService } from './posts.service';
import type { PostResponse } from './posts.types';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('projects/:projectId/posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PostResponse[]> {
    return this.postsService.findAllByProjectId(projectId, user.userId);
  }

  @Get(':postId')
  findOne(
    @Param('projectId') projectId: string,
    @Param('postId') postId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PostResponse> {
    return this.postsService.findById(projectId, postId, user.userId);
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePostDto = {},
  ): Promise<PostResponse> {
    return this.postsService.create(projectId, user.userId, dto);
  }

  @Patch(':postId')
  update(
    @Param('projectId') projectId: string,
    @Param('postId') postId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePostDto,
  ): Promise<PostResponse> {
    return this.postsService.update(projectId, postId, user.userId, {
      content: dto.content,
      imageUrls: dto.imageUrls,
      videoUrls: dto.videoUrls,
      platform: dto.platform,
      status: dto.status,
    });
  }
}
