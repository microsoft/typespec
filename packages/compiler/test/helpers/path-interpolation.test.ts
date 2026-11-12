import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { interpolatePath, sanitizePathSegment } from "../../src/core/helpers/path-interpolation.js";

it("noop if there is nothing to interpolate", () => {
  strictEqual(interpolatePath("output.json", {}), "output.json");
});

it("interpolate variable inside of path", () => {
  strictEqual(interpolatePath("{version}/output.json", { version: "v1" }), "v1/output.json");
});

it("interpolate variable inside of filename", () => {
  strictEqual(interpolatePath("output.{version}.json", { version: "v1" }), "output.v1.json");
});

describe("when value to interpolate is undefined", () => {
  it("omit path segment if followed by /", () => {
    strictEqual(
      interpolatePath("dist/{version}/output.json", { serviceName: "PetStore" }),
      "dist/output.json",
    );
  });

  it("omit segment if the value is followed by .", () => {
    strictEqual(
      interpolatePath("dist/{version}.output.json", { serviceName: "PetStore" }),
      "dist/output.json",
    );
  });

  it("doesn't omit if in middle of path segment", () => {
    strictEqual(
      interpolatePath("dist/{version}-suffix/output.json", { serviceName: "PetStore" }),
      "dist/-suffix/output.json",
    );
  });
});

describe("sanitizePathSegment", () => {
  it.each([
    ["", ""],
    ["v1", "v1"],
    ["2021-10-01-preview", "2021-10-01-preview"],
    ["1.0.0", "1.0.0"],
    ["Pet.Store", "Pet.Store"],
    ["..dir", "..dir"],
    ["dir..", "dir.."],
  ])("keeps %j as is", (value, expected) => {
    strictEqual(sanitizePathSegment(value), expected);
  });

  it.each([
    ["../../etc/passwd", ".._.._etc_passwd"],
    ["..\\..\\windows\\system32", ".._.._windows_system32"],
    ["/etc/passwd", "_etc_passwd"],
    ["C:\\evil", "C__evil"],
    ["\\\\server\\share", "__server_share"],
    [".", "_"],
    ["..", "_"],
    ["....", "_"],
    ["v1/../../out", "v1_.._.._out"],
    ["with\0null", "with_null"],
  ])("sanitizes %j", (value, expected) => {
    strictEqual(sanitizePathSegment(value), expected);
  });
});
