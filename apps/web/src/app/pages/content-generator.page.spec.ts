import { TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { LucideAngularModule } from 'lucide-angular';
import { LUCIDE_ICONS } from '../app.config';
import { ContentApiService } from '../core/content/content-api.service';
import { CreditsApiService } from '../core/credits/credits-api.service';
import { ProjectsApiService } from '../core/projects/projects-api.service';
import { PostsApiService } from '../core/projects/posts-api.service';
import { ContentGeneratorPage } from './content-generator.page';

describe('ContentGeneratorPage', () => {
  const projectsApiMock = {
    getProject: vi.fn(),
    getProjects: vi.fn(),
  };
  const creditsApiMock = {
    getCredits: vi.fn(),
  };
  const postsApiMock = {
    createPost: vi.fn(),
    updatePost: vi.fn(),
  };
  const contentApiMock = {
    generateText: vi.fn(),
    generateImage: vi.fn(),
    generateVideo: vi.fn(),
  };

  beforeEach(async () => {
    projectsApiMock.getProject.mockReset();
    projectsApiMock.getProjects.mockReset();
    projectsApiMock.getProjects.mockReturnValue(of([]));
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

    postsApiMock.createPost.mockReset();
    postsApiMock.updatePost.mockReset();
    contentApiMock.generateText.mockReset();
    contentApiMock.generateImage.mockReset();
    contentApiMock.generateVideo.mockReset();

    await TestBed.configureTestingModule({
      imports: [ContentGeneratorPage],
      providers: [
        provideRouter([]),
        { provide: ProjectsApiService, useValue: projectsApiMock },
        { provide: CreditsApiService, useValue: creditsApiMock },
        { provide: PostsApiService, useValue: postsApiMock },
        { provide: ContentApiService, useValue: contentApiMock },
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

  describe('save behavior', () => {
    it('canSave is false when no text selected', () => {
      const fixture = TestBed.createComponent(ContentGeneratorPage);
      fixture.detectChanges();
      expect(fixture.componentInstance.canSave()).toBe(false);
    });

    it('canSave is true when text and project context', () => {
      projectsApiMock.getProject.mockReturnValue(
        of({
          id: 'proj_1',
          name: 'Test',
          description: '',
          context: null,
          postsCount: 0,
          createdAt: '',
          updatedAt: '',
        }),
      );
      const fixture = TestBed.createComponent(ContentGeneratorPage);
      fixture.detectChanges();
      fixture.componentInstance.textVariants.set(['Hello']);
      fixture.componentInstance.selectedTextIndex.set(0);
      fixture.componentInstance.projectId.set('proj_1');
      fixture.componentInstance.postId.set('post_1');
      fixture.detectChanges();
      expect(fixture.componentInstance.canSave()).toBe(true);
    });

    it('canSave is true when text and project selected for save', () => {
      projectsApiMock.getProjects.mockReturnValue(
        of([
          { id: 'proj_1', name: 'P1', description: '', context: null, postsCount: 0, createdAt: '', updatedAt: '' },
        ]),
      );
      const fixture = TestBed.createComponent(ContentGeneratorPage);
      fixture.detectChanges();
      fixture.componentInstance.textVariants.set(['Hello']);
      fixture.componentInstance.selectedTextIndex.set(0);
      fixture.componentInstance.projects.set([
        { id: 'proj_1', name: 'P1', description: '', context: null, postsCount: 0, createdAt: '', updatedAt: '' },
      ]);
      fixture.componentInstance.selectProjectForSave('proj_1');
      fixture.detectChanges();
      expect(fixture.componentInstance.canSave()).toBe(true);
    });

    it('handleSave calls updatePost when in project context', () => {
      postsApiMock.updatePost.mockReturnValue(of({ id: 'post_1', projectId: 'proj_1', content: 'Hi', imageUrls: [], videoUrls: [], platform: null, status: 'draft', createdAt: '', updatedAt: '' }));
      const fixture = TestBed.createComponent(ContentGeneratorPage);
      fixture.detectChanges();
      fixture.componentInstance.textVariants.set(['Hi']);
      fixture.componentInstance.selectedTextIndex.set(0);
      fixture.componentInstance.projectId.set('proj_1');
      fixture.componentInstance.postId.set('post_1');
      fixture.detectChanges();
      fixture.componentInstance.handleSave();
      expect(postsApiMock.updatePost).toHaveBeenCalledWith('proj_1', 'post_1', expect.objectContaining({ content: 'Hi', status: 'draft' }));
    });

    it('handleSave calls createPost when project selected in playground', () => {
      postsApiMock.createPost.mockReturnValue(of({ id: 'post_1', projectId: 'proj_1', content: 'Hi', imageUrls: [], videoUrls: [], platform: null, status: 'draft', createdAt: '', updatedAt: '' }));
      const fixture = TestBed.createComponent(ContentGeneratorPage);
      fixture.detectChanges();
      fixture.componentInstance.textVariants.set(['Hi']);
      fixture.componentInstance.selectedTextIndex.set(0);
      fixture.componentInstance.projects.set([
        { id: 'proj_1', name: 'P1', description: '', context: null, postsCount: 0, createdAt: '', updatedAt: '' },
      ]);
      fixture.componentInstance.selectProjectForSave('proj_1');
      fixture.detectChanges();
      fixture.componentInstance.handleSave();
      expect(postsApiMock.createPost).toHaveBeenCalledWith('proj_1', expect.objectContaining({ content: 'Hi' }));
    });

    it('handleSave shows error when in playground and no project selected', () => {
      const fixture = TestBed.createComponent(ContentGeneratorPage);
      fixture.detectChanges();
      fixture.componentInstance.textVariants.set(['Hi']);
      fixture.componentInstance.selectedTextIndex.set(0);
      fixture.detectChanges();
      fixture.componentInstance.handleSave();
      expect(fixture.componentInstance.errorMessage()).toBe('Select a project to save to');
      expect(postsApiMock.createPost).not.toHaveBeenCalled();
    });

    it('selectProjectForSave toggles selection', () => {
      const fixture = TestBed.createComponent(ContentGeneratorPage);
      fixture.detectChanges();
      expect(fixture.componentInstance.selectedProjectForSave()).toBe(null);
      fixture.componentInstance.selectProjectForSave('proj_1');
      expect(fixture.componentInstance.selectedProjectForSave()).toBe('proj_1');
      fixture.componentInstance.selectProjectForSave('proj_1');
      expect(fixture.componentInstance.selectedProjectForSave()).toBe(null);
    });
  });

  describe('video generation', () => {
    it('handleGenerateVideo calls generateVideo with imageUUID when available', async () => {
      contentApiMock.generateVideo.mockReturnValue(
        of({ urls: ['https://example.com/video.mp4'], remainingCredits: 50 }),
      );
      const fixture = TestBed.createComponent(ContentGeneratorPage);
      fixture.detectChanges();
      fixture.componentInstance.imageVariants.set(['https://runware.example/img.webp']);
      fixture.componentInstance.imageUUIDs.set(['uuid-123']);
      fixture.componentInstance.selectedImageIndex.set(0);
      fixture.componentInstance.imagePrompt.set('Smooth motion');
      fixture.componentInstance.videoDuration.set('5');
      fixture.componentInstance.numVideoVariants.set(1);
      fixture.componentInstance.userCredits.set(100);
      fixture.detectChanges();

      await fixture.componentInstance.handleGenerateVideo();

      expect(contentApiMock.generateVideo).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUUID: 'uuid-123',
          prompt: 'Smooth motion',
          duration: 5,
          numberResults: 1,
        }),
      );
      expect(fixture.componentInstance.videoVariants()).toEqual(['https://example.com/video.mp4']);
      expect(fixture.componentInstance.userCredits()).toBe(50);
    });
  });
});
