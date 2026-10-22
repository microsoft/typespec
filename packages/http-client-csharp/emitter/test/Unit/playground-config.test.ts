import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("playground configuration", () => {
  it("publishes the HTTP client peer dependency for browser imports", async () => {
    const packageJson = JSON.parse(
      await readFile(new URL("../../../package.json", import.meta.url), "utf-8"),
    );

    expect(packageJson.playgroundConfig?.bundlePeerDependencies).toContain("@typespec/http-client");
  });

  it("only bundles declared peer dependencies", async () => {
    const packageJson = JSON.parse(
      await readFile(new URL("../../../package.json", import.meta.url), "utf-8"),
    );

    for (const dependency of packageJson.playgroundConfig?.bundlePeerDependencies ?? []) {
      expect(packageJson.peerDependencies).toHaveProperty(dependency);
    }
  });
});
