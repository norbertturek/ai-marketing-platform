import { expect, test } from '@playwright/test';

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    const email = `e2e-projects-${Date.now()}@example.com`;
    const password = 'TestPass123!';

    await page.goto('/signup');
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('Minimum 8 characters').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/projects/);
  });

  test('create project shows in list', async ({ page }) => {
    const name = `Campaign ${Date.now()}`;
    await page.getByRole('button', { name: /Create first project|New project/ }).first().click();
    await page.getByPlaceholder(/e.g. Spring Campaign/).fill(name);
    await page.getByRole('button', { name: 'Create project' }).click();

    await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 5000 });
  });
});
