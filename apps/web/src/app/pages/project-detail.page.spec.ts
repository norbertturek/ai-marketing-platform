import { TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { LucideAngularModule } from 'lucide-angular';
import { LUCIDE_ICONS } from '../app.config';
import { ProjectsApiService } from '../core/projects/projects-api.service';
import { PostsApiService } from '../core/projects/posts-api.service';
import { ProjectDetailPage } from './project-detail.page';

describe('ProjectDetailPage', () => {
  const projectsApiMock = {
    getProject: vi.fn(),
  };
  const postsApiMock = {
    getPosts: vi.fn(),
    createPost: vi.fn(),
  };

  beforeEach(async () => {
    projectsApiMock.getProject.mockReset();
    postsApiMock.getPosts.mockReset();
    postsApiMock.createPost.mockReset();

    projectsApiMock.getProject.mockReturnValue(
      of({
        id: 'proj_1',
        name: 'Test Project',
        description: '',
        context: null,
        settings: null,
        postsCount: 0,
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      }),
    );
    postsApiMock.getPosts.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ProjectDetailPage],
      providers: [
        provideRouter([{ path: 'project/:projectId', component: ProjectDetailPage }]),
        importProvidersFrom(LucideAngularModule.pick(LUCIDE_ICONS)),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (k: string) => (k === 'projectId' ? 'proj_1' : null) } },
          },
        },
        { provide: ProjectsApiService, useValue: projectsApiMock },
        { provide: PostsApiService, useValue: postsApiMock },
      ],
    }).compileComponents();
  });

  it('loads project and posts on init', () => {
    postsApiMock.getPosts.mockReturnValue(
      of([
        {
          id: 'post_1',
          projectId: 'proj_1',
          content: null,
          imageUrls: [],
          videoUrls: [],
          platform: null,
          status: null,
          createdAt: '2026-03-02T12:00:00.000Z',
          updatedAt: '2026-03-02T12:00:00.000Z',
        },
      ]),
    );

    const fixture = TestBed.createComponent(ProjectDetailPage);
    fixture.detectChanges();

    expect(projectsApiMock.getProject).toHaveBeenCalledWith('proj_1');
    expect(postsApiMock.getPosts).toHaveBeenCalledWith('proj_1');
    expect(fixture.nativeElement.textContent).toContain('Test Project');
    expect(fixture.nativeElement.textContent).toContain('Post');
  });

  it('shows empty state when no posts', () => {
    const fixture = TestBed.createComponent(ProjectDetailPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No posts');
    expect(fixture.nativeElement.textContent).toContain('Create first post');
  });
});
