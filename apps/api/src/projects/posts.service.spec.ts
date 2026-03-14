import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { ProjectWithCount } from './projects.repository';
import { ProjectsRepository } from './projects.repository';
import { PostsRepository } from './posts.repository';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';
import { R2Service } from '../storage/r2.service';
import { UsersRepository } from '../auth/users.repository';

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
  content: null,
  imageUrls: null,
  videoUrls: null,
  platform: null,
  status: null,
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
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
              fn({}),
            ),
          },
        },
        {
          provide: PostsRepository,
          useValue: {
            findAllByProjectId: jest.fn(),
            create: jest.fn(),
            findByIdForUser: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: ProjectsRepository,
          useValue: {
            findByIdForUser: jest.fn(),
          },
        },
        {
          provide: R2Service,
          useValue: {
            upload: jest.fn().mockResolvedValue(null),
            uploadFromUrl: jest.fn((url: string) => Promise.resolve(url)),
          },
        },
        {
          provide: UsersRepository,
          useValue: {
            getStorageCounts: jest.fn().mockResolvedValue({
              storageImageCount: 0,
              storageVideoCount: 0,
            }),
            getStorageCountsForUpdate: jest.fn().mockResolvedValue({
              storageImageCount: 0,
              storageVideoCount: 0,
            }),
            addStorageMedia: jest.fn().mockResolvedValue(undefined),
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
      content: null,
      imageUrls: [],
      videoUrls: [],
      platform: null,
      status: null,
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
    expect(postsRepo.update).not.toHaveBeenCalled();
  });

  it('creates a post with content only', async () => {
    projectsRepo.findByIdForUser.mockResolvedValue(makeMockProject());
    const post = makePost();
    const updated = {
      ...makePost(),
      content: 'Hello world',
      imageUrls: null,
      videoUrls: null,
      platform: 'instagram',
      status: 'draft',
    };
    postsRepo.create.mockResolvedValue(post);
    postsRepo.update.mockResolvedValue(updated);

    const result = await service.create('proj_1', 'u1', {
      content: 'Hello world',
      platform: 'instagram',
    });

    expect(postsRepo.create).toHaveBeenCalledWith('proj_1');
    expect(postsRepo.update).toHaveBeenCalledWith(
      'post_1',
      {
        content: 'Hello world',
        imageUrls: undefined,
        videoUrls: undefined,
        platform: 'instagram',
        status: 'draft',
      },
      expect.anything(),
    );
    expect(result.content).toBe('Hello world');
  });

  it('creates a post with imageUrls and uploads to R2', async () => {
    const r2 = {
      upload: jest.fn(),
      uploadFromUrl: jest.fn(),
      mediaKey: jest.fn(
        (_p: string, _po: string, _t: string, i: number, ext: string) =>
          `projects/proj_1/posts/post_1/image/${i}.${ext}`,
      ),
      extensionFromUrl: jest.fn((url: string) => {
        const m = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
        return m ? m[1] : 'webp';
      }),
    } as unknown as R2Service;
    (r2.upload as jest.Mock).mockResolvedValue('https://r2.example/img.webp');
    (r2.uploadFromUrl as jest.Mock).mockResolvedValue(
      'https://r2.example/img.webp',
    );

    const module = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
              fn({}),
            ),
          },
        },
        {
          provide: PostsRepository,
          useValue: {
            findAllByProjectId: jest.fn(),
            create: jest.fn(),
            findByIdForUser: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: ProjectsRepository,
          useValue: { findByIdForUser: jest.fn() },
        },
        { provide: R2Service, useValue: r2 },
        {
          provide: UsersRepository,
          useValue: {
            getStorageCounts: jest.fn().mockResolvedValue({
              storageImageCount: 0,
              storageVideoCount: 0,
            }),
            getStorageCountsForUpdate: jest.fn().mockResolvedValue({
              storageImageCount: 0,
              storageVideoCount: 0,
            }),
            addStorageMedia: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    const svc = module.get(PostsService);
    const repo = module.get(PostsRepository);
    const projRepo = module.get(ProjectsRepository);
    const usersRepo = module.get(UsersRepository);

    (projRepo.findByIdForUser as jest.Mock).mockResolvedValue(
      makeMockProject(),
    );
    (repo.create as jest.Mock).mockResolvedValue(makePost());
    (repo.update as jest.Mock).mockResolvedValue({
      ...makePost(),
      content: null,
      imageUrls: '["https://r2.example/img.webp"]',
      videoUrls: null,
      platform: null,
      status: 'draft',
    });

    const result = await svc.create('proj_1', 'u1', {
      imageUrls: ['https://example.com/image.webp'],
    });

    expect(r2.uploadFromUrl).toHaveBeenCalled();
    expect(result.imageUrls).toContain('https://r2.example/img.webp');
    expect(usersRepo.addStorageMedia).toHaveBeenCalledWith(
      'u1',
      1,
      0,
      expect.anything(),
    );
  });

  it('creates a post with videoUrls', async () => {
    const r2 = {
      upload: jest.fn(),
      uploadFromUrl: jest.fn(),
      mediaKey: jest.fn(
        (_p: string, _po: string, _t: string, i: number, ext: string) =>
          `projects/proj_1/posts/post_1/video/${i}.${ext}`,
      ),
      extensionFromUrl: jest.fn((url: string) => {
        const m = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
        return m ? m[1] : 'mp4';
      }),
    } as unknown as R2Service;
    (r2.uploadFromUrl as jest.Mock).mockImplementation((url: string) =>
      Promise.resolve(url.replace('example.com', 'r2.example')),
    );

    const module = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
              fn({}),
            ),
          },
        },
        {
          provide: PostsRepository,
          useValue: {
            findAllByProjectId: jest.fn(),
            create: jest.fn(),
            findByIdForUser: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: ProjectsRepository,
          useValue: { findByIdForUser: jest.fn() },
        },
        { provide: R2Service, useValue: r2 },
        {
          provide: UsersRepository,
          useValue: {
            getStorageCounts: jest.fn().mockResolvedValue({
              storageImageCount: 0,
              storageVideoCount: 0,
            }),
            getStorageCountsForUpdate: jest.fn().mockResolvedValue({
              storageImageCount: 0,
              storageVideoCount: 0,
            }),
            addStorageMedia: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    const svc = module.get(PostsService);
    const repo = module.get(PostsRepository);
    const projRepo = module.get(ProjectsRepository);

    (projRepo.findByIdForUser as jest.Mock).mockResolvedValue(
      makeMockProject(),
    );
    (repo.create as jest.Mock).mockResolvedValue(makePost());
    (repo.update as jest.Mock).mockResolvedValue({
      ...makePost(),
      content: null,
      imageUrls: null,
      videoUrls: '["https://r2.example/video.mp4"]',
      platform: null,
      status: 'draft',
    });

    await svc.create('proj_1', 'u1', {
      videoUrls: ['https://example.com/video.mp4'],
    });

    expect(r2.uploadFromUrl).toHaveBeenCalledWith(
      'https://example.com/video.mp4',
      expect.any(String),
      'video/mp4',
    );
  });

  it('returns early when create has no content data', async () => {
    projectsRepo.findByIdForUser.mockResolvedValue(makeMockProject());
    const post = makePost();
    postsRepo.create.mockResolvedValue(post);

    const result = await service.create('proj_1', 'u1', {});

    expect(postsRepo.create).toHaveBeenCalledWith('proj_1');
    expect(postsRepo.update).not.toHaveBeenCalled();
    expect(result.id).toBe('post_1');
  });

  it('throws when project not found for create', async () => {
    projectsRepo.findByIdForUser.mockResolvedValue(null);

    await expect(service.create('proj_unknown', 'u1')).rejects.toThrow(
      NotFoundException,
    );
    expect(postsRepo.create).not.toHaveBeenCalled();
  });

  it('finds post by id', async () => {
    projectsRepo.findByIdForUser.mockResolvedValue(makeMockProject());
    const post = makePost();
    postsRepo.findByIdForUser.mockResolvedValue(post);

    const result = await service.findById('proj_1', 'post_1', 'u1');

    expect(projectsRepo.findByIdForUser).toHaveBeenCalledWith('proj_1', 'u1');
    expect(postsRepo.findByIdForUser).toHaveBeenCalledWith(
      'post_1',
      'proj_1',
      'u1',
    );
    expect(result.id).toBe('post_1');
    expect(result.imageUrls).toEqual([]);
  });

  it('updates post', async () => {
    projectsRepo.findByIdForUser.mockResolvedValue(makeMockProject());
    postsRepo.findByIdForUser.mockResolvedValue(makePost());
    const updated = {
      ...makePost(),
      content: 'New copy',
      imageUrls: '[]',
      videoUrls: null,
    };
    postsRepo.update.mockResolvedValue(updated);

    const result = await service.update('proj_1', 'post_1', 'u1', {
      content: 'New copy',
      imageUrls: [],
    });

    expect(postsRepo.update).toHaveBeenCalled();
    expect(result.content).toBe('New copy');
  });

  it('throws ForbiddenException when create would exceed image limit', async () => {
    const usersRepo = {
      getStorageCounts: jest.fn().mockResolvedValue({
        storageImageCount: 20,
        storageVideoCount: 0,
      }),
      getStorageCountsForUpdate: jest.fn().mockResolvedValue({
        storageImageCount: 20,
        storageVideoCount: 0,
      }),
      addStorageMedia: jest.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
              fn({}),
            ),
          },
        },
        {
          provide: PostsRepository,
          useValue: {
            findAllByProjectId: jest.fn(),
            create: jest.fn(),
            findByIdForUser: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: ProjectsRepository,
          useValue: { findByIdForUser: jest.fn() },
        },
        {
          provide: R2Service,
          useValue: {
            upload: jest.fn(),
            uploadFromUrl: jest.fn(),
          },
        },
        { provide: UsersRepository, useValue: usersRepo },
      ],
    }).compile();
    const svc = module.get(PostsService);
    const projRepo = module.get(ProjectsRepository);
    const repo = module.get(PostsRepository);

    (projRepo.findByIdForUser as jest.Mock).mockResolvedValue(
      makeMockProject(),
    );
    (repo.create as jest.Mock).mockResolvedValue(makePost());

    await expect(
      svc.create('proj_1', 'u1', {
        imageUrls: ['https://example.com/one.webp'],
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(usersRepo.addStorageMedia).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when update would exceed video limit', async () => {
    const usersRepo = {
      getStorageCounts: jest.fn().mockResolvedValue({
        storageImageCount: 0,
        storageVideoCount: 20,
      }),
      getStorageCountsForUpdate: jest.fn().mockResolvedValue({
        storageImageCount: 0,
        storageVideoCount: 20,
      }),
      addStorageMedia: jest.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
              fn({}),
            ),
          },
        },
        {
          provide: PostsRepository,
          useValue: {
            findAllByProjectId: jest.fn(),
            create: jest.fn(),
            findByIdForUser: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: ProjectsRepository,
          useValue: { findByIdForUser: jest.fn() },
        },
        {
          provide: R2Service,
          useValue: {
            upload: jest.fn(),
            uploadFromUrl: jest.fn((url: string) => Promise.resolve(url)),
          },
        },
        { provide: UsersRepository, useValue: usersRepo },
      ],
    }).compile();
    const svc = module.get(PostsService);
    const projRepo = module.get(ProjectsRepository);
    const repo = module.get(PostsRepository);

    (projRepo.findByIdForUser as jest.Mock).mockResolvedValue(
      makeMockProject(),
    );
    (repo.findByIdForUser as jest.Mock).mockResolvedValue({
      ...makePost(),
      imageUrls: '[]',
      videoUrls: '[]',
    });
    (repo.update as jest.Mock).mockResolvedValue(makePost());

    await expect(
      svc.update('proj_1', 'post_1', 'u1', {
        videoUrls: ['https://example.com/extra.mp4'],
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(usersRepo.addStorageMedia).not.toHaveBeenCalled();
  });
});
