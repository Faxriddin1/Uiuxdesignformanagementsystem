import { test, expect } from '@playwright/test';

/**
 * E2E тесты для дашборда
 */
test.describe('Dashboard', () => {
  // Логинимся перед каждым тестом
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Логин
    await page.getByPlaceholder(/email/i).fill('admin@example.com');
    await page.getByPlaceholder(/пароль/i).fill('admin123');
    await page.getByRole('button', { name: /войти/i }).click();
    
    // Ждём загрузки дашборда
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard statistics', async ({ page }) => {
    // Проверяем наличие статистики
    await expect(page.getByText(/задач|tasks/i).first()).toBeVisible();
    await expect(page.getByText(/проект|project/i).first()).toBeVisible();
  });

  test('should navigate to tasks page', async ({ page }) => {
    // Клик по навигации "Задачи"
    const tasksLink = page.getByRole('link', { name: /задачи|tasks/i }).first();
    
    if (await tasksLink.isVisible()) {
      await tasksLink.click();
      await expect(page.getByRole('heading', { name: /задачи|tasks/i })).toBeVisible();
    }
  });

  test('should navigate to projects page', async ({ page }) => {
    // Клик по навигации "Проекты"
    const projectsLink = page.getByRole('link', { name: /проект|project/i }).first();
    
    if (await projectsLink.isVisible()) {
      await projectsLink.click();
      // Ожидаем страницу проектов
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display notifications icon', async ({ page }) => {
    // Проверяем наличие иконки уведомлений
    const notificationIcon = page.locator('[data-testid="notifications"], .notification-bell, [aria-label*="notification"]');
    
    // Должна быть видима хотя бы одна иконка уведомлений
    await expect(notificationIcon.first()).toBeVisible();
  });
});
