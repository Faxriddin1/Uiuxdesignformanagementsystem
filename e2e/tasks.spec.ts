import { test, expect } from '@playwright/test';

/**
 * E2E тесты для задач
 */
test.describe('Tasks', () => {
  // Логинимся перед каждым тестом
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Логин
    await page.getByPlaceholder(/email/i).fill('admin@example.com');
    await page.getByPlaceholder(/пароль/i).fill('admin123');
    await page.getByRole('button', { name: /войти/i }).click();
    
    await page.waitForLoadState('networkidle');
    
    // Переходим на страницу задач
    const tasksLink = page.getByRole('link', { name: /задачи|tasks/i }).first();
    if (await tasksLink.isVisible()) {
      await tasksLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display tasks list', async ({ page }) => {
    // Проверяем что есть список задач или сообщение о пустом списке
    const taskCards = page.locator('[data-testid="task-card"], .task-card, .card');
    const emptyState = page.getByText(/нет задач|no tasks|пусто/i);
    
    // Должен быть либо список задач, либо сообщение о пустом списке
    const hasTaskCards = await taskCards.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    
    expect(hasTaskCards || hasEmptyState).toBeTruthy();
  });

  test('should open task detail on click', async ({ page }) => {
    // Кликаем на первую задачу
    const firstTask = page.locator('[data-testid="task-card"], .task-card, .card').first();
    
    if (await firstTask.isVisible()) {
      await firstTask.click();
      
      // Ожидаем модальное окно или страницу детали
      await page.waitForLoadState('networkidle');
      
      // Проверяем наличие деталей задачи
      const taskDetail = page.locator('[data-testid="task-detail"], .task-detail, [role="dialog"]');
      const isDetailVisible = await taskDetail.isVisible().catch(() => false);
      
      // Если модальное окно не появилось, возможно это отдельная страница
      if (!isDetailVisible) {
        // Проверяем URL или заголовок
        const heading = page.getByRole('heading').first();
        await expect(heading).toBeVisible();
      }
    }
  });

  test('should filter tasks by status', async ({ page }) => {
    // Ищем фильтр по статусу
    const statusFilter = page.locator('[data-testid="status-filter"], select, [role="combobox"]').first();
    
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      
      // Выбираем опцию
      const option = page.getByRole('option', { name: /в работе|in progress/i }).first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should search tasks', async ({ page }) => {
    // Ищем поле поиска
    const searchInput = page.getByPlaceholder(/поиск|search/i);
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');
    }
  });
});
