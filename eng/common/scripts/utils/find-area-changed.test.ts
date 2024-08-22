import { describe, expect, it } from "vitest";
import { findAreasChanged } from "./find-area-changed.js";

describe("paths that should trigger CSharp CI", () => {
  it.each([
    ["packages/http-client-csharp/src/constants.ts"],
    [
      "packages/http-client-csharp/eng/scripts/Test-CadlRanch.ps1",
      "packages/http-client-csharp/generator/TestProjects/CadlRanch.Tests/Infrastructure/AssemblyCleanFixture.cs",
      "packages/http-client-csharp/generator/TestProjects/CadlRanch.Tests/Infrastructure/CadlRanchServer.cs",
    ],
  ])("%s", (...paths) => {
    const areas = findAreasChanged(paths);
    expect(areas).toEqual(["CSharp"]);
  });
});

describe("paths that should trigger Java CI", () => {
  it.each([
    ["packages/http-client-java/emitter/src/emitter.ts"],
    [
      "packages/http-client-java/package.json",
      "packages/http-client-java/eng/scripts/Build-Packages.ps1",
    ],
  ])("%s", (...paths) => {
    const areas = findAreasChanged(paths);
    expect(areas).toEqual(["Java"]);
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

describe("paths that should trigger all isolated packages", () => {
  it.each([
    "eng/emitters/pipelines/templates/jobs/detect-api-changes.yml",
    "eng/emitters/pipelines/templates/jobs/test-job.yml",
  ])("%s", (path) => {
    const areas = findAreasChanged([path]);
    expect(areas).toEqual(["CSharp", "Java"]);
  });
});

it("Should return a combination of core and isolated packages", () => {
  const areas = findAreasChanged([
    "packages/http-client-csharp/src/constants.ts",
    "packages/http-client-java/src/emitter.ts",
    "packages/compiler/package.json",
  ]);
  expect(areas).toEqual(["CSharp", "Java", "Core"]);
});

it("Should return CSharp, Core and Java if .editorconfig is changed", () => {
  const areas = findAreasChanged([".editorconfig"]);
  expect(areas).toEqual(["CSharp", "Java", "Core"]);
});

it("Should not return Core for .prettierignore, .prettierrc.json, cspell.yaml, esling.config.json", () => {
  const areas = findAreasChanged([
    ".prettierignore",
    ".prettierrc.json",
    "cspell.yaml",
    "esling.config.json",
    "packages/http-client-csharp/emitter/src/constants.ts",
    "packages/http-client-java/emitter/src/emitter.ts",
  ]);
  expect(areas).toEqual(["CSharp", "Java"]);
});

it("should return Core for random files at the root", () => {
  const areas = findAreasChanged(["some.file", "file/in/deep/directory"]);
  expect(areas).toEqual(["Core"]);
});
