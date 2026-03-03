import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { LucideAngularModule } from 'lucide-angular';
import { CreateProjectPayload, ProjectResponse, ProjectsApiService } from '../core/projects/projects-api.service';

@Component({
  selector: 'app-projects-page',
  imports: [ReactiveFormsModule, RouterLink, LucideAngularModule, ...HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="dark rounded-xl border border-zinc-800/50 bg-[#0a0a0a] p-6 text-white shadow-sm md:p-8">
      <div class="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-medium text-white">Twoje projekty</h1>
          <p class="mt-2 text-xs md:text-sm text-zinc-500">
            Zarządzaj kampaniami marketingowymi w jednym miejscu.
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
          {{ showCreateForm() ? 'Zamknij formularz' : 'Nowy projekt' }}
        </button>
      </div>

      @if (showCreateForm()) {
        <form
          class="mb-8 space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/70 p-4"
          [formGroup]="form"
          (ngSubmit)="createProject()"
        >
          <div>
            <label for="project-name" class="mb-2 block text-xs text-zinc-400">Nazwa projektu</label>
            <input
              id="project-name"
              type="text"
              formControlName="name"
              class="h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none ring-zinc-500/40 transition focus-visible:ring-[3px] placeholder:text-zinc-500"
              placeholder="np. Kampania Wiosna 2026"
            />
            @if (nameError) {
              <p class="mt-1 text-xs text-red-400">{{ nameError }}</p>
            }
          </div>

          <div>
            <label for="project-description" class="mb-2 block text-xs text-zinc-400"
              >Opis (opcjonalnie)</label
            >
            <textarea
              id="project-description"
              rows="3"
              formControlName="description"
              class="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none ring-zinc-500/40 transition focus-visible:ring-[3px] placeholder:text-zinc-500"
              placeholder="Krótki opis projektu..."
            ></textarea>
          </div>

          <div>
            <label for="project-context" class="mb-2 block text-xs text-zinc-400"
              >Context AI (opcjonalnie)</label
            >
            <textarea
              id="project-context"
              rows="4"
              formControlName="context"
              class="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none ring-zinc-500/40 transition focus-visible:ring-[3px] placeholder:text-zinc-500"
              placeholder="Ton, styl, wytyczne marki..."
            ></textarea>
          </div>

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
              Anuluj
            </button>
            <button
              hlmBtn
              type="submit"
              class="bg-white text-black hover:bg-zinc-200"
              [disabled]="isSubmitting()"
            >
              {{ isSubmitting() ? 'Tworzenie...' : 'Utwórz projekt' }}
            </button>
          </div>
        </form>
      }

      @if (loading()) {
        <div
          class="rounded-lg border border-zinc-800 bg-zinc-900/40 p-8 text-center text-sm text-zinc-500"
        >
          Ładowanie projektów...
        </div>
      } @else if (errorMessage()) {
        <div
          class="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300"
        >
          {{ errorMessage() }}
        </div>
      } @else if (projects().length === 0) {
        <div
          class="rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-12 text-center"
        >
          <lucide-icon name="Folder" class="mx-auto mb-4 size-16 text-zinc-700" aria-hidden="true"></lucide-icon>
          <h2 class="text-lg font-medium text-white">Brak projektów</h2>
          <p class="mt-2 text-sm text-zinc-500 mb-6">
            Zacznij od utworzenia swojego pierwszego projektu.
          </p>
          <button
            hlmBtn
            type="button"
            class="bg-white text-black hover:bg-zinc-200 h-9 text-sm"
            (click)="toggleCreateForm()"
          >
            <lucide-icon name="Plus" class="mr-2 size-4" aria-hidden="true"></lucide-icon>
            Utwórz pierwszy projekt
          </button>
        </div>
      } @else {
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          @for (project of projects(); track project.id) {
            <a
              [routerLink]="['/project', project.id]"
              class="group block"
            >
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
                  <span class="text-xs text-zinc-600">{{ project.postsCount }} treści</span>
                </div>
                <h3 class="text-base font-medium text-white mb-2 group-hover:text-white transition-colors">
                  {{ project.name }}
                </h3>
                <p class="text-xs text-zinc-500 line-clamp-2 mb-4">
                  {{ project.description || 'Brak opisu' }}
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
      return 'Nazwa projektu jest wymagana';
    }
    if (control.hasError('maxlength')) {
      return 'Nazwa projektu może mieć maksymalnie 255 znaków';
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
    return new Date(isoDate).toLocaleDateString('pl-PL');
  }

  private loadProjects(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.projectsApi.getProjects().subscribe({
      next: (projects) => this.projects.set(projects),
      error: () => {
        this.errorMessage.set('Nie udało się załadować projektów. Spróbuj ponownie.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  private mapCreateError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 400) {
      return 'Niepoprawne dane projektu. Sprawdź formularz.';
    }
    return 'Nie udało się utworzyć projektu. Spróbuj ponownie.';
  }
}
