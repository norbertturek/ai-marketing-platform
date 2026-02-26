import { Component, inject, signal } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { PlaygroundService } from '../core/playground/playground.service';

@Component({
  selector: 'app-playground-page',
  imports: [...HlmButtonImports],
  template: `
    <section class="rounded-xl border bg-background p-4 shadow-sm md:p-6">
      <div class="mb-4 flex flex-col gap-3 border-b pb-4 md:flex-row md:items-center md:justify-between">
        <h1 class="text-xl font-semibold tracking-tight md:text-2xl">Playground</h1>

        <div class="flex items-center gap-2">
          <button hlmBtn variant="outline" size="sm" type="button">Save</button>
          <button hlmBtn variant="outline" size="sm" type="button">View code</button>
          <button hlmBtn size="sm" type="button">Share</button>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-[1fr_1fr_240px]">
        <div class="space-y-4">
          <div class="space-y-2">
            <label for="playground-image-prompt" class="text-sm font-medium">Image prompt</label>
            <textarea
              id="playground-image-prompt"
              class="min-h-[180px] w-full resize-y rounded-md border bg-muted/20 p-3 text-sm outline-none ring-ring/50 transition-colors focus-visible:ring-[3px]"
              placeholder="Describe the image you want to generate..."
              [value]="imagePrompt()"
              (input)="imagePrompt.set($any($event.target).value)"
            ></textarea>
            <div class="flex items-center gap-2">
              <button
                hlmBtn
                type="button"
                [disabled]="imageLoading() || !imagePrompt().trim()"
                (click)="onGenerateImage()"
              >
                {{ imageLoading() ? 'Generating…' : 'Generate image' }}
              </button>
              <button hlmBtn variant="outline" type="button" (click)="clearImageStep()">
                Clear
              </button>
            </div>
          </div>

          @if (acceptedImageUrl()) {
            <div class="space-y-2 border-t pt-4">
              <label for="playground-video-prompt" class="text-sm font-medium">Video prompt</label>
              <p class="text-xs text-muted-foreground">
                Generate a video from the accepted image and this description.
              </p>
              <textarea
                id="playground-video-prompt"
                class="min-h-[100px] w-full resize-y rounded-md border bg-muted/20 p-3 text-sm outline-none ring-ring/50 transition-colors focus-visible:ring-[3px]"
                placeholder="Describe the motion or scene for the video..."
                [value]="videoPrompt()"
                (input)="videoPrompt.set($any($event.target).value)"
              ></textarea>
              <div class="flex items-center gap-2">
                <button
                  hlmBtn
                  type="button"
                  [disabled]="videoLoading() || !videoPrompt().trim()"
                  (click)="onGenerateVideo()"
                >
                  {{ videoLoading() ? 'Generating…' : 'Generate video' }}
                </button>
                <button hlmBtn variant="outline" type="button" (click)="clearVideoStep()">
                  Clear video
                </button>
              </div>
            </div>
          }
        </div>

        <div class="space-y-4">
          <div>
            <h2 class="mb-2 text-sm font-medium">Generated image</h2>
            @if (imageLoading()) {
              <div
                class="flex min-h-[280px] w-full items-center justify-center rounded-md border border-dashed bg-muted/20 text-sm text-muted-foreground"
              >
                Generating image…
              </div>
            } @else if (generatedImageUrl()) {
              <div class="space-y-2">
                <img
                  [src]="generatedImageUrl()"
                  alt="Generated"
                  class="max-h-[320px] w-full rounded-md border object-contain bg-muted/10"
                />
                @if (!acceptedImageUrl()) {
                  <button hlmBtn size="sm" type="button" (click)="acceptImage()">
                    Accept image
                  </button>
                } @else {
                  <p class="text-xs text-muted-foreground">Accepted. Use the video prompt on the left.</p>
                }
              </div>
            } @else {
              <div
                class="flex min-h-[280px] w-full items-center justify-center rounded-md border border-dashed bg-muted/10 text-sm text-muted-foreground"
              >
                Image will appear here
              </div>
            }
          </div>

          @if (acceptedImageUrl()) {
            <div class="border-t pt-4">
              <h2 class="mb-2 text-sm font-medium">Generated video</h2>
              @if (videoLoading()) {
                <div
                  class="flex min-h-[180px] w-full items-center justify-center rounded-md border border-dashed bg-muted/20 text-sm text-muted-foreground"
                >
                  Generating video…
                </div>
              } @else if (generatedVideoUrl()) {
                <video
                  [src]="generatedVideoUrl()"
                  controls
                  class="w-full rounded-md border bg-muted/10"
                ></video>
              } @else {
                <div
                  class="flex min-h-[180px] w-full items-center justify-center rounded-md border border-dashed bg-muted/10 text-sm text-muted-foreground"
                >
                  Video will appear here
                </div>
              }
            </div>
          }
        </div>

        <aside class="space-y-4 rounded-md border bg-muted/10 p-3">
          <h2 class="text-sm font-semibold">Model Settings</h2>

          <div class="space-y-2">
            <label for="playground-model" class="text-xs font-medium text-muted-foreground">Model</label>
            <select
              id="playground-model"
              class="h-9 w-full rounded-md border bg-background px-2 text-sm outline-none ring-ring/50 focus-visible:ring-[3px]"
            >
              <option>Load a model...</option>
            </select>
          </div>

          <div class="space-y-2">
            <label for="playground-temperature" class="text-xs font-medium text-muted-foreground">
              Temperature
            </label>
            <input
              id="playground-temperature"
              type="range"
              min="0"
              max="1"
              value="0.64"
              step="0.01"
              class="w-full"
            />
          </div>

          <div class="space-y-2">
            <label for="playground-max-length" class="text-xs font-medium text-muted-foreground">
              Maximum length
            </label>
            <input
              id="playground-max-length"
              type="range"
              min="1"
              max="400"
              value="150"
              step="1"
              class="w-full"
            />
          </div>

          <div class="space-y-2">
            <label for="playground-top-p" class="text-xs font-medium text-muted-foreground">Top p</label>
            <input
              id="playground-top-p"
              type="range"
              min="0"
              max="1"
              value="0.9"
              step="0.01"
              class="w-full"
            />
          </div>
        </aside>
      </div>

      @if (error()) {
        <p class="mt-4 text-sm text-destructive">{{ error() }}</p>
      }
    </section>
  `,
})
export class PlaygroundPage {
  private readonly playground = inject(PlaygroundService);

  readonly imagePrompt = signal('');
  readonly imageLoading = signal(false);
  readonly generatedImageUrl = signal<string | null>(null);
  readonly acceptedImageUrl = signal<string | null>(null);

  readonly videoPrompt = signal('');
  readonly videoLoading = signal(false);
  readonly generatedVideoUrl = signal<string | null>(null);

  readonly error = signal<string | null>(null);

  async onGenerateImage(): Promise<void> {
    const prompt = this.imagePrompt().trim();
    if (!prompt) return;
    this.error.set(null);
    this.imageLoading.set(true);
    this.generatedImageUrl.set(null);
    this.acceptedImageUrl.set(null);
    this.clearVideoStep();
    try {
      const { imageUrl } = await this.playground.generateImage(prompt);
      this.generatedImageUrl.set(imageUrl);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Failed to generate image');
    } finally {
      this.imageLoading.set(false);
    }
  }

  acceptImage(): void {
    const url = this.generatedImageUrl();
    if (url) this.acceptedImageUrl.set(url);
  }

  clearImageStep(): void {
    this.imagePrompt.set('');
    this.generatedImageUrl.set(null);
    this.acceptedImageUrl.set(null);
    this.clearVideoStep();
  }

  async onGenerateVideo(): Promise<void> {
    const imageUrl = this.acceptedImageUrl();
    const prompt = this.videoPrompt().trim();
    if (!imageUrl || !prompt) return;
    this.error.set(null);
    this.videoLoading.set(true);
    this.generatedVideoUrl.set(null);
    try {
      const { videoUrl } = await this.playground.generateVideo(imageUrl, prompt);
      this.generatedVideoUrl.set(videoUrl || null);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Failed to generate video');
    } finally {
      this.videoLoading.set(false);
    }
  }

  clearVideoStep(): void {
    this.videoPrompt.set('');
    this.generatedVideoUrl.set(null);
  }
}
