import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "url";
import { expect, it } from "vitest";

it("requires publishable packages to declare their published files", () => {
  const packagesDir = fileURLToPath(new URL("../../../packages", import.meta.url));
  const packagesWithoutFiles = readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => {
      const packageJsonPath = join(packagesDir, entry.name, "package.json");

      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      return packageJson.private !== true && packageJson.files === undefined;
    })
    .map((entry) => entry.name);

  expect(packagesWithoutFiles).toEqual([]);
});
