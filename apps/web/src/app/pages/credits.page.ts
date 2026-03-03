import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { CreditsApiService } from '../core/credits/credits-api.service';

@Component({
  selector: 'app-credits-page',
  imports: [RouterLink, LucideAngularModule, ...HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="dark min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <a
        routerLink="/playground"
        class="absolute top-4 left-4 md:top-6 md:left-6 text-xs md:text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-2"
      >
        <lucide-icon name="ArrowLeft" class="size-4" aria-hidden="true"></lucide-icon>
        <span class="hidden sm:inline">Back to app</span>
      </a>

      <div class="w-full max-w-md px-4">
        <div class="text-center mb-6 md:mb-8">
          <div
            class="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 shadow-sm mb-4 md:mb-6"
            aria-hidden="true"
          >
            <lucide-icon name="Coins" class="size-6 text-amber-500"></lucide-icon>
          </div>
          <h1 class="text-xl md:text-2xl font-medium text-white mb-2">AI Marketing Platform</h1>
          <p class="text-xs md:text-sm text-zinc-500">Twoje kredyty AI</p>
        </div>

        <div class="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 space-y-6">
          <div class="flex items-center justify-between">
            <span class="text-sm text-zinc-400">Dostępne kredyty</span>
            @if (loading()) {
              <span class="text-2xl font-semibold text-zinc-500">...</span>
            } @else {
              <span class="text-2xl font-semibold text-white">
                {{ credits().toLocaleString() }}
              </span>
            }
          </div>

          <p class="text-xs text-zinc-500">
            Kredyty są używane do generowania treści tekstowych, obrazów i wideo w Playground.
          </p>

          <a
            routerLink="/playground"
            hlmBtn
            class="w-full bg-white text-black hover:bg-zinc-200"
          >
            Wróć do Playground
          </a>
        </div>
      </div>
    </section>
  `,
})
export class CreditsPage implements OnInit {
  private readonly creditsApi = inject(CreditsApiService);

  readonly credits = signal(0);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.creditsApi.getCredits().subscribe({
      next: (res) => {
        this.credits.set(res.balance);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
