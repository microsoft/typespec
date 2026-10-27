import { describe, expect, it } from "vitest";
import {
  fileURLToPath,
  parseNodeModuleSpecifier,
  pathToFileURL,
} from "../../src/module-resolver/utils.js";

it("returns null for relative imports ./", () => {
  expect(parseNodeModuleSpecifier("./foo")).toBeNull();
  expect(parseNodeModuleSpecifier("./foo.js")).toBeNull();
});
it("returns null for relative imports ../", () => {
  expect(parseNodeModuleSpecifier("../foo")).toBeNull();
  expect(parseNodeModuleSpecifier("../foo.js")).toBeNull();
});

it.each([
  ["foo", "foo", ""],
  ["foo-bar", "foo-bar", ""],
  ["foo/export", "foo", "export"],
  ["foo/nested/export", "foo", "nested/export"],
  ["@scope/pkg", "@scope/pkg", ""],
  ["@scope/pkg/export", "@scope/pkg", "export"],
  ["@scope/pkg/nested/export", "@scope/pkg", "nested/export"],
])("%s => pkg: %s, subPath: %s", (input, expectedPkg, expectedSubPath) => {
  const result = parseNodeModuleSpecifier(input);
  expect(result).toEqual({ packageName: expectedPkg, subPath: expectedSubPath });
});

describe("pathToFileURL", () => {
  it.each([
    ["/ws/proj", "file:///ws/proj"],
    ["//server/share/proj", "file://server/share/proj"],
  ])("%s => %s", (path, expected) => {
    expect(pathToFileURL(path)).toBe(expected);
  });
});

describe("fileURLToPath", () => {
  it.each([
    ["file:///ws/proj", "/ws/proj"],
    ["file://server/share/proj", "//server/share/proj"],
  ])("%s => %s", (url, expected) => {
    expect(fileURLToPath(url)).toBe(expected);
  });

  it.each(["/ws/proj", "C:/ws/proj", "//server/share/proj"])(
    "round trips %s through pathToFileURL",
    (path) => {
      expect(fileURLToPath(pathToFileURL(path))).toBe(path);
    },
  );
});
