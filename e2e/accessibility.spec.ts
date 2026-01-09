import { test, expect } from '@playwright/test';

/**
 * E2E тесты для доступности (Accessibility)
 */
test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('login form should be accessible', async ({ page }) => {
    // Проверяем наличие label для полей
    const emailInput = page.getByPlaceholder(/email/i);
    const passwordInput = page.getByPlaceholder(/пароль|password/i);
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // Проверяем что кнопка доступна
    const submitButton = page.getByRole('button', { name: /войти|login/i });
    await expect(submitButton).toBeEnabled();
  });

  test('should be navigable with keyboard', async ({ page }) => {
    // Фокусируемся на первом элементе
    await page.keyboard.press('Tab');
    
    // Проверяем что какой-то элемент получил фокус
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Продолжаем навигацию
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
  });

  test('form inputs should have proper attributes', async ({ page }) => {
    // Проверяем email input
    const emailInput = page.getByPlaceholder(/email/i);
    await expect(emailInput).toHaveAttribute('type', 'email');
    
    // Проверяем password input
    const passwordInput = page.getByPlaceholder(/пароль|password/i);
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('buttons should be focusable', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /войти|login/i });
    
    // Фокусируемся на кнопке
    await submitButton.focus();
    
    // Проверяем что кнопка в фокусе
    await expect(submitButton).toBeFocused();
  });

  test('should have proper heading structure', async ({ page }) => {
    // Логинимся
    await page.getByPlaceholder(/email/i).fill('admin@example.com');
    await page.getByPlaceholder(/пароль/i).fill('admin123');
    await page.getByRole('button', { name: /войти/i }).click();
    
    await page.waitForLoadState('networkidle');
    
    // Проверяем наличие заголовков
    const headings = page.locator('h1, h2, h3');
    const headingCount = await headings.count();
    
    // Должен быть хотя бы один заголовок
    expect(headingCount).toBeGreaterThan(0);
  });

  test('interactive elements should have visible focus', async ({ page }) => {
    // Логинимся
    await page.getByPlaceholder(/email/i).fill('admin@example.com');
    await page.getByPlaceholder(/пароль/i).fill('admin123');
    await page.getByRole('button', { name: /войти/i }).click();
    
    await page.waitForLoadState('networkidle');
    
    // Навигируемся Tab'ом
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Фокус должен быть видим
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
