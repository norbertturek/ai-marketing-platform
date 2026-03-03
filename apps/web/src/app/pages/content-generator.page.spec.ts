import { TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { LucideAngularModule } from 'lucide-angular';
import { LUCIDE_ICONS } from '../app.config';
import { ProjectsApiService } from '../core/projects/projects-api.service';
import { ContentGeneratorPage } from './content-generator.page';

describe('ContentGeneratorPage', () => {
  const projectsApiMock = {
    getProject: vi.fn(),
  };

  beforeEach(async () => {
    projectsApiMock.getProject.mockReset();
    projectsApiMock.getProject.mockReturnValue(
      of({
        id: 'proj_1',
        name: 'Test Project',
        description: 'Desc',
        context: null,
        postsCount: 0,
        createdAt: '2026-03-02T00:00:00.000Z',
        updatedAt: '2026-03-02T00:00:00.000Z',
      })
    );

    await TestBed.configureTestingModule({
      imports: [ContentGeneratorPage],
      providers: [
        provideRouter([]),
        { provide: ProjectsApiService, useValue: projectsApiMock },
        importProvidersFrom(LucideAngularModule.pick(LUCIDE_ICONS)),
      ],
    }).compileComponents();
  });

  it('renders three step columns', () => {
    const fixture = TestBed.createComponent(ContentGeneratorPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Generuj Tekst');
    expect(el.textContent).toContain('Generuj Obrazek');
    expect(el.textContent).toContain('Generuj Video');
  });

  it('has cost badges for each step', () => {
    const fixture = TestBed.createComponent(ContentGeneratorPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toMatch(/10\s+kredytów/);
    expect(el.textContent).toMatch(/25\s+kredytów/);
    expect(el.textContent).toMatch(/50\s+kredytów/);
  });
});
