import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "concurrently -k -s first \"node backend/test/e2e-server.js\" \"npm run dev --workspace frontend -- --host 127.0.0.1\"",
    url: "http://localhost:5173/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
