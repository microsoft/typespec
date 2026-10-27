import { type PlaywrightTestConfig } from "@playwright/test";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  // Safety net for the occasional e2e flake in CI.
  retries: process.env.CI ? 1 : 0,
  timeout: 120 * 1000,
  expect: { timeout: 10_000 },
  webServer: {
    // Serve the pre-built app instead of the Vite dev server (`pnpm watch`).
    // The dev server transforms modules on demand and re-optimizes dependencies
    // on the first page load; discovering a new dependency mid-load triggers a
    // full page reload that aborts the in-flight `page.goto` (net::ERR_ABORTED),
    // which intermittently failed whichever test ran first. `vite preview` serves
    // the static build (the `test:e2e` task already depends on `build`), so there
    // is no on-demand transform, dependency re-optimization, or HMR reload.
    command: "vite preview --port 5173 --strictPort",
    port: 5173,
    cwd: root,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: resolve(root, "dist"),
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
