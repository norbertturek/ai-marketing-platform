import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Project } from '@prisma/client';
import { ProjectsRepository } from './projects.repository';
import { ProjectsService } from './projects.service';

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'proj_1',
  name: 'Launch campaign',
  description: 'Desc',
  context: null,
  settings: null,
  userId: 'user_1',
  createdAt: new Date('2026-03-02T10:00:00.000Z'),
  updatedAt: new Date('2026-03-02T10:00:00.000Z'),
  ...overrides,
});

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repository: jest.Mocked<ProjectsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: ProjectsRepository,
          useValue: {
            findAllByUserId: jest.fn(),
            create: jest.fn(),
            findByIdForUser: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ProjectsService);
    repository = module.get(ProjectsRepository);
  });

  it('returns projects mapped to response shape', async () => {
    repository.findAllByUserId.mockResolvedValue([
      { ...makeProject(), _count: { posts: 2 } },
    ]);

    const result = await service.findAll('user_1');

    expect(result).toEqual([
      expect.objectContaining({
        id: 'proj_1',
        name: 'Launch campaign',
        postsCount: 2,
      }),
    ]);
    expect(repository.findAllByUserId.mock.calls).toEqual([['user_1']]);
  });

  it('creates a project with zero posts count', async () => {
    repository.create.mockResolvedValue(
      makeProject({ name: 'New Project', description: '' }),
    );

    const result = await service.create('user_1', {
      name: 'New Project',
      context: 'Friendly tone',
    });

    expect(result).toEqual(
      expect.objectContaining({
        name: 'New Project',
        postsCount: 0,
      }),
    );
    expect(repository.create.mock.calls).toEqual([
      [
        'user_1',
        {
          name: 'New Project',
          context: 'Friendly tone',
        },
      ],
    ]);
  });

  it('updates project settings for owner', async () => {
    repository.findByIdForUser.mockResolvedValue({
      ...makeProject(),
      _count: { posts: 1 },
    });
    repository.update.mockResolvedValue(
      makeProject({
        settings: {
          defaultPlatform: 'linkedin',
          defaultVideoDuration: 5,
        },
      }),
    );

    const result = await service.update('proj_1', 'user_1', {
      settings: {
        defaultPlatform: 'linkedin',
        defaultVideoDuration: 5,
      },
    });

    expect(result.settings).toEqual({
      defaultPlatform: 'linkedin',
      defaultVideoDuration: 5,
    });
    expect(repository.update).toHaveBeenCalledWith(
      'proj_1',
      expect.objectContaining({
        settings: expect.objectContaining({
          defaultPlatform: 'linkedin',
          defaultVideoDuration: 5,
        }),
      }),
    );
  });

  it('returns single project for owner', async () => {
    repository.findByIdForUser.mockResolvedValue({
      ...makeProject(),
      _count: { posts: 5 },
    });

    const result = await service.findOne('proj_1', 'user_1');

    expect(result.id).toBe('proj_1');
    expect(result.postsCount).toBe(5);
    expect(repository.findByIdForUser.mock.calls).toEqual([
      ['proj_1', 'user_1'],
    ]);
  });

  it('throws NotFoundException when project is missing or not owned', async () => {
    repository.findByIdForUser.mockResolvedValue(null);

    await expect(
      service.findOne('proj_missing', 'user_1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
