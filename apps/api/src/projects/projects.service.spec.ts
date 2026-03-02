import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsRepository } from './projects.repository';
import { ProjectsService } from './projects.service';

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
          },
        },
      ],
    }).compile();

    service = module.get(ProjectsService);
    repository = module.get(ProjectsRepository);
  });

  it('returns projects for user', async () => {
    const projects = [
      {
        id: 'proj_1',
        name: 'Campaign',
        description: 'Desc',
        context: null,
        userId: 'user_1',
        createdAt: new Date('2026-02-15'),
        updatedAt: new Date(),
        _count: { posts: 5 },
      },
    ];
    repository.findAllByUserId.mockResolvedValue(projects);

    const result = await service.findAll('user_1');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'proj_1',
      name: 'Campaign',
      description: 'Desc',
      context: null,
      createdAt: '2026-02-15T00:00:00.000Z',
      itemsCount: 5,
    });
    expect(repository.findAllByUserId).toHaveBeenCalledWith('user_1');
  });

  it('creates project for user', async () => {
    const created = {
      id: 'proj_new',
      name: 'New Project',
      description: 'New desc',
      context: null,
      userId: 'user_1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repository.create.mockResolvedValue(created);

    const result = await service.create('user_1', {
      name: 'New Project',
      description: 'New desc',
    });

    expect(result.id).toBe('proj_new');
    expect(result.name).toBe('New Project');
    expect(result.itemsCount).toBe(0);
    expect(repository.create).toHaveBeenCalledWith('user_1', {
      name: 'New Project',
      description: 'New desc',
    });
  });

  it('returns single project when found for user', async () => {
    const project = {
      id: 'proj_1',
      name: 'Campaign',
      description: 'Desc',
      context: null,
      userId: 'user_1',
      createdAt: new Date('2026-02-15'),
      updatedAt: new Date(),
      _count: { posts: 3 },
    };
    repository.findByIdForUser.mockResolvedValue(project);

    const result = await service.findOne('proj_1', 'user_1');

    expect(result.id).toBe('proj_1');
    expect(result.itemsCount).toBe(3);
    expect(repository.findByIdForUser).toHaveBeenCalledWith('proj_1', 'user_1');
  });

  it('throws NotFoundException when project not found for user', async () => {
    repository.findByIdForUser.mockResolvedValue(null);

    await expect(service.findOne('missing', 'user_1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
