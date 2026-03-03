import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { ProjectWithCount } from './projects.repository';
import { ProjectsRepository } from './projects.repository';
import { PostsRepository } from './posts.repository';
import { PostsService } from './posts.service';

const makeMockProject = (): ProjectWithCount =>
  ({
    id: 'proj_1',
    userId: 'u1',
    name: '',
    description: '',
    context: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { posts: 0 },
  }) as ProjectWithCount;

const makePost = () => ({
  id: 'post_1',
  projectId: 'proj_1',
  createdAt: new Date('2026-03-02T12:00:00.000Z'),
  updatedAt: new Date('2026-03-02T12:00:00.000Z'),
});

describe('PostsService', () => {
  let service: PostsService;
  let postsRepo: jest.Mocked<PostsRepository>;
  let projectsRepo: jest.Mocked<ProjectsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PostsRepository,
          useValue: {
            findAllByProjectId: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: ProjectsRepository,
          useValue: {
            findByIdForUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(PostsService);
    postsRepo = module.get(PostsRepository);
    projectsRepo = module.get(ProjectsRepository);
  });

  it('finds all posts by project id', async () => {
    projectsRepo.findByIdForUser.mockResolvedValue(makeMockProject());
    const post = makePost();
    postsRepo.findAllByProjectId.mockResolvedValue([post]);

    const result = await service.findAllByProjectId('proj_1', 'u1');

    expect(projectsRepo.findByIdForUser).toHaveBeenCalledWith('proj_1', 'u1');
    expect(postsRepo.findAllByProjectId).toHaveBeenCalledWith('proj_1', 'u1');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'post_1',
      projectId: 'proj_1',
      createdAt: '2026-03-02T12:00:00.000Z',
      updatedAt: '2026-03-02T12:00:00.000Z',
    });
  });

  it('throws when project not found for findAll', async () => {
    projectsRepo.findByIdForUser.mockResolvedValue(null);

    await expect(
      service.findAllByProjectId('proj_unknown', 'u1'),
    ).rejects.toThrow(NotFoundException);
    expect(postsRepo.findAllByProjectId).not.toHaveBeenCalled();
  });

  it('creates a post', async () => {
    projectsRepo.findByIdForUser.mockResolvedValue(makeMockProject());
    const post = makePost();
    postsRepo.create.mockResolvedValue(post);

    const result = await service.create('proj_1', 'u1');

    expect(projectsRepo.findByIdForUser).toHaveBeenCalledWith('proj_1', 'u1');
    expect(postsRepo.create).toHaveBeenCalledWith('proj_1');
    expect(result.id).toBe('post_1');
  });

  it('throws when project not found for create', async () => {
    projectsRepo.findByIdForUser.mockResolvedValue(null);

    await expect(service.create('proj_unknown', 'u1')).rejects.toThrow(
      NotFoundException,
    );
    expect(postsRepo.create).not.toHaveBeenCalled();
  });
});
