import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import config from "../vite.config.js";

const packages = [
  ["playground", ["react", "react-dom", "@fluentui/react-components", "@fluentui/react-icons"]],
  [
    "html-program-viewer",
    [
      "react",
      "react-dom",
      "@fluentui/react-components",
      "@fluentui/react-icons",
      "@fluentui/react-list",
    ],
  ],
] as const;

for (const [name, dependencies] of packages) {
  const manifest = JSON.parse(
    readFileSync(resolve(import.meta.dirname, `../../${name}/package.json`), "utf8"),
  );

  it(`${name} lets consumers provide shared UI dependencies`, () => {
    for (const dependency of dependencies) {
      expect(manifest.dependencies).not.toHaveProperty(dependency);
      expect(manifest.devDependencies[dependency]).toBe("catalog:");
      expect(manifest.peerDependencies[dependency]).toBe(
        dependency.startsWith("@fluentui/")
          ? dependency === "@fluentui/react-icons"
            ? "^2.0.0"
            : "^9.0.0"
          : "^19.0.0",
      );
    }
  });
}

it("keeps shared UI dependencies and their subpaths external to the playground bundle", () => {
  const external = config.build?.rolldownOptions?.external;
  expect(typeof external).toBe("function");
  if (typeof external !== "function") {
    return;
  }

  for (const dependency of packages[0][1]) {
    expect(external(dependency, undefined, false)).toBe(true);
    expect(external(`${dependency}/test-subpath`, undefined, false)).toBe(true);
  }
});
