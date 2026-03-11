import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { LucideAngularModule } from 'lucide-angular';
import {
  CreateProjectPayload,
  ProjectSettings,
  ProjectResponse,
  ProjectsApiService,
} from '../core/projects/projects-api.service';

@Component({
  selector: 'app-projects-page',
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule, ...HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="dark rounded-xl border border-zinc-800/50 bg-[#0a0a0a] p-6 text-white shadow-sm md:p-8"
    >
      <div class="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-medium text-white">Your projects</h1>
          <p class="mt-2 text-xs md:text-sm text-zinc-500">
            Manage your marketing campaigns in one place.
          </p>
        </div>

        <button
          hlmBtn
          type="button"
          size="sm"
          class="bg-white text-black hover:bg-zinc-200"
          (click)="toggleCreateForm()"
        >
          <lucide-icon name="Plus" class="size-4" aria-hidden="true"></lucide-icon>
          {{ showCreateForm() ? 'Close form' : 'New project' }}
        </button>
      </div>

      @if (showCreateForm()) {
        <form
          class="mb-8 space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/70 p-4"
          [formGroup]="form"
          (ngSubmit)="createProject()"
        >
          <div>
            <label for="project-name" class="mb-2 block text-xs text-zinc-400">Project name</label>
            <input
              id="project-name"
              type="text"
              formControlName="name"
              class="h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none ring-zinc-500/40 transition focus-visible:ring-[3px] placeholder:text-zinc-500"
              placeholder="e.g. Spring Campaign 2026"
            />
            @if (nameError) {
              <p class="mt-1 text-xs text-red-400">{{ nameError }}</p>
            }
          </div>

          <div>
            <label for="project-description" class="mb-2 block text-xs text-zinc-400"
              >Description (optional)</label
            >
            <textarea
              id="project-description"
              rows="3"
              formControlName="description"
              class="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none ring-zinc-500/40 transition focus-visible:ring-[3px] placeholder:text-zinc-500"
              placeholder="Short project description..."
            ></textarea>
          </div>

          <div>
            <label for="project-context" class="mb-2 block text-xs text-zinc-400"
              >AI Context (optional)</label
            >
            <textarea
              id="project-context"
              rows="4"
              formControlName="context"
              class="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none ring-zinc-500/40 transition focus-visible:ring-[3px] placeholder:text-zinc-500"
              placeholder="Tone, style, brand guidelines..."
            ></textarea>
          </div>

          <details class="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <summary class="cursor-pointer text-sm text-zinc-300">
              Project generation configuration
            </summary>
            <div class="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <label class="mb-1 block text-xs text-zinc-400">Default platform</label>
                <select formControlName="defaultPlatform" class="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white">
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs text-zinc-400">AI model</label>
                <select formControlName="defaultAiModel" class="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white">
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-4-turbo">gpt-4-turbo</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs text-zinc-400">Text variants</label>
                <select formControlName="defaultNumTextVariants" class="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs text-zinc-400">Max length</label>
                <input formControlName="defaultMaxLength" type="number" min="50" max="2000" class="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white" />
              </div>
              <div>
                <label class="mb-1 block text-xs text-zinc-400">Temperature</label>
                <input formControlName="defaultTemperature" type="number" step="0.1" min="0" max="2" class="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white" />
              </div>
              <div>
                <label class="mb-1 block text-xs text-zinc-400">Image model</label>
                <input formControlName="defaultImageModel" type="text" class="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white" />
              </div>
              <div>
                <label class="mb-1 block text-xs text-zinc-400">Image aspect ratio</label>
                <select formControlName="defaultAspectRatio" class="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white">
                  <option value="1:1">1:1</option>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="4:5">4:5</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs text-zinc-400">Image output format</label>
                <select formControlName="defaultImageOutputFormat" class="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white">
                  <option value="WEBP">WEBP</option>
                  <option value="PNG">PNG</option>
                  <option value="JPG">JPG</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs text-zinc-400">Image variants</label>
                <select formControlName="defaultNumImageVariants" class="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs text-zinc-400">Video model</label>
                <select formControlName="defaultVideoModel" class="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white">
                  @for (m of videoModelOptions; track m.id) {
                    <option [value]="m.id">{{ m.label }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs text-zinc-400">Video duration</label>
                <select formControlName="defaultVideoDuration" class="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white">
                  <option value="3">3s</option>
                  <option value="5">5s</option>
                  <option value="10">10s</option>
                  <option value="15">15s</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs text-zinc-400">Video variants</label>
                <select formControlName="defaultNumVideoVariants" class="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs text-zinc-400">Motion intensity</label>
                <select formControlName="defaultMotionIntensity" class="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs text-zinc-400">Camera movement</label>
                <select formControlName="defaultCameraMovement" class="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white">
                  <option value="static">Static</option>
                  <option value="pan">Pan</option>
                  <option value="zoom">Zoom</option>
                  <option value="dolly">Dolly</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs text-zinc-400">FPS</label>
                <select formControlName="defaultFps" class="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white">
                  <option value="24">24</option>
                  <option value="30">30</option>
                  <option value="60">60</option>
                </select>
              </div>
              <label class="mt-2 inline-flex items-center gap-2 text-xs text-zinc-400">
                <input type="checkbox" formControlName="defaultLoopVideo" class="size-4 rounded border-zinc-700" />
                Loop video by default
              </label>
            </div>
          </details>

          @if (createErrorMessage()) {
            <p class="text-sm text-red-400">{{ createErrorMessage() }}</p>
          }

          <div class="flex justify-end gap-3">
            <button
              hlmBtn
              variant="outline"
              type="button"
              class="border-zinc-700 hover:bg-zinc-800"
              (click)="cancelCreate()"
            >
              Cancel
            </button>
            <button
              hlmBtn
              type="submit"
              class="bg-white text-black hover:bg-zinc-200"
              [disabled]="isSubmitting()"
            >
              {{ isSubmitting() ? 'Creating...' : 'Create project' }}
            </button>
          </div>
        </form>
      }

      @if (loading()) {
        <div
          class="rounded-lg border border-zinc-800 bg-zinc-900/40 p-8 text-center text-sm text-zinc-500"
        >
          Loading projects...
        </div>
      } @else if (errorMessage()) {
        <div class="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">
          {{ errorMessage() }}
        </div>
      } @else if (projects().length === 0) {
        <div class="rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-12 text-center">
          <lucide-icon
            name="Folder"
            class="mx-auto mb-4 size-16 text-zinc-700"
            aria-hidden="true"
          ></lucide-icon>
          <h2 class="text-lg font-medium text-white">No projects</h2>
          <p class="mt-2 text-sm text-zinc-500 mb-6">Start by creating your first project.</p>
          <button
            hlmBtn
            type="button"
            class="bg-white text-black hover:bg-zinc-200 h-9 text-sm"
            (click)="toggleCreateForm()"
          >
            <lucide-icon name="Plus" class="mr-2 size-4" aria-hidden="true"></lucide-icon>
            Create first project
          </button>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          @for (project of projects(); track project.id) {
            <a [routerLink]="['/project', project.id]" class="group block">
              <article
                class="rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-5 transition-colors hover:border-zinc-700 cursor-pointer"
              >
                <div class="mb-4 flex items-start justify-between">
                  <div
                    class="flex size-10 items-center justify-center rounded-lg bg-zinc-800/50 text-zinc-400 transition-colors group-hover:bg-zinc-800 p-2.5"
                    aria-hidden="true"
                  >
                    <lucide-icon name="Folder" class="size-5"></lucide-icon>
                  </div>
                  <span class="text-xs text-zinc-600">{{ project.postsCount }} items</span>
                </div>
                <h3
                  class="text-base font-medium text-white mb-2 group-hover:text-white transition-colors"
                >
                  {{ project.name }}
                </h3>
                <p class="text-xs text-zinc-500 line-clamp-2 mb-4">
                  {{ project.description || 'No description' }}
                </p>
                <div class="flex items-center text-xs text-zinc-600">
                  <lucide-icon name="Calendar" class="mr-1 size-3"></lucide-icon>
                  {{ formatDate(project.createdAt) }}
                </div>
              </article>
            </a>
          }
        </div>
      }
    </section>
  `,
})
export class ProjectsPage implements OnInit {
  private readonly projectsApi = inject(ProjectsApiService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly createErrorMessage = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly showCreateForm = signal(false);
  readonly projects = signal<ProjectResponse[]>([]);
  readonly videoModelOptions = [
    { id: 'klingai:1@1', label: 'KlingAI 1.0 Standard' },
    { id: 'klingai:1@2', label: 'KlingAI 1.0 Pro' },
    { id: 'klingai:2@1', label: 'KlingAI 1.5 Standard' },
    { id: 'klingai:2@2', label: 'KlingAI 1.5 Pro' },
    { id: 'klingai:3@1', label: 'KlingAI 1.6 Standard' },
    { id: 'klingai:3@2', label: 'KlingAI 1.6 Pro' },
    { id: 'klingai:5@1', label: 'KlingAI 2.1 Standard' },
    { id: 'klingai:5@2', label: 'KlingAI 2.1 Pro' },
    { id: 'klingai:5@3', label: 'KlingAI 2.1 Master' },
    { id: 'klingai:6@0', label: 'KlingAI 2.5 Turbo Standard' },
    { id: 'klingai:6@1', label: 'KlingAI 2.5 Turbo Pro' },
    { id: 'klingai:kling-video@2.6-pro', label: 'Kling VIDEO 2.6 Pro' },
    { id: 'klingai:kling-video@3-standard', label: 'Kling VIDEO 3.0 Standard' },
    { id: 'klingai:kling-video@3-pro', label: 'Kling VIDEO 3.0 Pro' },
  ] as const;

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(5000)],
    }),
    context: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(10000)],
    }),
    defaultPlatform: new FormControl<'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok'>(
      'instagram',
      { nonNullable: true },
    ),
    defaultAiModel: new FormControl<'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo'>('gpt-4o-mini', {
      nonNullable: true,
    }),
    defaultNumTextVariants: new FormControl('1', { nonNullable: true }),
    defaultMaxLength: new FormControl('150', { nonNullable: true }),
    defaultTemperature: new FormControl('0.7', { nonNullable: true }),
    defaultImageModel: new FormControl('runware:101@1', { nonNullable: true }),
    defaultAspectRatio: new FormControl<'1:1' | '16:9' | '9:16' | '4:5'>('1:1', {
      nonNullable: true,
    }),
    defaultImageOutputFormat: new FormControl<'JPG' | 'PNG' | 'WEBP'>('WEBP', {
      nonNullable: true,
    }),
    defaultNumImageVariants: new FormControl('1', { nonNullable: true }),
    defaultVideoModel: new FormControl('klingai:1@1', { nonNullable: true }),
    defaultVideoDuration: new FormControl('5', { nonNullable: true }),
    defaultNumVideoVariants: new FormControl('1', { nonNullable: true }),
    defaultMotionIntensity: new FormControl<'low' | 'medium' | 'high'>('medium', {
      nonNullable: true,
    }),
    defaultCameraMovement: new FormControl<'static' | 'pan' | 'zoom' | 'dolly'>('static', {
      nonNullable: true,
    }),
    defaultFps: new FormControl<'24' | '30' | '60'>('30', { nonNullable: true }),
    defaultLoopVideo: new FormControl(false, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.loadProjects();
  }

  get nameError(): string | null {
    const control = this.form.controls.name;
    if (!control.touched && !control.dirty) {
      return null;
    }
    if (control.hasError('required')) {
      return 'Project name is required';
    }
    if (control.hasError('maxlength')) {
      return 'Project name can have at most 255 characters';
    }
    return null;
  }

  toggleCreateForm(): void {
    this.showCreateForm.set(!this.showCreateForm());
    this.createErrorMessage.set(null);
  }

  cancelCreate(): void {
    this.showCreateForm.set(false);
    this.createErrorMessage.set(null);
    this.form.reset({
      name: '',
      description: '',
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
  }

  createProject(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.createErrorMessage.set(null);
    this.isSubmitting.set(true);

    const payload = this.form.getRawValue();
    const body: CreateProjectPayload = {
      name: payload.name.trim(),
      description: payload.description.trim() || undefined,
      context: payload.context.trim() || undefined,
      settings: this.buildProjectSettings(payload),
    };

    this.projectsApi.createProject(body).subscribe({
      next: (project) => {
        this.projects.update((items) => [project, ...items]);
        this.cancelCreate();
      },
      error: (error: unknown) => {
        this.createErrorMessage.set(this.mapCreateError(error));
        this.isSubmitting.set(false);
      },
      complete: () => this.isSubmitting.set(false),
    });
  }

  formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-US');
  }

  private loadProjects(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.projectsApi.getProjects().subscribe({
      next: (projects) => this.projects.set(projects),
      error: () => {
        this.errorMessage.set('Could not load projects. Please try again.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  private mapCreateError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = (error.error as { message?: string } | null)?.message;
      if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
        return backendMessage;
      }
      if (error.status === 400) {
        return 'Invalid project data. Please check the form.';
      }
    }
    return 'Could not create project. Please try again.';
  }

  private buildProjectSettings(payload: ReturnType<ProjectsPage['form']['getRawValue']>): ProjectSettings {
    return {
      defaultPlatform: payload.defaultPlatform,
      defaultAiModel: payload.defaultAiModel,
      defaultNumTextVariants: Number.parseInt(payload.defaultNumTextVariants, 10) || 1,
      defaultMaxLength: Number.parseInt(payload.defaultMaxLength, 10) || 150,
      defaultTemperature: Number.parseFloat(payload.defaultTemperature) || 0.7,
      defaultImageModel: payload.defaultImageModel.trim() || 'runware:101@1',
      defaultAspectRatio: payload.defaultAspectRatio,
      defaultImageOutputFormat: payload.defaultImageOutputFormat,
      defaultNumImageVariants: Number.parseInt(payload.defaultNumImageVariants, 10) || 1,
      defaultVideoModel: payload.defaultVideoModel.trim() || 'klingai:1@1',
      defaultVideoDuration: Number.parseInt(payload.defaultVideoDuration, 10) || 5,
      defaultNumVideoVariants: Number.parseInt(payload.defaultNumVideoVariants, 10) || 1,
      defaultMotionIntensity: payload.defaultMotionIntensity,
      defaultCameraMovement: payload.defaultCameraMovement,
      defaultFps: payload.defaultFps,
      defaultLoopVideo: payload.defaultLoopVideo,
    };
  }
}
