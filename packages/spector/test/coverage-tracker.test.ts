import { existsSync, mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { CoverageTracker } from "../src/coverage/coverage-tracker.js";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "spector-coverage-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

it("creates missing parent directories before writing the coverage file", () => {
  const coverageFile = join(tempDir, "nested", "dir", "coverage.json");
  const tracker = new CoverageTracker(coverageFile);
  tracker.setScenarios([]);

  // saveCoverageSync is private and normally runs on process exit.
  (tracker as any).saveCoverageSync();

  expect(existsSync(coverageFile)).toBe(true);
  expect(JSON.parse(readFileSync(coverageFile, "utf-8"))).toEqual([]);
});
