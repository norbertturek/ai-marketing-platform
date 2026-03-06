import { expect, test } from '@playwright/test';

test.describe('Auth', () => {
  test('signup creates account and redirects to projects', async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    const password = 'TestPass123!';

    await page.goto('/signup');
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('Minimum 8 characters').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL(/\/projects/);
    await expect(page.getByRole('heading', { name: 'Your projects' })).toBeVisible();
  });

  test('signin with invalid credentials shows error', async ({ page }) => {
    await page.goto('/signin');
    await page.getByPlaceholder('you@example.com').fill('invalid@example.com');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText(/invalid|error|failed/i)).toBeVisible({ timeout: 5000 });
  });
});
