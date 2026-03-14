import { TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { LucideAngularModule } from 'lucide-angular';
import { LUCIDE_ICONS } from '../app.config';
import { ProjectsApiService } from '../core/projects/projects-api.service';
import { ProjectsPage } from './projects.page';

describe('ProjectsPage', () => {
  const projectsApiMock = {
    getProjects: vi.fn(),
    createProject: vi.fn(),
  };

  beforeEach(async () => {
    projectsApiMock.getProjects.mockReset();
    projectsApiMock.createProject.mockReset();
    projectsApiMock.getProjects.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ProjectsPage],
      providers: [
        provideRouter([]),
        { provide: ProjectsApiService, useValue: projectsApiMock },
        importProvidersFrom(LucideAngularModule.pick(LUCIDE_ICONS)),
      ],
    }).compileComponents();
  });

  it('loads projects on init', () => {
    projectsApiMock.getProjects.mockReturnValue(
      of([
        {
          id: 'proj_1',
          name: 'Campaign',
          description: 'Description',
          context: null,
          settings: null,
          postsCount: 2,
          createdAt: '2026-03-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        },
      ]),
    );

    const fixture = TestBed.createComponent(ProjectsPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(projectsApiMock.getProjects).toHaveBeenCalled();
    expect(component.projects()).toHaveLength(1);
    expect(component.loading()).toBe(false);
  });

  it('sets error state when loading fails', () => {
    projectsApiMock.getProjects.mockReturnValue(throwError(() => new Error('fail')));

    const fixture = TestBed.createComponent(ProjectsPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.errorMessage()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });

  it('creates project for valid form', () => {
    projectsApiMock.createProject.mockReturnValue(
      of({
        id: 'proj_new',
        name: 'New Project',
        description: 'Desc',
        context: null,
        settings: null,
        postsCount: 0,
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      }),
    );

    const fixture = TestBed.createComponent(ProjectsPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.showCreateForm.set(true);
    component.form.setValue({
      name: 'New Project',
      description: 'Desc',
      context: '',
      defaultPlatform: 'instagram',
      defaultAiModel: 'gpt-4o-mini',
      defaultNumTextVariants: '1',
      defaultMaxLength: '150',
      defaultTemperature: '0.7',
      defaultImageModel: 'runware:101@1',
      defaultAspectRatio: '1:1',
      defaultImageOutputFormat: 'WEBP',
      defaultNumImageVariants: '1',
      defaultVideoModel: 'klingai:1@1',
      defaultVideoDuration: '5',
      defaultNumVideoVariants: '1',
      defaultMotionIntensity: 'medium',
      defaultCameraMovement: 'static',
      defaultFps: '30',
      defaultLoopVideo: false,
    });
    component.createProject();

    expect(projectsApiMock.createProject).toHaveBeenCalledWith({
      name: 'New Project',
      description: 'Desc',
      context: undefined,
      settings: expect.objectContaining({
        defaultPlatform: 'instagram',
        defaultAiModel: 'gpt-4o-mini',
      }),
    });
    expect(component.projects()[0]?.id).toBe('proj_new');
    expect(component.showCreateForm()).toBe(false);
  });
});
