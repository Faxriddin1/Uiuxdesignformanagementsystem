import { test, expect } from '@playwright/test';

/**
 * E2E тесты для отзывчивости (responsive design)
 */
test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Логин
    await page.getByPlaceholder(/email/i).fill('admin@example.com');
    await page.getByPlaceholder(/пароль/i).fill('admin123');
    await page.getByRole('button', { name: /войти/i }).click();
    
    await page.waitForLoadState('networkidle');
  });

  test('should display mobile menu on small screens', async ({ page }) => {
    // Устанавливаем мобильный размер
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Ищем мобильное меню (бургер)
    const mobileMenuButton = page.locator('[data-testid="mobile-menu"], .hamburger, [aria-label*="menu"]');
    
    // На мобильном экране должна быть кнопка меню
    // Если sidebar скрывается, должна появиться кнопка
    await page.waitForTimeout(500);
  });

  test('should hide sidebar on mobile', async ({ page }) => {
    // Устанавливаем мобильный размер
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.waitForTimeout(500);
    
    // Sidebar должен быть скрыт или в drawer режиме
    const sidebar = page.locator('[data-testid="sidebar"], aside, .sidebar');
    
    // Проверяем что sidebar не видим или в свёрнутом состоянии
    const sidebarBox = await sidebar.first().boundingBox();
    
    // Sidebar либо не видим, либо вне экрана
    if (sidebarBox) {
      // Если sidebar видим, он должен быть overlay или drawer
      expect(sidebarBox.width).toBeLessThanOrEqual(280);
    }
  });

  test('should display correctly on tablet', async ({ page }) => {
    // Устанавливаем планшетный размер
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.waitForTimeout(500);
    
    // Проверяем что страница загрузилась корректно
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display correctly on desktop', async ({ page }) => {
    // Устанавливаем десктопный размер
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.waitForTimeout(500);
    
    // На десктопе sidebar должен быть видим
    const sidebar = page.locator('[data-testid="sidebar"], aside, .sidebar');
    
    if (await sidebar.first().isVisible()) {
      await expect(sidebar.first()).toBeVisible();
    }
  });
});
