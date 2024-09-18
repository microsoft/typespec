import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { interpolatePath } from "../../src/core/helpers/path-interpolation.js";

describe("Path interpolation", () => {
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
});
