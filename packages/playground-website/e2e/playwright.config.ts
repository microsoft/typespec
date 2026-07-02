import { type PlaywrightTestConfig } from "@playwright/test";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  // Retry in CI to absorb the occasional slow cold-start of the wasm compiler worker.
  retries: process.env.CI ? 2 : 0,
  timeout: 120 * 1000,
  expect: { timeout: 15_000 },
  webServer: {
    // Serve the pre-built app (`test:e2e` depends on `build`) instead of the Vite
    // dev server. The dev server transforms the whole module graph (monaco + all
    // local TypeSpec libraries) on the first request, which could exceed the
    // navigation timeout and made the first test(s) flaky. `vite preview` serves
    // the static build, so the first navigation is fast and consistent.
    command: "vite preview --port 5173 --strictPort",
    port: 5173,
    cwd: root,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: resolve(root, "dist"),
    navigationTimeout: 60_000,
    actionTimeout: 30_000,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
    // {
    //   name: "firefox",
    //   use: { browserName: "firefox" },
    // },
  ],
  testMatch: "*.e2e.ts",
};
export default config;
