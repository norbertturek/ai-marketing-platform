import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
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
    });
    component.createProject();

    expect(projectsApiMock.createProject).toHaveBeenCalledWith({
      name: 'New Project',
      description: 'Desc',
      context: undefined,
    });
    expect(component.projects()[0]?.id).toBe('proj_new');
    expect(component.showCreateForm()).toBe(false);
  });
});
