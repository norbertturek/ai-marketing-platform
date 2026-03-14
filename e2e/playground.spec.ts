import { expect, test } from '@playwright/test';

test.describe('Playground (content generator)', () => {
  test.beforeEach(async ({ page }) => {
    const email = `e2e-playground-${Date.now()}@example.com`;
    const password = 'TestPass123!';

    await page.goto('/signup');
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('Minimum 8 characters').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/projects/);

    await page.goto('/playground');
  });

  test('renders three generation steps', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Generate Text' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Generate Image' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Generate Video' })).toBeVisible();
  });

  test('shows cost badges', async ({ page }) => {
    await expect(page.getByText(/1\s+credits/)).toBeVisible();
    await expect(page.getByText(/5\s+credits/)).toBeVisible();
    await expect(page.getByText(/10\s+credits/)).toBeVisible();
  });

  test('generate text button is enabled with prompt', async ({ page }) => {
    await page.getByPlaceholder(/e.g. Promote/).fill('Test prompt');
    await expect(page.getByRole('button', { name: 'Generate text' })).toBeEnabled();
  });
});
