import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import {
  LucideAngularModule,
  Folder,
  Calendar,
  Plus,
  Sparkles,
  Image,
  Video,
  Globe,
  Upload,
  FileText,
  Share2,
  ChevronDown,
  Coins,
  ArrowLeft,
  Settings,
  Check,
  FileImage,
  Save,
  Loader2,
} from 'lucide-angular';
import { authInterceptor } from './core/auth/auth.interceptor';

import { routes } from './app.routes';

export const LUCIDE_ICONS = {
  Folder,
  Calendar,
  Plus,
  Sparkles,
  Image,
  Video,
  Globe,
  Upload,
  FileText,
  Share2,
  ChevronDown,
  Coins,
  ArrowLeft,
  Settings,
  Check,
  FileImage,
  Save,
  Loader2,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    importProvidersFrom(LucideAngularModule.pick(LUCIDE_ICONS)),
  ]
};
