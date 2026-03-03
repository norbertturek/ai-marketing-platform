import { TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { LucideAngularModule } from 'lucide-angular';
import { LUCIDE_ICONS } from '../app.config';
import { CreditsApiService } from '../core/credits/credits-api.service';
import { ProjectsApiService } from '../core/projects/projects-api.service';
import { ContentGeneratorPage } from './content-generator.page';

describe('ContentGeneratorPage', () => {
  const projectsApiMock = {
    getProject: vi.fn(),
  };
  const creditsApiMock = {
    getCredits: vi.fn(),
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
      }),
    );

    creditsApiMock.getCredits.mockReset();
    creditsApiMock.getCredits.mockReturnValue(of({ balance: 100, usage: [] }));

    await TestBed.configureTestingModule({
      imports: [ContentGeneratorPage],
      providers: [
        provideRouter([]),
        { provide: ProjectsApiService, useValue: projectsApiMock },
        { provide: CreditsApiService, useValue: creditsApiMock },
        importProvidersFrom(LucideAngularModule.pick(LUCIDE_ICONS)),
      ],
    }).compileComponents();
  });

  it('renders three step columns', () => {
    const fixture = TestBed.createComponent(ContentGeneratorPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Generate Text');
    expect(el.textContent).toContain('Generate Image');
    expect(el.textContent).toContain('Generate Video');
  });

  it('has cost badges for each step', () => {
    const fixture = TestBed.createComponent(ContentGeneratorPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toMatch(/1\s+credits/);
    expect(el.textContent).toMatch(/5\s+credits/);
    expect(el.textContent).toMatch(/50\s+credits/);
  });

  it('fetches credits on init', () => {
    const fixture = TestBed.createComponent(ContentGeneratorPage);
    fixture.detectChanges();
    expect(creditsApiMock.getCredits).toHaveBeenCalled();
    expect(fixture.componentInstance.userCredits()).toBe(100);
  });
});
