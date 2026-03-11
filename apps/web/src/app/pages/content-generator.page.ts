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
} from './content-generator.types';
import {
  ContentApiService,
  RunwareImageModelCapability,
  RunwareVideoModelCapability,
  VideoResolution,
} from '../core/content/content-api.service';
import { CreditsApiService } from '../core/credits/credits-api.service';
import { ProjectsApiService } from '../core/projects/projects-api.service';
import { PostsApiService } from '../core/projects/posts-api.service';
import type {
  ProjectResponse,
  ProjectSettings,
} from '../core/projects/projects-api.service';
import { firstValueFrom } from 'rxjs';

const INPUT_CLASS =
  'h-8 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 text-xs text-white outline-none ring-zinc-500/40 transition focus-visible:ring-[3px] placeholder:text-zinc-500 disabled:opacity-50';
const TEXTAREA_CLASS =
  'min-h-[60px] w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white outline-none ring-zinc-500/40 transition focus-visible:ring-[3px] placeholder:text-zinc-500 resize-none disabled:opacity-50';
const VIDEO_STATUS_POLL_INTERVAL_MS = 30000;
const VIDEO_STATUS_MAX_WAIT_MS = 10 * 60 * 1000;
const DEFAULT_IMAGE_MODEL = 'runware:101@1';
const DEFAULT_VIDEO_MODEL = 'klingai:1@1';

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

  readonly imageModelCapabilities = signal<RunwareImageModelCapability[]>([]);
  readonly videoModelCapabilities = signal<RunwareVideoModelCapability[]>([]);
  readonly imagePrompt = signal('');
  readonly negativePrompt = signal('');
  readonly imageModel = signal(DEFAULT_IMAGE_MODEL);
  readonly customImageModel = signal('');
  readonly seedImage = signal('');
  readonly maskImage = signal('');
  readonly guideImage = signal('');
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

  readonly videoModel = signal(DEFAULT_VIDEO_MODEL);
  readonly videoDuration = signal('5');
  readonly videoResolution = signal('');
  readonly videoNegativePrompt = signal('');
  readonly videoCfgScale = signal(0.5);
  readonly motionIntensity = signal('medium');
  readonly cameraMovement = signal('static');
  readonly fps = signal('30');
  readonly loopVideo = signal(false);
  readonly numVideoVariants = signal(1);
  readonly videoVariants = signal<string[]>([]);
  readonly selectedVideoIndex = signal<number | null>(null);
  readonly isGeneratingVideo = signal(false);
  readonly videoGenerationStatus = signal<string | null>(null);

  readonly aiModel = signal('gpt-4o-mini');
  readonly platform = signal<Platform>('instagram');
  readonly selectedSize = signal<PlatformSize>(PLATFORM_SIZES.instagram[0]);
  readonly temperature = signal(0.7);
  readonly maxLength = signal(150);

  readonly isPreviewOpen = signal(false);
  readonly selectedPlatforms = signal<Platform[]>([]);
  readonly errorMessage = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly isSavingProjectSettings = signal(false);
  readonly projectSettingsMessage = signal<string | null>(null);
  readonly projects = signal<ProjectResponse[]>([]);
  readonly selectedProjectForSave = signal<string | null>(null);

  readonly inputClass = INPUT_CLASS;
  readonly textareaClass = TEXTAREA_CLASS;
  readonly platformsList: Platform[] = ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok'];

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
  readonly selectedImageModelCapability = computed(() => {
    if (this.customImageModel().trim()) {
      return null;
    }
    return (
      this.imageModelCapabilities().find((model) => model.id === this.imageModel()) ??
      null
    );
  });
  readonly selectedVideoModelCapability = computed(() =>
    this.videoModelCapabilities().find((model) => model.id === this.videoModel()) ?? null,
  );
  readonly videoDurationOptions = computed(() => {
    const capability = this.selectedVideoModelCapability();
    return capability?.durationOptions ?? [5, 10];
  });
  readonly videoResolutionOptions = computed(() => {
    const capability = this.selectedVideoModelCapability();
    return capability?.resolutions ?? [];
  });
  readonly shouldInferVideoDimensions = computed(
    () => this.selectedVideoModelCapability()?.inferDimensionsFromImage ?? false,
  );
  readonly showVideoCfgScale = computed(
    () => this.selectedVideoModelCapability()?.supportsCfgScale ?? false,
  );
  readonly canGenerateImage = computed(() => {
    const capability = this.customImageModel().trim()
      ? null
      : this.selectedImageModelCapability();
    const hasPrompt = this.imagePrompt().trim().length > 0;
    const hasSeedImage = this.seedImage().trim().length > 0;
    const hasMaskImage = this.maskImage().trim().length > 0;
    const hasGuideImage = this.guideImage().trim().length > 0;

    if (capability?.requiredInputs.includes('seedImage') && !hasSeedImage) {
      return false;
    }
    if (capability?.requiredInputs.includes('maskImage') && !hasMaskImage) {
      return false;
    }
    if (capability?.requiredInputs.includes('guideImage') && !hasGuideImage) {
      return false;
    }

    if (capability?.id === 'runware:105@1') {
      return hasGuideImage;
    }
    return hasPrompt;
  });
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
    this.loadCapabilities();

    this.route.paramMap.subscribe((params) => {
      const pid = params.get('projectId');
      const postId = params.get('postId');
      this.projectId.set(pid);
      this.postId.set(postId);
      if (pid) {
        this.projectsApi.getProject(pid).subscribe({
          next: (p) => {
            this.projectName.set(p.name);
            this.applyProjectSettings(p.settings);
          },
          error: () => this.projectName.set('Playground'),
        });
      }
      if (pid && postId && !postId.startsWith('post-')) {
        this.postsApi.getPost(pid, postId).subscribe({
          next: (post) => this.loadPostData(post),
          error: () => this.setError('Could not load post.'),
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

  private loadCapabilities(): void {
    this.contentApi.getCapabilities().subscribe({
      next: (caps) => {
        this.imageModelCapabilities.set(caps.imageModels);
        this.videoModelCapabilities.set(caps.videoModels);

        const selectedImage = this.customImageModel().trim()
          ? this.customImageModel().trim()
          : this.imageModel();
        const hasImageModel = caps.imageModels.some((item) => item.id === selectedImage);
        if (!hasImageModel) {
          if (selectedImage) {
            this.customImageModel.set(selectedImage);
          }
          this.imageModel.set(caps.defaults.imageModel || DEFAULT_IMAGE_MODEL);
        }

        const hasVideoModel = caps.videoModels.some((item) => item.id === this.videoModel());
        if (!hasVideoModel) {
          this.videoModel.set(caps.defaults.videoModel || DEFAULT_VIDEO_MODEL);
        }

        this.syncVideoModelDefaults();
      },
    });
  }

  private loadPostData(post: {
    content: string | null;
    imageUrls: string[];
    videoUrls: string[];
    platform: string | null;
  }): void {
    if (post.content) {
      this.textVariants.set([post.content]);
      this.selectedTextIndex.set(0);
      if (!this.textPrompt()) this.textPrompt.set(post.content.slice(0, 100));
    }
    if (post.imageUrls?.length > 0) {
      this.imageVariants.set(post.imageUrls);
      this.selectedImageIndex.set(0);
    }
    if (post.videoUrls?.length > 0) {
      this.videoVariants.set(post.videoUrls);
      this.selectedVideoIndex.set(0);
    }
    if (post.platform && ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok'].includes(post.platform)) {
      this.platform.set(post.platform as Platform);
    }
  }

  private applyProjectSettings(settings: ProjectSettings | null): void {
    if (!settings) return;

    if (settings.defaultPlatform) {
      this.platform.set(settings.defaultPlatform);
      this.selectedSize.set(PLATFORM_SIZES[settings.defaultPlatform][0]);
    }
    if (settings.defaultAiModel) this.aiModel.set(settings.defaultAiModel);
    if (typeof settings.defaultNumTextVariants === 'number') {
      this.numTextVariants.set(settings.defaultNumTextVariants);
    }
    if (typeof settings.defaultMaxLength === 'number') {
      this.maxLength.set(settings.defaultMaxLength);
    }
    if (typeof settings.defaultTemperature === 'number') {
      this.temperature.set(settings.defaultTemperature);
    }
    if (settings.defaultImageModel) this.imageModel.set(settings.defaultImageModel);
    if (settings.defaultAspectRatio) this.aspectRatio.set(settings.defaultAspectRatio);
    if (settings.defaultImageOutputFormat) {
      this.imageOutputFormat.set(settings.defaultImageOutputFormat);
    }
    if (typeof settings.defaultNumImageVariants === 'number') {
      this.numImageVariants.set(settings.defaultNumImageVariants);
    }
    if (settings.defaultVideoModel) {
      this.videoModel.set(settings.defaultVideoModel);
      this.syncVideoModelDefaults();
    }
    if (typeof settings.defaultVideoDuration === 'number') {
      this.videoDuration.set(String(this.normalizeVideoDuration(settings.defaultVideoDuration)));
    }
    if (typeof settings.defaultNumVideoVariants === 'number') {
      this.numVideoVariants.set(settings.defaultNumVideoVariants);
    }
    if (settings.defaultMotionIntensity) this.motionIntensity.set(settings.defaultMotionIntensity);
    if (settings.defaultCameraMovement) this.cameraMovement.set(settings.defaultCameraMovement);
    if (settings.defaultFps) this.fps.set(settings.defaultFps);
    if (typeof settings.defaultLoopVideo === 'boolean') {
      this.loopVideo.set(settings.defaultLoopVideo);
    }
  }

  async handleSaveProjectSettings(): Promise<void> {
    const pid = this.projectId();
    if (!pid || this.isSavingProjectSettings()) return;

    this.isSavingProjectSettings.set(true);
    this.projectSettingsMessage.set(null);

    try {
      await firstValueFrom(
        this.projectsApi.updateProject(pid, {
          settings: this.buildCurrentProjectSettings(),
        }),
      );
      this.projectSettingsMessage.set('Project configuration saved.');
    } catch {
      this.projectSettingsMessage.set('Could not save project configuration.');
    } finally {
      this.isSavingProjectSettings.set(false);
    }
  }

  private buildCurrentProjectSettings(): ProjectSettings {
    return {
      defaultPlatform: this.platform(),
      defaultAiModel: this.aiModel() as ProjectSettings['defaultAiModel'],
      defaultNumTextVariants: this.numTextVariants(),
      defaultMaxLength: this.maxLength(),
      defaultTemperature: this.temperature(),
      defaultImageModel: this.customImageModel().trim() || this.imageModel(),
      defaultAspectRatio: this.aspectRatio() as ProjectSettings['defaultAspectRatio'],
      defaultImageOutputFormat: this.imageOutputFormat(),
      defaultNumImageVariants: this.numImageVariants(),
      defaultVideoModel: this.videoModel(),
      defaultVideoDuration: this.normalizeVideoDuration(this.videoDuration()),
      defaultNumVideoVariants: this.numVideoVariants(),
      defaultMotionIntensity: this.motionIntensity() as ProjectSettings['defaultMotionIntensity'],
      defaultCameraMovement: this.cameraMovement() as ProjectSettings['defaultCameraMovement'],
      defaultFps: this.fps() as ProjectSettings['defaultFps'],
      defaultLoopVideo: this.loopVideo(),
    };
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
    const model = this.customImageModel().trim() || this.imageModel();
    const capability = this.selectedImageModelCapability();
    const prompt = this.imagePrompt().trim();
    const seedImage = this.seedImage().trim() || undefined;
    const maskImage = this.maskImage().trim() || undefined;
    const guideImage = this.guideImage().trim() || undefined;

    if (!this.customImageModel().trim() && capability) {
      if (capability.requiredInputs.includes('seedImage') && !seedImage) {
        this.setError(`Model ${capability.label} requires Seed image URL or UUID`);
        return;
      }
      if (capability.requiredInputs.includes('maskImage') && !maskImage) {
        this.setError(`Model ${capability.label} requires Mask image URL or UUID`);
        return;
      }
      if (capability.requiredInputs.includes('guideImage') && !guideImage) {
        this.setError(`Model ${capability.label} requires Guide image URL or UUID`);
        return;
      }
    }

    if (!prompt && model !== 'runware:105@1') {
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
    try {
      const res = await firstValueFrom(
        this.contentApi.generateImage({
          prompt: prompt || '__BLANK__',
          negativePrompt: this.negativePrompt().trim() || undefined,
          model,
          seedImage,
          maskImage,
          guideImage,
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
    this.videoGenerationStatus.set(null);
    this.setError(null);

    const idx = this.selectedImageIndex();
    const uuids = this.imageUUIDs();
    const imageUUID = idx !== null && uuids[idx] ? uuids[idx] : undefined;
    const capability = this.selectedVideoModelCapability();
    if (!capability) {
      this.setError('Video model capabilities are still loading. Try again in a moment.');
      this.isGeneratingVideo.set(false);
      return;
    }
    const duration = this.normalizeVideoDuration(this.videoDuration());
    const resolution = this.parseVideoResolution(this.videoResolutionOptions(), this.videoResolution());
    const dimensions = capability.inferDimensionsFromImage
      ? {}
      : resolution
        ? { width: resolution.width, height: resolution.height }
        : {};
    const payload = {
      prompt: this.imagePrompt().trim() || 'Smooth motion',
      model: capability.id,
      duration,
      numberResults: this.numVideoVariants(),
      ...(capability.supportsNegativePrompt && this.videoNegativePrompt().trim()
        ? { negativePrompt: this.videoNegativePrompt().trim() }
        : {}),
      ...(capability.supportsCfgScale ? { cfgScale: this.videoCfgScale() } : {}),
      ...dimensions,
      ...(imageUUID ? { imageUUID } : { imageData: image }),
    };

    try {
      const startRes = await firstValueFrom(
        this.contentApi.startVideoGeneration(payload),
      );
      this.userCredits.set(startRes.remainingCredits);
      this.videoGenerationStatus.set(
        `Queued ${startRes.taskUUIDs.length} video task(s)...`,
      );

      const urls = await this.waitForVideoResults(startRes.taskUUIDs);
      this.videoVariants.set(urls);
      this.selectedVideoIndex.set(0);
      this.videoGenerationStatus.set('Video ready');
    } catch (err) {
      const msg =
        err instanceof HttpErrorResponse
          ? ((err.error as { message?: string })?.message ?? err.message)
          : err instanceof Error
            ? err.message
            : 'Video generation error';
      this.setError(msg);
      this.videoGenerationStatus.set(null);
    } finally {
      this.isGeneratingVideo.set(false);
    }
  }

  private async waitForVideoResults(taskUUIDs: string[]): Promise<string[]> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < VIDEO_STATUS_MAX_WAIT_MS) {
      const statusRes = await firstValueFrom(
        this.contentApi.getVideoGenerationStatus({ taskUUIDs }),
      );

      const readyCount = statusRes.items.filter(
        (item) => item.status === 'success',
      ).length;
      const failedCount = statusRes.items.filter(
        (item) => item.status === 'error',
      ).length;
      this.videoGenerationStatus.set(
        `Generating video... ${readyCount}/${taskUUIDs.length} ready${
          failedCount > 0 ? `, ${failedCount} failed` : ''
        }`,
      );

      if (statusRes.done) {
        if (statusRes.urls.length > 0) {
          return statusRes.urls;
        }
        const firstError = statusRes.items.find(
          (item) => item.status === 'error',
        );
        throw new Error(firstError?.error ?? 'Video generation failed');
      }

      await new Promise((resolve) =>
        setTimeout(resolve, VIDEO_STATUS_POLL_INTERVAL_MS),
      );
    }

    throw new Error('Video generation timed out. Please try again.');
  }

  handleImageModelChange(modelId: string): void {
    this.imageModel.set(modelId);
    this.customImageModel.set('');
  }

  handleVideoModelChange(modelId: string): void {
    this.videoModel.set(modelId);
    this.syncVideoModelDefaults();
  }

  private syncVideoModelDefaults(): void {
    const capability = this.selectedVideoModelCapability();
    if (!capability) {
      return;
    }

    const allowedDurations = capability.durationOptions;
    const currentDuration = Number.parseInt(this.videoDuration(), 10);
    if (!allowedDurations.includes(currentDuration)) {
      this.videoDuration.set(String(capability.defaults.duration ?? allowedDurations[0] ?? 5));
    }

    if (capability.inferDimensionsFromImage) {
      this.videoResolution.set('');
      return;
    }

    const selected = this.parseVideoResolution(capability.resolutions, this.videoResolution());
    if (!selected) {
      const fallback = capability.resolutions[0];
      if (fallback) {
        this.videoResolution.set(`${fallback.width}x${fallback.height}`);
      }
    }
  }

  private normalizeVideoDuration(value: string | number): number {
    const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);
    const capability = this.selectedVideoModelCapability();
    if (!capability) {
      return Number.isNaN(parsed) ? 5 : parsed;
    }
    if (Number.isNaN(parsed)) {
      return capability.defaults.duration;
    }
    if (capability.durationOptions.includes(parsed)) {
      return parsed;
    }
    return capability.defaults.duration;
  }

  private parseVideoResolution(
    options: VideoResolution[],
    rawValue: string,
  ): VideoResolution | null {
    if (!rawValue) {
      return null;
    }
    const [wRaw, hRaw] = rawValue.split('x');
    const width = Number.parseInt(wRaw ?? '', 10);
    const height = Number.parseInt(hRaw ?? '', 10);
    if (Number.isNaN(width) || Number.isNaN(height)) {
      return null;
    }
    return (
      options.find(
        (option) => option.width === width && option.height === height,
      ) ?? null
    );
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
