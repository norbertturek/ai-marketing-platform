import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { LucideAngularModule } from 'lucide-angular';
import {
  ASPECT_RATIO_DIMENSIONS,
  COST_ESTIMATES,
  PLATFORM_SIZES,
  Platform,
  PlatformSize,
  RUNWARE_IMAGE_MODELS,
} from './content-generator.types';
import { ContentApiService } from '../core/content/content-api.service';
import { CreditsApiService } from '../core/credits/credits-api.service';
import { ProjectsApiService } from '../core/projects/projects-api.service';
import { PostsApiService } from '../core/projects/posts-api.service';
import type { ProjectResponse } from '../core/projects/projects-api.service';
import { firstValueFrom } from 'rxjs';

const INPUT_CLASS =
  'h-8 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 text-xs text-white outline-none ring-zinc-500/40 transition focus-visible:ring-[3px] placeholder:text-zinc-500 disabled:opacity-50';
const TEXTAREA_CLASS =
  'min-h-[60px] w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white outline-none ring-zinc-500/40 transition focus-visible:ring-[3px] placeholder:text-zinc-500 resize-none disabled:opacity-50';

@Component({
  selector: 'app-content-generator-page',
  imports: [DecimalPipe, RouterLink, LucideAngularModule, ...HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './content-generator.page.html',
})
export class ContentGeneratorPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectsApi = inject(ProjectsApiService);
  private readonly postsApi = inject(PostsApiService);
  private readonly contentApi = inject(ContentApiService);
  private readonly creditsApi = inject(CreditsApiService);

  projectId = signal<string | null>(null);
  postId = signal<string | null>(null);
  projectName = signal<string>('Playground');

  readonly userCredits = signal(0);

  readonly textPrompt = signal('');
  readonly textVariants = signal<string[]>([]);
  readonly selectedTextIndex = signal<number | null>(null);
  readonly numTextVariants = signal(1);
  readonly isGeneratingText = signal(false);

  readonly imagePrompt = signal('');
  readonly negativePrompt = signal('');
  readonly imageModel = signal(RUNWARE_IMAGE_MODELS[0].id);
  readonly customImageModel = signal('');
  readonly aspectRatio = signal('1:1');
  readonly cfgScale = signal(7.5);
  readonly steps = signal(30);
  readonly imageOutputFormat = signal<'JPG' | 'PNG' | 'WEBP'>('WEBP');
  readonly numImageVariants = signal(1);
  readonly imageVariants = signal<string[]>([]);
  readonly imageUUIDs = signal<string[]>([]);
  readonly selectedImageIndex = signal<number | null>(null);
  readonly isGeneratingImage = signal(false);
  readonly uploadedImage = signal<string | null>(null);

  readonly videoDuration = signal('5');
  readonly motionIntensity = signal('medium');
  readonly cameraMovement = signal('static');
  readonly fps = signal('30');
  readonly loopVideo = signal(false);
  readonly numVideoVariants = signal(1);
  readonly videoVariants = signal<string[]>([]);
  readonly selectedVideoIndex = signal<number | null>(null);
  readonly isGeneratingVideo = signal(false);

  readonly aiModel = signal('gpt-4o-mini');
  readonly platform = signal<Platform>('instagram');
  readonly selectedSize = signal<PlatformSize>(PLATFORM_SIZES.instagram[0]);
  readonly temperature = signal(0.7);
  readonly maxLength = signal(150);

  readonly isPreviewOpen = signal(false);
  readonly selectedPlatforms = signal<Platform[]>([]);
  readonly errorMessage = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly projects = signal<ProjectResponse[]>([]);
  readonly selectedProjectForSave = signal<string | null>(null);

  readonly inputClass = INPUT_CLASS;
  readonly textareaClass = TEXTAREA_CLASS;
  readonly platformsList: Platform[] = ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok'];
  readonly runwareImageModels = RUNWARE_IMAGE_MODELS;

  contentCount(): number {
    return [this.selectedText(), this.selectedImage(), this.selectedVideo()].filter(
      (x) => x != null,
    ).length;
  }

  readonly textCost = computed(() => this.numTextVariants() * COST_ESTIMATES.textGeneration);
  readonly imageCost = computed(() => this.numImageVariants() * COST_ESTIMATES.imageGeneration);
  readonly videoCost = computed(() => this.numVideoVariants() * COST_ESTIMATES.videoGeneration);

  readonly selectedText = computed(() => {
    const idx = this.selectedTextIndex();
    const vars = this.textVariants();
    return idx !== null && vars[idx] !== undefined ? vars[idx] : null;
  });
  readonly selectedImage = computed(() => {
    const idx = this.selectedImageIndex();
    const vars = this.imageVariants();
    return idx !== null && vars[idx] !== undefined ? vars[idx] : null;
  });
  readonly selectedVideo = computed(() => {
    const idx = this.selectedVideoIndex();
    const vars = this.videoVariants();
    return idx !== null && vars[idx] !== undefined ? vars[idx] : null;
  });
  readonly canGenerateImage = computed(() => this.imagePrompt().trim().length > 0);
  readonly canGenerateVideo = computed(() => this.selectedImageIndex() !== null);
  readonly hasContent = computed(() => this.selectedText() !== null);

  readonly canSave = computed(() => {
    if (!this.selectedText()) return false;
    const pid = this.projectId();
    const postId = this.postId();
    if (pid && postId) return true;
    return this.selectedProjectForSave() !== null;
  });

  readonly isInProjectContext = computed(
    () => this.projectId() !== null && this.postId() !== null
  );

  readonly totalUsedCost = computed(() => {
    let cost = 0;
    if (this.textVariants().length > 0) cost += this.textCost();
    if (this.imageVariants().length > 0 && !this.uploadedImage()) cost += this.imageCost();
    if (this.videoVariants().length > 0) cost += this.videoCost();
    return cost;
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const pid = params.get('projectId');
      const postId = params.get('postId');
      this.projectId.set(pid);
      this.postId.set(postId);
      if (pid) {
        this.projectsApi.getProject(pid).subscribe({
          next: (p) => this.projectName.set(p.name),
          error: () => this.projectName.set('Playground'),
        });
      }
    });

    this.creditsApi.getCredits().subscribe({
      next: (res) => this.userCredits.set(res.balance),
      error: () => this.userCredits.set(0),
    });

    this.projectsApi.getProjects().subscribe({
      next: (list) => this.projects.set(list),
    });
  }

  handlePlatformChange(p: Platform): void {
    this.platform.set(p);
    this.selectedSize.set(PLATFORM_SIZES[p][0]);
    if (p === 'instagram' || p === 'facebook') this.aspectRatio.set('1:1');
    else if (p === 'tiktok') this.aspectRatio.set('9:16');
    else this.aspectRatio.set('16:9');
  }

  setError(msg: string | null): void {
    this.errorMessage.set(msg);
  }

  async handleGenerateText(): Promise<void> {
    const prompt = this.textPrompt().trim();
    if (!prompt) {
      this.setError('Enter a prompt to generate text');
      return;
    }
    const cost = this.textCost();
    if (this.userCredits() < cost) {
      this.setError(`Insufficient credits! You need ${cost} credits.`);
      return;
    }
    this.isGeneratingText.set(true);
    this.textVariants.set([]);
    this.selectedTextIndex.set(null);
    this.setError(null);
    try {
      const res = await firstValueFrom(
        this.contentApi.generateText({
          prompt,
          platform: this.platform(),
          numVariants: this.numTextVariants(),
          maxLength: this.maxLength(),
          model: this.aiModel(),
          temperature: this.temperature(),
        }),
      );
      this.textVariants.set(res.texts);
      this.selectedTextIndex.set(0);
      this.userCredits.set(res.remainingCredits);
      if (!this.imagePrompt()) this.imagePrompt.set(prompt);
    } catch (err) {
      const msg =
        err instanceof HttpErrorResponse
          ? ((err.error as { message?: string })?.message ?? err.message)
          : err instanceof Error
            ? err.message
            : 'Text generation error';
      this.setError(msg);
    } finally {
      this.isGeneratingText.set(false);
    }
  }

  async handleGenerateImage(): Promise<void> {
    const prompt = this.imagePrompt().trim();
    if (!prompt) {
      this.setError('Enter an image prompt');
      return;
    }
    const cost = this.imageCost();
    if (this.userCredits() < cost) {
      this.setError(`Insufficient credits! You need ${cost} credits.`);
      return;
    }
    this.isGeneratingImage.set(true);
    this.imageVariants.set([]);
    this.selectedImageIndex.set(null);
    this.uploadedImage.set(null);
    this.setError(null);

    const dims = ASPECT_RATIO_DIMENSIONS[this.aspectRatio()] ?? ASPECT_RATIO_DIMENSIONS['1:1'];
    const model = this.customImageModel().trim() || this.imageModel();

    try {
      const res = await firstValueFrom(
        this.contentApi.generateImage({
          prompt,
          negativePrompt: this.negativePrompt().trim() || undefined,
          model,
          width: dims.width,
          height: dims.height,
          steps: this.steps(),
          cfgScale: this.cfgScale(),
          numberResults: this.numImageVariants(),
          outputFormat: this.imageOutputFormat(),
        }),
      );
      this.imageVariants.set(res.urls);
      this.imageUUIDs.set(res.imageUUIDs);
      this.selectedImageIndex.set(0);
      this.userCredits.set(res.remainingCredits);
    } catch (err) {
      const msg =
        err instanceof HttpErrorResponse
          ? ((err.error as { message?: string })?.message ?? err.message)
          : err instanceof Error
            ? err.message
            : 'Image generation error';
      this.setError(msg);
    } finally {
      this.isGeneratingImage.set(false);
    }
  }

  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const data = reader.result as string;
        this.uploadedImage.set(data);
        this.imageVariants.set([data]);
        this.imageUUIDs.set([]);
        this.selectedImageIndex.set(0);
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  async handleGenerateVideo(): Promise<void> {
    if (this.selectedImageIndex() === null) {
      this.setError('Choose an image first');
      return;
    }
    const cost = this.videoCost();
    if (this.userCredits() < cost) {
      this.setError(`Insufficient credits! You need ${cost} credits.`);
      return;
    }
    const image = this.selectedImage();
    if (!image) {
      this.setError('Choose an image first');
      return;
    }

    this.isGeneratingVideo.set(true);
    this.videoVariants.set([]);
    this.selectedVideoIndex.set(null);
    this.setError(null);

    const idx = this.selectedImageIndex();
    const uuids = this.imageUUIDs();
    const imageUUID = idx !== null && uuids[idx] ? uuids[idx] : undefined;
    const imageData = this.uploadedImage() ?? undefined;
    const payload = {
      prompt: this.imagePrompt().trim() || 'Smooth motion',
      duration: parseInt(this.videoDuration(), 10) || 5,
      numberResults: this.numVideoVariants(),
      ...(imageUUID ? { imageUUID } : { imageData: image }),
    };

    try {
      const res = await firstValueFrom(
        this.contentApi.generateVideo(payload),
      );
      this.videoVariants.set(res.urls);
      this.selectedVideoIndex.set(0);
      this.userCredits.set(res.remainingCredits);
    } catch (err) {
      const msg =
        err instanceof HttpErrorResponse
          ? ((err.error as { message?: string })?.message ?? err.message)
          : err instanceof Error
            ? err.message
            : 'Video generation error';
      this.setError(msg);
    } finally {
      this.isGeneratingVideo.set(false);
    }
  }

  togglePlatform(p: Platform): void {
    this.selectedPlatforms.update((arr) =>
      arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p],
    );
  }

  handleShare(): void {
    const platforms = this.selectedPlatforms();
    if (platforms.length === 0) {
      this.setError('Choose at least one platform');
      return;
    }
    this.setError(null);
    this.errorMessage.set(null);
    // TODO: integrate with publish API
  }

  private buildSavePayload(): {
    content: string;
    imageUrls?: string[];
    videoUrls?: string[];
    platform: string;
  } {
    const content = this.selectedText() ?? '';
    const image = this.selectedImage();
    const video = this.selectedVideo();
    const payload: {
      content: string;
      imageUrls?: string[];
      videoUrls?: string[];
      platform: string;
    } = {
      content,
      platform: this.platform(),
    };
    if (image) payload.imageUrls = [image];
    if (video) payload.videoUrls = [video];
    return payload;
  }

  handleSave(): void {
    const text = this.selectedText();
    if (!text || this.isSaving()) return;

    const pid = this.projectId();
    const postId = this.postId();
    const payload = this.buildSavePayload();

    if (pid && postId) {
      this.saveExistingPost(pid, postId, payload);
    } else {
      const selectedProject = this.selectedProjectForSave();
      if (!selectedProject) {
        this.setError('Select a project to save to');
        return;
      }
      this.saveNewPost(selectedProject, payload);
    }
  }

  private saveExistingPost(
    projectId: string,
    postId: string,
    payload: ReturnType<ContentGeneratorPage['buildSavePayload']>
  ): void {
    this.isSaving.set(true);
    this.setError(null);
    this.postsApi
      .updatePost(projectId, postId, { ...payload, status: 'draft' })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.router.navigate(['/project', projectId]);
        },
        error: (err) => {
          this.isSaving.set(false);
          const msg =
            err?.error?.message ?? err?.message ?? 'Failed to save post.';
          this.setError(msg);
        },
      });
  }

  private saveNewPost(
    projectId: string,
    payload: ReturnType<ContentGeneratorPage['buildSavePayload']>
  ): void {
    this.isSaving.set(true);
    this.setError(null);
    this.postsApi.createPost(projectId, payload).subscribe({
      next: (post) => {
        this.isSaving.set(false);
        this.router.navigate(['/project', projectId]);
      },
      error: (err) => {
        this.isSaving.set(false);
        const msg =
          err?.error?.message ?? err?.message ?? 'Failed to save post.';
        this.setError(msg);
      },
    });
  }

  selectProjectForSave(projectId: string): void {
    this.selectedProjectForSave.set(
      this.selectedProjectForSave() === projectId ? null : projectId
    );
  }
}
