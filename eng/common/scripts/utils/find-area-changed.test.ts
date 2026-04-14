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

describe("paths that should trigger python CI", () => {
  it.each([
    ["packages/http-client-python/emitter/src/emitter.ts"],
    ["packages/http-client-python/package.json"],
  ])("%s", (...paths) => {
    const areas = findAreasChanged(paths);
    expect(areas).toEqual(["Python"]);
  });
});

describe("paths that should trigger all isolated packages", () => {
  it.each([
    "eng/emitters/pipelines/templates/jobs/detect-api-changes.yml",
    "eng/emitters/pipelines/templates/jobs/test-job.yml",
  ])("%s", (path) => {
    const areas = findAreasChanged([path]);
    expect(areas).toEqual(["CSharp", "Java", "Python"]);
  });
});

it("Should return a combination of isolated packages", () => {
  const areas = findAreasChanged([
    "packages/http-client-csharp/src/constants.ts",
    "packages/http-client-java/src/emitter.ts",
    "packages/http-client-python/src/emitter.ts",
    "packages/compiler/package.json",
  ]);
  expect(areas).toEqual(["CSharp", "Java", "Python"]);
});

it("Should return CSharp, Java and Python if .editorconfig is changed", () => {
  const areas = findAreasChanged([".editorconfig"]);
  expect(areas).toEqual(["CSharp", "Java", "Python"]);
});

it("Should not trigger CI for .prettierignore, .prettierrc.json, cspell.yaml, eslint.config.json alone", () => {
  const areas = findAreasChanged([
    ".prettierignore",
    ".prettierrc.json",
    "cspell.yaml",
    "eslint.config.json",
    "packages/http-client-csharp/emitter/src/constants.ts",
    "packages/http-client-java/emitter/src/emitter.ts",
    "packages/http-client-python/emitter/src/emitter.ts",
  ]);
  expect(areas).toEqual(["CSharp", "Java", "Python"]);
});

it("should not trigger any CI for random files at the root", () => {
  const areas = findAreasChanged(["some.file", "file/in/deep/directory"]);
  expect(areas).toEqual([]);
});
