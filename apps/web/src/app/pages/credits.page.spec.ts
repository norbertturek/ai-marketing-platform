import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { of } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { LUCIDE_ICONS } from '../app.config';
import { CreditsApiService } from '../core/credits/credits-api.service';
import { CreditsPage } from './credits.page';

describe('CreditsPage', () => {
  const creditsApiMock = {
    getCredits: () => of({ balance: 1000, usage: [] }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreditsPage],
      providers: [
        provideRouter([{ path: 'credits', component: CreditsPage }]),
        importProvidersFrom(LucideAngularModule.pick(LUCIDE_ICONS)),
        { provide: CreditsApiService, useValue: creditsApiMock },
      ],
    }).compileComponents();
  });

  it('renders AI Marketing Platform title', () => {
    const fixture = TestBed.createComponent(CreditsPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('AI Marketing Platform');
  });

  it('displays credits balance from API', () => {
    const fixture = TestBed.createComponent(CreditsPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1,000');
  });
});
