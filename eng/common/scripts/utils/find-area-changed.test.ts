import { describe, expect, it } from "vitest";
import { findAreasChanged } from "./find-area-changed.js";

describe("paths that should trigger CSharp CI", () => {
  it.each(["packages/http-client-csharp/src/constants.ts"])("%s", (path) => {
    const areas = findAreasChanged([path]);
    expect(areas).toEqual(["CSharp"]);
  });
});

describe("paths that should trigger Core CI", () => {
  it.each([
    "packages/compiler/package.json",
    "packages/http/package.json",
    "packages/openapi3/package.json",
  ])("%s", (path) => {
    const areas = findAreasChanged([path]);
    expect(areas).toEqual(["Core"]);
  });
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
