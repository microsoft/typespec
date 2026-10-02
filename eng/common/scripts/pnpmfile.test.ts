import { expect, it } from "vitest";
import { hooks } from "./pnpmfile.js";

it.each(["typedoc", "@astrojs/check", "@astrojs/language-server"])(
  "isolates %s's JavaScript compiler API from the workspace TypeScript peer",
  (name) => {
    const pkg = {
      name,
      dependencies: { minimatch: "^9.0.0" },
      peerDependencies: { typescript: "5.x || 6.x" },
    };

    expect(hooks.readPackage(pkg)).toEqual({
      name,
      dependencies: { minimatch: "^9.0.0", typescript: "~6.0.2" },
      peerDependencies: {},
    });
  },
);

it("does not change the compiler used by other packages", () => {
  const pkg = {
    name: "@typespec/tspd",
    dependencies: { typescript: "~7.0.2" },
    peerDependencies: { typescript: "~7.0.2" },
  };
  const original = structuredClone(pkg);

  expect(hooks.readPackage(pkg)).toEqual(original);
});
