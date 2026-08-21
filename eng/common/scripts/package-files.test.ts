import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

it("requires publishable packages to declare their published files", () => {
  const packagesDir = new URL("../../../packages", import.meta.url);
  const packagesWithoutFiles = readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => {
      const packageJsonPath = join(packagesDir.pathname, entry.name, "package.json");
      if (!existsSync(packageJsonPath)) return false;

      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      return packageJson.private !== true && packageJson.files === undefined;
    })
    .map((entry) => entry.name);

  expect(packagesWithoutFiles).toEqual([]);
});
