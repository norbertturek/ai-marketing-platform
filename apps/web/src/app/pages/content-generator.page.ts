import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { LucideAngularModule } from 'lucide-angular';
import {
  COST_ESTIMATES,
  PLATFORM_SIZES,
  Platform,
  PlatformSize,
} from './content-generator.types';
import { ProjectsApiService } from '../core/projects/projects-api.service';

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
  private readonly projectsApi = inject(ProjectsApiService);

  projectId = signal<string | null>(null);
  postId = signal<string | null>(null);
  projectName = signal<string>('Playground');

  readonly userCredits = signal(1000);

  readonly textPrompt = signal('');
  readonly textVariants = signal<string[]>([]);
  readonly selectedTextIndex = signal<number | null>(null);
  readonly numTextVariants = signal(1);
  readonly isGeneratingText = signal(false);

  readonly useResearch = signal(false);
  readonly researchQuery = signal('');
  readonly isResearching = signal(false);
  readonly researchResults = signal<{ title: string; snippet: string; url: string }[]>([]);
  readonly researchAccepted = signal(false);

  readonly imagePrompt = signal('');
  readonly negativePrompt = signal('');
  readonly imageModel = signal('stable-diffusion-xl');
  readonly imageStyle = signal('realistic');
  readonly aspectRatio = signal('1:1');
  readonly cfgScale = signal(7.5);
  readonly steps = signal(30);
  readonly numImageVariants = signal(1);
  readonly imageVariants = signal<string[]>([]);
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

  readonly aiModel = signal('gpt-4');
  readonly platform = signal<Platform>('instagram');
  readonly selectedSize = signal<PlatformSize>(PLATFORM_SIZES.instagram[0]);
  readonly temperature = signal(0.7);
  readonly maxLength = signal(150);

  readonly isPreviewOpen = signal(false);
  readonly selectedPlatforms = signal<Platform[]>([]);
  readonly errorMessage = signal<string | null>(null);

  readonly inputClass = INPUT_CLASS;
  readonly textareaClass = TEXTAREA_CLASS;
  readonly platformsList: Platform[] = [
    'facebook',
    'instagram',
    'linkedin',
    'twitter',
    'tiktok',
  ];

  contentCount(): number {
    return [
      this.selectedText(),
      this.selectedImage(),
      this.selectedVideo(),
    ].filter((x) => x != null).length;
  }

  readonly textCost = computed(
    () =>
      this.numTextVariants() * COST_ESTIMATES.textGeneration +
      (this.useResearch() ? COST_ESTIMATES.internetResearch : 0)
  );
  readonly imageCost = computed(
    () => this.numImageVariants() * COST_ESTIMATES.imageGeneration
  );
  readonly videoCost = computed(
    () => this.numVideoVariants() * COST_ESTIMATES.videoGeneration
  );

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
  readonly canGenerateImage = computed(() => this.selectedTextIndex() !== null);
  readonly canGenerateVideo = computed(() => this.selectedImageIndex() !== null);
  readonly hasContent = computed(() => this.selectedText() !== null);

  readonly totalUsedCost = computed(() => {
    let cost = 0;
    if (this.textVariants().length > 0) cost += this.textCost();
    if (
      this.imageVariants().length > 0 &&
      !this.uploadedImage()
    )
      cost += this.imageCost();
    if (this.videoVariants().length > 0) cost += this.videoCost();
    if (this.researchAccepted()) cost += COST_ESTIMATES.internetResearch;
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

  async handleResearch(): Promise<void> {
    const q = this.researchQuery().trim();
    if (!q) {
      this.setError('Wpisz zapytanie do wyszukiwarki');
      return;
    }
    this.isResearching.set(true);
    this.researchResults.set([]);
    await new Promise((r) => setTimeout(r, 2000));
    this.researchResults.set([
      {
        title: `${q} - Latest News & Updates 2026`,
        snippet: `Breaking news about ${q}. Recent developments...`,
        url: 'https://example.com/news/article-1',
      },
      {
        title: `Top 10 Facts About ${q}`,
        snippet: `Comprehensive guide covering everything...`,
        url: 'https://example.com/guide/top-facts',
      },
    ]);
    this.isResearching.set(false);
    this.setError(null);
  }

  acceptResearch(): void {
    this.userCredits.update((c) => c - COST_ESTIMATES.internetResearch);
    this.researchAccepted.set(true);
    this.setError(null);
  }

  async handleGenerateText(): Promise<void> {
    const prompt = this.textPrompt().trim();
    if (!prompt) {
      this.setError('Wpisz prompt aby wygenerować tekst');
      return;
    }
    const cost = this.textCost();
    if (this.userCredits() < cost) {
      this.setError(`Niewystarczająca ilość kredytów! Potrzebujesz ${cost} kredytów.`);
      return;
    }
    this.isGeneratingText.set(true);
    this.textVariants.set([]);
    this.selectedTextIndex.set(null);
    this.setError(null);
    await new Promise((r) => setTimeout(r, 2000));
    const variants: string[] = [];
    const suffix = this.researchAccepted() ? ' (z research)' : '';
    for (let i = 0; i < this.numTextVariants(); i++) {
      variants.push(
        `✨ ${prompt}${suffix} - Wariant ${i + 1} ✨\n\nPrzedstawiamy najnowszą linię produktów...\n\n#${this.platform()} #marketing #socialmedia`
      );
    }
    this.textVariants.set(variants);
    this.selectedTextIndex.set(0);
    this.userCredits.update((c) => c - cost);
    this.isGeneratingText.set(false);
    if (!this.imagePrompt()) this.imagePrompt.set(prompt);
  }

  async handleGenerateImage(): Promise<void> {
    const prompt = this.imagePrompt().trim();
    if (!prompt) {
      this.setError('Wpisz prompt dla obrazka');
      return;
    }
    const cost = this.imageCost();
    if (this.userCredits() < cost) {
      this.setError(`Niewystarczająca ilość kredytów! Potrzebujesz ${cost} kredytów.`);
      return;
    }
    this.isGeneratingImage.set(true);
    this.imageVariants.set([]);
    this.selectedImageIndex.set(null);
    this.uploadedImage.set(null);
    this.setError(null);
    await new Promise((r) => setTimeout(r, 3000));
    const variants: string[] = [];
    for (let i = 0; i < this.numImageVariants(); i++) {
      variants.push(
        `https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=800&fit=crop&seed=${Date.now() + i}`
      );
    }
    this.imageVariants.set(variants);
    this.selectedImageIndex.set(0);
    this.userCredits.update((c) => c - cost);
    this.isGeneratingImage.set(false);
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
        this.selectedImageIndex.set(0);
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  async handleGenerateVideo(): Promise<void> {
    if (this.selectedImageIndex() === null) {
      this.setError('Najpierw wybierz obrazek');
      return;
    }
    const cost = this.videoCost();
    if (this.userCredits() < cost) {
      this.setError(`Niewystarczająca ilość kredytów! Potrzebujesz ${cost} kredytów.`);
      return;
    }
    this.isGeneratingVideo.set(true);
    this.videoVariants.set([]);
    this.selectedVideoIndex.set(null);
    this.setError(null);
    await new Promise((r) => setTimeout(r, 4000));
    const variants: string[] = [];
    for (let i = 0; i < this.numVideoVariants(); i++) {
      variants.push(
        `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4?v=${i}`
      );
    }
    this.videoVariants.set(variants);
    this.selectedVideoIndex.set(0);
    this.userCredits.update((c) => c - cost);
    this.isGeneratingVideo.set(false);
  }

  togglePlatform(p: Platform): void {
    this.selectedPlatforms.update((arr) =>
      arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]
    );
  }

  handleShare(): void {
    const platforms = this.selectedPlatforms();
    if (platforms.length === 0) {
      this.setError('Wybierz przynajmniej jedną platformę');
      return;
    }
    this.setError(null);
    this.errorMessage.set(null);
    // TODO: integrate with publish API
  }
}
