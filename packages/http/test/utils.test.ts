import { describe, expect, it } from "vitest";
import { extractParamsFromPath } from "../src/utils.js";

describe("utils", () => {
  describe("extractParamsFromPath", () => {
    it("parse single param", () => {
      expect(extractParamsFromPath("foo/{name}/bar")).toEqual(["name"]);
    });

    it("parse param with -", () => {
      expect(extractParamsFromPath("foo/{foo-bar}/bar")).toEqual(["foo-bar"]);
    });

    it("parse multiple param", () => {
      expect(extractParamsFromPath("foo/{name}/bar/{age}")).toEqual(["name", "age"]);
    });

    it("parse single OData params", () => {
      expect(extractParamsFromPath("/certificates(thumbprint={thumbprint})/canceldelete")).toEqual([
        "thumbprint",
      ]);
    });
    it("parse multiple OData params", () => {
      expect(
        extractParamsFromPath(
          "/certificates(thumbprintAlgorithm={thumbprintAlgorithm},thumbprint={thumbprint})/canceldelete",
        ),
      ).toEqual(["thumbprintAlgorithm", "thumbprint"]);
    });
  });
});
