import { defineConfig } from '@playwright/test';
const port = process.env.PLAYWRIGHT_PORT ?? '3000';
export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  use: {
    baseURL: `http://localhost:${port}`,
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run start -- --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
