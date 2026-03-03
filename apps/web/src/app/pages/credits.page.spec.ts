import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { LUCIDE_ICONS } from '../app.config';
import { CreditsPage } from './credits.page';

describe('CreditsPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreditsPage],
      providers: [
        provideRouter([{ path: 'credits', component: CreditsPage }]),
        importProvidersFrom(LucideAngularModule.pick(LUCIDE_ICONS)),
      ],
    }).compileComponents();
  });

  it('renders AI Marketing Platform title', () => {
    const fixture = TestBed.createComponent(CreditsPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('AI Marketing Platform');
  });

  it('displays credits balance', () => {
    const fixture = TestBed.createComponent(CreditsPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1,000');
  });
});
