import { expect, test } from '@playwright/test';

const MOCK_IMAGE_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKjNXQAAAABJRU5ErkJggg==';

test.describe('Save post with media', () => {
  test.beforeEach(async ({ page }) => {
    const email = `e2e-save-${Date.now()}@example.com`;
    const password = 'TestPass123!';

    await page.goto('/signup');
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('Minimum 8 characters').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/projects/);

    const noProjects = await page.getByText('No projects').isVisible();
    if (noProjects) {
      await page.getByRole('button', { name: 'Create first project' }).click();
      await page.getByPlaceholder(/Spring Campaign/i).fill('E2E Test Project');
      await page.getByRole('button', { name: 'Create project' }).click();
      await expect(page.getByText('E2E Test Project')).toBeVisible({ timeout: 5000 });
    }

    await page.locator('a[href^="/project/"]').first().click();
    await expect(page).toHaveURL(/\/project\/[^/]+$/);

    await page.getByRole('button', { name: 'New post' }).click();
    await expect(page).toHaveURL(/\/project\/[^/]+\/post\/[^/]+/);
  });

  test('saves post with text and image to project', async ({ page }) => {
    await page.route('**/api/content/generate-text', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          texts: ['Test post content for save flow'],
          remainingCredits: 95,
        }),
      });
    });

    await page.route('**/api/content/generate-image', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          urls: [MOCK_IMAGE_URL],
          imageUUIDs: ['mock-uuid-1'],
          remainingCredits: 90,
        }),
      });
    });

    await page.route('**/api/projects/*/posts/*', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'post-1',
            projectId: route.request().url().split('/projects/')[1]?.split('/')[0] ?? 'proj-1',
            content: 'Test post content for save flow',
            imageUrls: [MOCK_IMAGE_URL],
            videoUrls: [],
            platform: null,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.getByPlaceholder(/e.g. Promote/).fill('Test prompt');
    await page.getByRole('button', { name: 'Generate text' }).click();
    await expect(page.getByText(/Variant 1|Test post content/).first()).toBeVisible({
      timeout: 5000,
    });

    await page
      .getByPlaceholder(/Image description/)
      .fill('Test image');
    await page.getByRole('button', { name: 'Generate image' }).click();
    await expect(
      page.locator('img[alt="Variant 1"]').first()
    ).toBeVisible({ timeout: 5000 });

    const saveBtn = page.getByRole('button', { name: 'Save' });
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.evaluate((el: HTMLElement) => el.click());

    await expect(page).toHaveURL(/\/project\/[^/]+$/, { timeout: 15000 });
    await expect(page.getByText('Project posts')).toBeVisible({ timeout: 10000 });
  });
});
