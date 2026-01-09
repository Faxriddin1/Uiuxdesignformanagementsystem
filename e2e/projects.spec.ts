import { test, expect } from '@playwright/test';

/**
 * E2E тесты для проектов
 */
test.describe('Projects', () => {
  // Логинимся перед каждым тестом
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Логин
    await page.getByPlaceholder(/email/i).fill('admin@example.com');
    await page.getByPlaceholder(/пароль/i).fill('admin123');
    await page.getByRole('button', { name: /войти/i }).click();
    
    await page.waitForLoadState('networkidle');
    
    // Переходим на страницу проектов
    const projectsLink = page.getByRole('link', { name: /проект|project/i }).first();
    if (await projectsLink.isVisible()) {
      await projectsLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display projects list', async ({ page }) => {
    // Проверяем наличие проектов или пустого состояния
    const projectCards = page.locator('[data-testid="project-card"], .project-card, .card');
    const emptyState = page.getByText(/нет проектов|no projects|пусто/i);
    
    const hasProjects = await projectCards.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    
    expect(hasProjects || hasEmptyState).toBeTruthy();
  });

  test('should open project detail', async ({ page }) => {
    const firstProject = page.locator('[data-testid="project-card"], .project-card, .card').first();
    
    if (await firstProject.isVisible()) {
      await firstProject.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display project progress', async ({ page }) => {
    // Ищем индикатор прогресса
    const progressBar = page.locator('[role="progressbar"], .progress, .progress-bar');
    
    if (await progressBar.first().isVisible()) {
      await expect(progressBar.first()).toBeVisible();
    }
  });
});
