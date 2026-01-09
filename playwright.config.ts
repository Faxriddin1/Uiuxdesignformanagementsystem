import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 * 
 * Документация: https://playwright.dev/docs/test-configuration
 * 
 * Запуск:
 *   npx playwright test              # Все тесты
 *   npx playwright test --ui         # UI режим
 *   npx playwright test --headed     # С браузером
 *   npx playwright test --debug      # Debug режим
 */

export default defineConfig({
  // Директория с тестами
  testDir: './e2e',
  
  // Паттерн файлов тестов
  testMatch: '**/*.spec.ts',
  
  // Полный путь для результатов
  fullyParallel: true,
  
  // Не прерывать при первой ошибке в CI
  forbidOnly: !!process.env.CI,
  
  // Повторы при падении (только в CI)
  retries: process.env.CI ? 2 : 0,
  
  // Количество параллельных workers
  workers: process.env.CI ? 1 : undefined,
  
  // Репортеры
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-results.json' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  
  // Общие настройки для всех тестов
  use: {
    // Base URL для относительных путей
    baseURL: 'http://localhost:5173',
    
    // Скриншоты при падении
    screenshot: 'only-on-failure',
    
    // Видео при падении
    video: 'retain-on-failure',
    
    // Trace при падении
    trace: 'retain-on-failure',
    
    // Таймауты
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Таймаут на один тест
  timeout: 60000,
  
  // Expect таймаут
  expect: {
    timeout: 10000,
  },

  // Конфигурация проектов (браузеры)
  projects: [
    // Desktop Chrome
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Desktop Firefox
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // Desktop Safari
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile Chrome
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    // Mobile Safari
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Локальный сервер для разработки
  webServer: [
    // Backend
    {
      command: 'cd backend && python manage.py runserver 8000',
      url: 'http://localhost:8000/api/v1/health/',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    // Frontend
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],

  // Директория для артефактов
  outputDir: 'test-results/',
});
