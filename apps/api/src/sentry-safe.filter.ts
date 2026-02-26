import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Injectable,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';

/**
 * Wraps SentryGlobalFilter so we never call it when the HTTP response is
 * missing or incomplete (avoids "Cannot read properties of undefined (reading 'isHeadersSent')"
 * in production, e.g. when Railway or probes hit in an unexpected context).
 */
@Catch()
@Injectable()
export class SentrySafeFilter implements ExceptionFilter {
  private readonly sentryFilter = new SentryGlobalFilter();

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      this.sentryFilter.catch(exception, host);
      return;
    }

    const response = host
      .switchToHttp()
      .getResponse<{ isHeadersSent?: () => boolean }>();
    const hasResponse =
      response != null && typeof response.isHeadersSent === 'function';

    if (hasResponse) {
      this.sentryFilter.catch(exception, host);
      return;
    }

    Sentry.captureException(exception);
  }
}
