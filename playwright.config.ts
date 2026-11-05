import { defineConfig } from '@playwright/test';

// Uses the pre-installed Chromium when present (cloud sandbox); otherwise Playwright's own.
import { existsSync } from 'node:fs';
const sandboxChrome = '/opt/pw-browsers/chromium';

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    launchOptions: {
      executablePath: existsSync(sandboxChrome) ? sandboxChrome : undefined,
      args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
    },
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
