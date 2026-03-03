import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { LucideAngularModule } from 'lucide-angular';
import { ProjectsApiService } from '../core/projects/projects-api.service';
import {
  PostsApiService,
  PostResponse,
} from '../core/projects/posts-api.service';

@Component({
  selector: 'app-project-detail-page',
  imports: [RouterLink, LucideAngularModule, ...HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="dark rounded-xl border border-zinc-800/50 bg-[#0a0a0a] p-6 text-white shadow-sm md:p-8">
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <a
            routerLink="/projects"
            class="mb-2 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <lucide-icon name="ArrowLeft" class="size-4" aria-hidden="true"></lucide-icon>
            Powrót do projektów
          </a>
          <h1 class="text-xl md:text-2xl font-medium text-white">{{ projectName() }}</h1>
          <p class="mt-1 text-sm text-zinc-500">Posty w projekcie</p>
        </div>
        <button
          hlmBtn
          type="button"
          size="sm"
          class="bg-white text-black hover:bg-zinc-200"
          [disabled]="isCreatingPost() || !projectId()"
          (click)="createPost()"
        >
          <lucide-icon name="Plus" class="size-4" aria-hidden="true"></lucide-icon>
          {{ isCreatingPost() ? 'Tworzenie...' : 'Nowy post' }}
        </button>
      </div>

      @if (loading()) {
        <div class="rounded-lg border border-zinc-800 bg-zinc-900/40 p-8 text-center text-sm text-zinc-500">
          Ładowanie postów...
        </div>
      } @else if (errorMessage()) {
        <div class="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">
          {{ errorMessage() }}
        </div>
      } @else if (posts().length === 0) {
        <div class="rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-12 text-center">
          <lucide-icon name="FileText" class="mx-auto mb-4 size-16 text-zinc-700" aria-hidden="true"></lucide-icon>
          <h2 class="text-lg font-medium text-white">Brak postów</h2>
          <p class="mt-2 text-sm text-zinc-500 mb-6">
            Zacznij od utworzenia swojego pierwszego posta.
          </p>
          <button
            hlmBtn
            type="button"
            class="bg-white text-black hover:bg-zinc-200 h-9 text-sm"
            [disabled]="isCreatingPost()"
            (click)="createPost()"
          >
            <lucide-icon name="Plus" class="mr-2 size-4" aria-hidden="true"></lucide-icon>
            Utwórz pierwszy post
          </button>
        </div>
      } @else {
        <div class="space-y-4">
          @for (post of posts(); track post.id) {
            <a
              [routerLink]="['/project', projectId(), 'post', post.id]"
              class="block"
            >
              <article
                class="rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900/60 cursor-pointer"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex min-w-0 flex-1 items-center gap-3">
                    <lucide-icon name="FileText" class="size-5 shrink-0 text-zinc-400"></lucide-icon>
                    <div>
                      <h3 class="text-base font-medium text-white">
                        Post
                      </h3>
                    <p class="mt-1 text-xs text-zinc-500">
                      Utworzono {{ formatDate(post.createdAt) }}
                    </p>
                    </div>
                  </div>
                  <span class="flex shrink-0 items-center gap-1 text-xs text-zinc-500">
                    <lucide-icon name="Calendar" class="size-3"></lucide-icon>
                    {{ formatDate(post.createdAt) }}
                  </span>
                </div>
              </article>
            </a>
          }
        </div>
      }
    </section>
  `,
})
export class ProjectDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectsApi = inject(ProjectsApiService);
  private readonly postsApi = inject(PostsApiService);

  protected projectId = signal<string | null>(null);
  protected projectName = signal<string>('');
  protected loading = signal(true);
  protected errorMessage = signal<string | null>(null);
  protected isCreatingPost = signal(false);
  protected posts = signal<PostResponse[]>([]);

  ngOnInit(): void {
    const pid = this.route.snapshot.paramMap.get('projectId');
    this.projectId.set(pid);
    if (pid) {
      this.loadProjectAndPosts(pid);
    } else {
      this.loading.set(false);
      this.errorMessage.set('Brak identyfikatora projektu.');
    }
  }

  protected formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  protected createPost(): void {
    const pid = this.projectId();
    if (!pid || this.isCreatingPost()) return;

    this.isCreatingPost.set(true);
    this.errorMessage.set(null);

    this.postsApi.createPost(pid).subscribe({
      next: (post) => {
        this.posts.update((list) => [post, ...list]);
        this.router.navigate(['/project', pid, 'post', post.id]);
      },
      error: () => {
        this.errorMessage.set('Nie udało się utworzyć posta. Spróbuj ponownie.');
        this.isCreatingPost.set(false);
      },
      complete: () => this.isCreatingPost.set(false),
    });
  }

  private loadProjectAndPosts(projectId: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      project: this.projectsApi.getProject(projectId),
      posts: this.postsApi.getPosts(projectId),
    }).subscribe({
      next: ({ project, posts }) => {
        this.projectName.set(project.name);
        this.posts.set(posts);
      },
      error: () => {
        this.errorMessage.set('Nie udało się załadować danych projektu.');
      },
      complete: () => this.loading.set(false),
    });
  }
}
