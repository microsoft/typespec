import { expect, it } from "vitest";
import { findAreasChanged } from "./find-area-changed.js";

it("Should return package variables if package specific changes are detected", () => {
  const areas = findAreasChanged(["packages/http-client-csharp/src/constants.ts"]);
  expect(areas).toEqual(["CSharp"]);
});

it("Should return Core if common files are changed", () => {
  const areas = findAreasChanged(["packages/compiler/package.json"]);
  expect(areas).toEqual(["Core"]);
});

it("Should return a combination of core and isolated packages", () => {
  const areas = findAreasChanged([
    "packages/http-client-csharp/src/constants.ts",
    "packages/compiler/package.json",
  ]);
  expect(areas).toEqual(["CSharp", "Core"]);
});

it("Should return CSharp and Core if .editorconfig is changed", () => {
  const areas = findAreasChanged([".editorconfig"]);
  expect(areas).toEqual(["CSharp", "Core"]);
});

it("Should not return runCore for .prettierignore, .prettierrc.json, cspell.yaml, esling.config.json", () => {
  const areas = findAreasChanged([
    ".prettierignore",
    ".prettierrc.json",
    "cspell.yaml",
    "esling.config.json",
    "packages/http-client-csharp/emitter/src/constants.ts",
  ]);
  expect(areas).toEqual(["CSharp"]);
});
