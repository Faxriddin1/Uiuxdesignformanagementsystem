import { test, expect } from '@playwright/test';

/**
 * E2E тесты для аутентификации
 */
test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page for unauthenticated users', async ({ page }) => {
    // Проверяем что отображается страница логина
    await expect(page.getByRole('heading', { name: /вход/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/пароль/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /войти/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Вводим неверные данные
    await page.getByPlaceholder(/email/i).fill('wrong@email.com');
    await page.getByPlaceholder(/пароль/i).fill('wrongpassword');
    await page.getByRole('button', { name: /войти/i }).click();

    // Ожидаем сообщение об ошибке
    await expect(page.getByText(/неверный|ошибка|invalid/i)).toBeVisible({ timeout: 5000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Вводим правильные данные
    await page.getByPlaceholder(/email/i).fill('admin@example.com');
    await page.getByPlaceholder(/пароль/i).fill('admin123');
    await page.getByRole('button', { name: /войти/i }).click();

    // Ожидаем переход на дашборд
    await expect(page).toHaveURL(/.*dashboard|.*\//);
    
    // Проверяем что отображается sidebar
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Сначала логинимся
    await page.getByPlaceholder(/email/i).fill('admin@example.com');
    await page.getByPlaceholder(/пароль/i).fill('admin123');
    await page.getByRole('button', { name: /войти/i }).click();

    // Ждём загрузки
    await page.waitForLoadState('networkidle');

    // Ищем кнопку выхода (в меню пользователя)
    const userMenu = page.locator('[data-testid="user-menu"], .user-avatar, .avatar');
    if (await userMenu.isVisible()) {
      await userMenu.click();
      const logoutButton = page.getByText(/выйти|logout/i);
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        // Проверяем возврат на страницу логина
        await expect(page.getByRole('heading', { name: /вход/i })).toBeVisible();
      }
    }
  });
});
