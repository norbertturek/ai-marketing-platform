import { expect, test } from '@playwright/test';

const TEST_VIDEO_URL =
  'https://www.w3.org/2010/05/video/mediaevents.mp4';

test.describe('Video generation', () => {
  test.beforeEach(async ({ page }) => {
    const email = `e2e-video-${Date.now()}@example.com`;
    const password = 'TestPass123!';

    await page.goto('/signup');
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('Minimum 8 characters').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/projects/);

    await page.goto('/playground');
  });

  test('generate video button is disabled when no image selected', async ({
    page,
  }) => {
    const generateVideoBtn = page.getByRole('button', {
      name: /Generate video/,
    });
    await expect(generateVideoBtn).toBeDisabled();
  });

  test('generate video button is enabled after image upload', async ({
    page,
  }) => {
    const fileInput = page.locator('input[type="file"][accept="image/*"]');
    await expect(fileInput).toBeAttached();

    const smallPngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKjNXQAAAABJRU5ErkJggg==';
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: Buffer.from(smallPngBase64, 'base64'),
    });

    const generateVideoBtn = page.getByRole('button', {
      name: /Generate video/,
    });
    await expect(generateVideoBtn).toBeEnabled({ timeout: 3000 });
  });

  test('video variants appear after successful generate-video API response', async ({
    page,
  }) => {
    await page.route('**/api/content/generate-image', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          urls: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKjNXQAAAABJRU5ErkJggg=='],
          imageUUIDs: ['mock-uuid-1'],
          remainingCredits: 95,
        }),
      });
    });

    await page.route('**/api/content/generate-video/start', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          taskUUIDs: ['task-1'],
          remainingCredits: 85,
        }),
      });
    });

    let statusCalls = 0;
    await page.route('**/api/content/generate-video/status', async (route) => {
      statusCalls += 1;
      if (statusCalls === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            done: false,
            urls: [],
            items: [{ taskUUID: 'task-1', status: 'processing' }],
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          done: true,
          urls: [TEST_VIDEO_URL],
          items: [
            {
              taskUUID: 'task-1',
              status: 'success',
              videoURL: TEST_VIDEO_URL,
            },
          ],
        }),
      });
    });

    await page.getByPlaceholder(/e.g. Promote/).fill('Test prompt');
    await page.getByRole('button', { name: 'Generate text' }).click();
    await expect(page.getByText(/Variant 1/).first()).toBeVisible({
      timeout: 10000,
    });

    await page
      .getByPlaceholder(/Image description/)
      .fill('A sunset over mountains');
    await page.getByRole('button', { name: 'Generate image' }).click();
    await expect(
      page.getByRole('heading', { name: 'Generate Video' })
    ).toBeVisible();
    await expect(
      page.locator('img[alt="Variant 1"]').first()
    ).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: /Generate video/ }).click();
    await expect(page.getByText('Video ready')).toBeVisible({ timeout: 25000 });
    const videoEl = page.locator('video').first();
    await expect(videoEl).toBeVisible({ timeout: 10000 });
    await expect(videoEl).toHaveAttribute('src', TEST_VIDEO_URL);
  });
});
